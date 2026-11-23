/* Local assessment sessions. Existing course and game records are read-only inputs. */
(function (root) {
  'use strict';
  const key = 'mathexam.arzhenikov.completion.v1';
  const modes = ['placement', 'review', 'final'];
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const own = (value, name) => object(value) && Object.prototype.hasOwnProperty.call(value, name);
  const number = (value, min = 0, max = 1000000, fallback = min) => Number.isInteger(value) && value >= min && value <= max ? value : fallback;
  const short = (value, max = 40) => typeof value === 'string' ? value.slice(0, max) : '';
  const validId = value => typeof value === 'string' && /^[a-z][a-z0-9-]{0,99}$/.test(value) && !['constructor', 'prototype'].includes(value);
  const timestamp = value => Number.isSafeInteger(value) && value >= 0 ? value : null;
  const copy = value => JSON.parse(JSON.stringify(value));
  const itemsOf = bank => (Array.isArray(bank) ? bank : bank?.items || []).filter(item => object(item) && validId(item.id) && modes.includes(item.pool));
  const itemMap = bank => new Map(itemsOf(bank).map(item => [item.id, item]));
  const lessonIds = item => [...new Set([item.lessonId, ...(Array.isArray(item.lessonIds) ? item.lessonIds : [])].filter(validId))];
  const fresh = () => ({version: 1, active: null, sessions: {placement: null, review: null, final: null}, history: {}});
  function entryFor(item, presentation = 0) {
    return {id: item.id, presentation, input: '', attempts: 0, wrong: 0, firstInput: null,
      firstCorrect: null, firstHelpUsed: null, helpUsed: false,
      help: {hint: false, solution: false}, helpAt: {hint: null, solution: null}, helpAtReason: {hint: null, solution: null},
      solved: false, skipped: false,
      reason: {required: Boolean(item.reason), choice: '', attempts: 0, wrong: 0, firstChoice: null,
        firstCorrect: null, firstHelpUsed: null, solved: !item.reason}};
  }
  const done = entry => entry.skipped || (entry.solved && entry.reason.solved);
  const independent = entry => entry.presentation === 1 && !entry.skipped && entry.solved && entry.firstCorrect === true && entry.firstHelpUsed === false;
  const sessionFor = state => modes.includes(state?.active) ? state.sessions?.[state.active] : null;
  function current(state) {
    const session = sessionFor(state);
    return session && session.completedAt === null ? session.entries[session.itemIds[session.cursor]] || null : null;
  }
  function syncHistory(state, entry) {
    if (!entry || entry.presentation < 1) return;
    const previous = own(state.history, entry.id) ? state.history[entry.id] : null;
    const history = previous || {presentations: entry.presentation, externalSeen: entry.presentation > 1, first: null, latest: null};
    history.presentations = Math.max(history.presentations, entry.presentation);
    if (entry.presentation === 1) history.first = copy(entry);
    if (!history.latest || entry.presentation >= history.latest.presentation) history.latest = copy(entry);
    state.history[entry.id] = history;
  }
  function expose(state, entry, item) {
    if (!entry || entry.presentation) return;
    const history = own(state.history, entry.id) ? state.history[entry.id] : null;
    entry.presentation = Math.max(history?.presentations || 0, item.previouslySeen === true ? 1 : 0) + 1;
    if (!history && item.previouslySeen === true) state.history[entry.id] = {presentations: 1, externalSeen: true, first: null, latest: null};
    syncHistory(state, entry);
  }
  function hasAction(task) {
    if (!object(task)) return false;
    if (Number(task.attempts) > 0 || Number(task.moves) > 0 || short(task.input).trim() || task.helpUsed === true || task.hint === true || task.modelShown === true || task.everSolved === true) return true;
    return object(task.steps) && Object.values(task.steps).some(step => object(step) && (Number(step.attempts) > 0 || short(step.input).trim() || step.hint === true));
  }
  function eligibleLessonIds(courseState) {
    if (!object(courseState?.lessons)) return [];
    return Object.entries(courseState.lessons).filter(([id, rec]) => validId(id) && object(rec) &&
      (Number(rec.visits) > 0 || (object(rec.tasks) && Object.values(rec.tasks).some(hasAction)))).map(([id]) => id);
  }
  function courseWeakness(rec) {
    if (!object(rec)) return 0;
    const tasks = object(rec.tasks) ? Object.values(rec.tasks) : [];
    return tasks.reduce((score, task) => Math.max(score, !object(task) ? 0 :
      (task.firstCorrect === false || Number(task.wrong) > 0 ? 4 : 0) + (task.helpUsed === true || task.firstHelpUsed === true ? 2 : 0)), 0);
  }
  function selectItems(mode, bank, options = {}) {
    if (!modes.includes(mode)) return [];
    const items = itemsOf(bank).filter(item => item.pool === mode);
    if (mode === 'placement') return items.map((item, index) => ({item,index,
      shown: options.history?.[item.id]?.presentations || 0,
      order: Number.isInteger(item.placementOrder) ? item.placementOrder : 8 + index}))
      .sort((a, b) => a.shown - b.shown || a.order - b.order).slice(0, 8).map(row => row.item.id);
    if (mode === 'final') return items.map(item => item.id);
    const eligible = new Set(options.eligibleLessonIds || eligibleLessonIds(options.courseState));
    const history = object(options.history) ? options.history : {};
    const candidates = items.filter(item => lessonIds(item).some(id => eligible.has(id))).map((item, index) => {
      const record = own(history, item.id) ? history[item.id] : null;
      const last = record?.latest;
      const weakness = last ? (last.skipped ? 8 : 0) + (last.firstCorrect === false || Number(last.wrong) > 0 ? 4 : 0) + (last.helpUsed ? 2 : 0) :
        Math.max(0, ...lessonIds(item).map(id => courseWeakness(options.courseState?.lessons?.[id])));
      return {item, index, weakness, shown: Math.max(record?.presentations || 0, item.previouslySeen ? 1 : 0)};
    });
    const groups = new Map();
    for (const candidate of candidates) {
      const family = candidate.item.family || candidate.item.lessonId || candidate.item.skill || candidate.item.id;
      if (!groups.has(family)) groups.set(family, []);
      groups.get(family).push(candidate);
    }
    const ranked = [...groups.values()].map(group => {
      const chosen = [...group].sort((a, b) => a.shown - b.shown || a.index - b.index)[0];
      return {...chosen, weakness: Math.max(...group.map(candidate => candidate.weakness))};
    }).sort((a, b) => b.weakness - a.weakness || a.shown - b.shown || a.index - b.index);
    const selected = [], usedLessons = new Set();
    for (const candidate of ranked) {
      const associated = lessonIds(candidate.item);
      if (associated.some(id => usedLessons.has(id))) continue;
      associated.forEach(id => usedLessons.add(id)); selected.push(candidate.item.id);
      if (selected.length >= number(options.limit, 1, 6, 6)) break;
    }
    return selected;
  }
  function start(state, options, bank) {
    const {mode, itemIds} = options || {};
    if (!modes.includes(mode)) return null;
    const previous = state.sessions[mode];
    if (previous && previous.completedAt === null) { state.active = mode; return previous; }
    const byId = itemMap(bank);
    if (!Array.isArray(itemIds) || !itemIds.length || itemIds.length > (mode === 'review' ? 6 : mode === 'placement' ? 8 : 64) ||
      new Set(itemIds).size !== itemIds.length || itemIds.some(id => byId.get(id)?.pool !== mode)) return null;
    const entries = Object.fromEntries(itemIds.map(id => [id, entryFor(byId.get(id))]));
    const session = {mode, itemIds: [...itemIds], cursor: 0, entries, startedAt: timestamp(options.now) ?? Date.now(), completedAt: null};
    state.active = mode; state.sessions[mode] = session;
    expose(state, entries[itemIds[0]], byId.get(itemIds[0]));
    return session;
  }
  function setInput(state, input) {
    const entry = current(state);
    if (!entry || entry.solved || entry.skipped) return false;
    entry.input = short(input); syncHistory(state, entry); return true;
  }
  function setReason(state, choice) {
    const entry = current(state);
    if (!entry || entry.skipped || entry.reason.solved || !entry.reason.required) return false;
    entry.reason.choice = short(choice, 100); syncHistory(state, entry); return true;
  }
  function recordHelp(state, entry, kind) {
    if (!entry || done(entry) || !['hint', 'solution'].includes(kind)) return false;
    if (!entry.help[kind]) {
      entry.help[kind] = true; entry.helpAt[kind] = entry.attempts; entry.helpAtReason[kind] = entry.reason.attempts;
    }
    entry.helpUsed = true; syncHistory(state, entry); return true;
  }
  function useHelp(state, kind) { return recordHelp(state, current(state), kind); }
  function useLessonHelp(state, lessonId, bank) {
    if (!validId(lessonId)) return false;
    const byId = itemMap(bank);
    let changed = false;
    for (const mode of modes) {
      const session = state.sessions[mode];
      if (!session || session.completedAt !== null) continue;
      const entry = session.entries[session.itemIds[session.cursor]], item = entry && byId.get(entry.id);
      // Only an exposed, unfinished question on this topic receives assistance.
      // A paused check is still affected, without changing the active route or
      // rewriting a numerical first answer given before the lesson was opened.
      if (entry?.presentation && item && lessonIds(item).includes(lessonId) && !entry.help.hint) {
        changed = recordHelp(state, entry, 'hint') || changed;
      }
    }
    return changed;
  }
  function answerCheck(item, input, checker) {
    if (typeof checker !== 'function') return {kind: 'format', message: 'Проверка ответа сейчас недоступна.'};
    try { return checker(item, input); } catch { return {kind: 'format', message: 'Проверь запись ответа.'}; }
  }
  function submit(state, bank, checker, options = {}) {
    const entry = current(state), item = entry && itemMap(bank).get(entry.id);
    if (!item || entry.skipped) return {kind: 'blocked', message: 'Открой незавершённое задание.'};
    if (options.field === 'reason') {
      if (!entry.solved) return {kind: 'blocked', message: 'Сначала проверь числовой ответ.'};
      if (!item.reason || entry.reason.solved) return {kind: 'correct', message: 'Объяснение уже принято.'};
      const reason = entry.reason;
      if (!item.reason.options.some(option => option.id === reason.choice)) return {kind: 'format', message: 'Выбери объяснение.'};
      const correct = reason.choice === item.reason.answer;
      if (reason.firstCorrect === null) { reason.firstChoice = reason.choice; reason.firstCorrect = correct; reason.firstHelpUsed = entry.helpUsed; }
      reason.attempts += 1; if (!correct) reason.wrong += 1;
      reason.solved = correct; syncHistory(state, entry);
      return {kind: correct ? 'correct' : 'wrong', message: correct ? 'Объяснение принято.' : 'Это объяснение пока не подходит. Можно попробовать снова или открыть помощь.'};
    }
    if (entry.solved) return {kind: 'correct', message: 'Ответ уже принят.'};
    const result = answerCheck(item, entry.input, checker);
    if (result.kind === 'format') return result;
    const correct = result.kind === 'correct';
    if (entry.firstCorrect === null) { entry.firstInput = entry.input; entry.firstCorrect = correct; entry.firstHelpUsed = entry.helpUsed; }
    entry.attempts += 1; if (!correct) entry.wrong += 1;
    entry.solved = correct; syncHistory(state, entry);
    return {kind: correct ? 'correct' : 'wrong', message: correct ? 'Ответ принят.' : 'Ответ пока не подходит. Можно попробовать снова или открыть помощь.'};
  }
  function skip(state) {
    const entry = current(state);
    if (!entry || done(entry)) return false;
    entry.skipped = true; syncHistory(state, entry); return true;
  }
  function next(state, bank, now = Date.now()) {
    const session = sessionFor(state), entry = current(state);
    if (!entry || !done(entry)) return false;
    if (session.cursor + 1 >= session.itemIds.length) { session.cursor = session.itemIds.length; session.completedAt = timestamp(now) ?? Date.now(); }
    else {
      session.cursor += 1;
      const nextEntry = session.entries[session.itemIds[session.cursor]], item = itemMap(bank).get(nextEntry.id);
      if (!item) { session.cursor -= 1; return false; }
      expose(state, nextEntry, item);
    }
    return true;
  }
  function normalizeEntry(raw, item, checker) {
    const entry = entryFor(item);
    if (!object(raw) || raw.id !== item.id) return entry;
    entry.presentation = number(raw.presentation);
    if (!entry.presentation) return entry;
    entry.input = short(raw.input); entry.attempts = number(raw.attempts); entry.wrong = number(raw.wrong, 0, entry.attempts);
    for (const kind of ['hint', 'solution']) {
      entry.help[kind] = raw.help?.[kind] === true;
      if (entry.help[kind]) {
        entry.helpAt[kind] = number(raw.helpAt?.[kind], 0, entry.attempts);
        entry.helpAtReason[kind] = number(raw.helpAtReason?.[kind]);
      }
    }
    entry.helpUsed = raw.helpUsed === true || entry.help.hint || entry.help.solution;
    const beforeMath = Object.values(entry.helpAt).some(value => value === 0) || (entry.helpUsed && !entry.help.hint && !entry.help.solution);
    if (entry.attempts && typeof raw.firstInput === 'string') {
      const first = answerCheck(item, short(raw.firstInput), checker);
      if (['correct', 'wrong'].includes(first.kind) && raw.firstCorrect === (first.kind === 'correct')) {
        entry.firstInput = short(raw.firstInput); entry.firstCorrect = first.kind === 'correct';
        entry.firstHelpUsed = raw.firstHelpUsed !== false || beforeMath;
      }
    }
    entry.solved = raw.solved === true && entry.firstCorrect !== null && entry.attempts === entry.wrong + 1 &&
      (entry.firstCorrect ? entry.wrong === 0 : entry.wrong > 0) && answerCheck(item, entry.input, checker).kind === 'correct';
    entry.skipped = raw.skipped === true;
    if (item.reason && object(raw.reason)) {
      const reason = entry.reason, source = raw.reason, validChoice = choice => item.reason.options.some(option => option.id === choice);
      reason.choice = validChoice(source.choice) ? source.choice : '';
      reason.attempts = number(source.attempts); reason.wrong = number(source.wrong, 0, reason.attempts);
      for (const kind of ['hint', 'solution']) if (entry.help[kind]) entry.helpAtReason[kind] = number(raw.helpAtReason?.[kind], 0, reason.attempts);
      if (reason.attempts && validChoice(source.firstChoice) && source.firstCorrect === (source.firstChoice === item.reason.answer)) {
        reason.firstChoice = source.firstChoice; reason.firstCorrect = source.firstChoice === item.reason.answer;
        reason.firstHelpUsed = source.firstHelpUsed !== false || Object.values(entry.helpAtReason).some(value => value === 0) || (entry.helpUsed && !entry.help.hint && !entry.help.solution);
      }
      reason.solved = entry.solved && source.solved === true && reason.firstCorrect !== null && reason.choice === item.reason.answer &&
        reason.attempts === reason.wrong + 1 && (reason.firstCorrect ? reason.wrong === 0 : reason.wrong > 0);
    }
    return entry;
  }
  function mergeEvidence(entry, saved, item, checker) {
    if (!saved || saved.presentation !== entry.presentation) return entry;
    const merged = copy(entry);
    const math = saved.solved || saved.attempts > entry.attempts ? saved : entry;
    merged.input = math.input;
    merged.attempts = Math.max(entry.attempts, saved.attempts); merged.wrong = Math.max(entry.wrong, saved.wrong);
    merged.solved = entry.solved || saved.solved; merged.skipped = entry.skipped || saved.skipped;
    // A record of an error or help is irreversible, including before the first answer.
    const first = [saved, entry].find(record => record.firstCorrect === false) || [saved, entry].find(record => record.firstCorrect !== null);
    if (first) { merged.firstInput = first.firstInput; merged.firstCorrect = first.firstCorrect; }
    merged.firstHelpUsed = first ? entry.firstHelpUsed === true || saved.firstHelpUsed === true : null;
    merged.helpUsed = entry.helpUsed || saved.helpUsed;
    for (const kind of ['hint', 'solution']) {
      merged.help[kind] = entry.help[kind] || saved.help[kind];
      const mathTimes = [entry.helpAt[kind], saved.helpAt[kind]].filter(value => value !== null);
      const reasonTimes = [entry.helpAtReason[kind], saved.helpAtReason[kind]].filter(value => value !== null);
      merged.helpAt[kind] = mathTimes.length ? Math.min(...mathTimes) : null;
      merged.helpAtReason[kind] = reasonTimes.length ? Math.min(...reasonTimes) : null;
    }
    if (item.reason) {
      const prior = saved.reason, later = entry.reason, reason = merged.reason;
      reason.choice = prior.solved || prior.attempts > later.attempts ? prior.choice : later.choice;
      reason.attempts = Math.max(prior.attempts, later.attempts); reason.wrong = Math.max(prior.wrong, later.wrong);
      reason.solved = prior.solved || later.solved;
      const firstReason = [prior, later].find(record => record.firstCorrect === false) || [prior, later].find(record => record.firstCorrect !== null);
      if (firstReason) { reason.firstChoice = firstReason.firstChoice; reason.firstCorrect = firstReason.firstCorrect; }
      reason.firstHelpUsed = firstReason ? prior.firstHelpUsed === true || later.firstHelpUsed === true : null;
    }
    // Validate the combined record again: conflicting counters cannot manufacture success.
    return normalizeEntry(merged, item, checker);
  }
  function normalize(raw, bank, checker) {
    const state = fresh(), byId = itemMap(bank);
    if (!object(raw) || raw.version !== 1 || !object(raw.sessions) || !object(raw.history)) return state;
    for (const [id, item] of byId) {
      const saved = own(raw.history, id) && raw.history[id];
      if (!object(saved) || !number(saved.presentations)) continue;
      const history = {presentations: number(saved.presentations), externalSeen: saved.externalSeen === true, first: null, latest: null};
      if (object(saved.first) && saved.first.presentation === 1) history.first = normalizeEntry(saved.first, item, checker);
      if (object(saved.latest) && number(saved.latest.presentation, 1, history.presentations, 0)) history.latest = normalizeEntry(saved.latest, item, checker);
      if (history.first?.presentation !== 1) history.first = null;
      if (!history.latest?.presentation) history.latest = null;
      state.history[id] = history;
    }
    for (const mode of modes) {
      const source = raw.sessions[mode], max = mode === 'review' ? 6 : mode === 'placement' ? 8 : 64;
      if (!object(source) || source.mode !== mode || !Array.isArray(source.itemIds) || !source.itemIds.length || source.itemIds.length > max ||
        new Set(source.itemIds).size !== source.itemIds.length || source.itemIds.some(id => byId.get(id)?.pool !== mode) || !object(source.entries)) continue;
      const session = {mode, itemIds: [...source.itemIds], cursor: number(source.cursor, 0, source.itemIds.length), entries: {},
        startedAt: timestamp(source.startedAt), completedAt: null};
      for (const id of session.itemIds) {
        const item = byId.get(id), history = state.history[id];
        let entry = normalizeEntry(source.entries[id], item, checker);
        entry = mergeEvidence(entry, history?.first, item, checker);
        entry = mergeEvidence(entry, history?.latest, item, checker);
        session.entries[id] = entry;
      }
      const firstUnfinished = session.itemIds.findIndex(id => !session.entries[id].presentation || !done(session.entries[id]));
      if (firstUnfinished !== -1 && firstUnfinished < session.cursor) session.cursor = firstUnfinished;
      const complete = firstUnfinished === -1 && timestamp(source.completedAt) !== null && source.cursor === session.itemIds.length;
      if (complete) { session.completedAt = timestamp(source.completedAt); session.cursor = session.itemIds.length; }
      else session.cursor = Math.min(session.cursor, session.itemIds.length - 1);
      session.itemIds.forEach((id, index) => {
        if (index > session.cursor && !complete) session.entries[id] = entryFor(byId.get(id));
        else {
          const entry = session.entries[id];
          if (!entry.presentation) expose(state, entry, byId.get(id));
          syncHistory(state, entry);
        }
      });
      state.sessions[mode] = session;
    }
    if (modes.includes(raw.active) && state.sessions[raw.active]) state.active = raw.active;
    return state;
  }
  function summary(state, bank, mode = state.active) {
    const session = state.sessions?.[mode], byId = itemMap(bank), results = [];
    if (session) for (const id of session.itemIds) {
      const entry = session.entries[id], item = byId.get(id);
      if (!item) continue;
      results.push({...copy(entry), lessonId: item.lessonId, lessonIds: lessonIds(item), skill: item.skill, family: item.family,
        fresh: entry.presentation === 1, independent: independent(entry), corrected: entry.solved && entry.firstCorrect === false,
        complete: done(entry), familiarPractice: item.familiarPractice === true});
    }
    const recommendedLessonIds = [...new Set(results.filter(result => result.presentation &&
      (result.skipped || !result.solved || result.firstCorrect !== true || result.firstHelpUsed !== false ||
        (result.reason.required && (!result.reason.solved || result.reason.firstCorrect !== true || result.reason.firstHelpUsed !== false))))
      .flatMap(result => result.lessonIds))];
    return {mode, started: Boolean(session), complete: Boolean(session && session.completedAt !== null), completedAt: session?.completedAt ?? null,
      total: results.length, finished: results.filter(result => result.complete).length, attempted: results.filter(result => result.attempts > 0).length,
      correct: results.filter(result => result.solved).length, independent: results.filter(result => result.independent).length,
      helped: results.filter(result => result.helpUsed).length, corrected: results.filter(result => result.corrected).length,
      skipped: results.filter(result => result.skipped).length, familiar: results.filter(result => result.presentation > 1).length,
      reasonTotal: results.filter(result => result.reason.required).length, reasonCorrect: results.filter(result => result.reason.required && result.reason.solved).length,
      reasonIndependent: results.filter(result => result.presentation === 1 && !result.skipped && result.reason.required && result.reason.solved && result.reason.firstCorrect === true && result.reason.firstHelpUsed === false).length,
      results, recommendedLessonIds};
  }
  const api = {key, fresh, normalize, eligibleLessonIds, selectItems, start, current, setInput, setReason, useHelp, useLessonHelp, submit, skip, next, summary};
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ArzhenikovCompletionEngine = api;
})(typeof window === 'object' ? window : globalThis);
