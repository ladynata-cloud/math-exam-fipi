(function (root) {
  'use strict';

  // A bounded projection of the current shared scene. Personal storage and
  // unrelated course work are deliberately outside this transport adapter.
  const LIMITS = Object.freeze({ snapshotBytes: 60 * 1024, draft: 500, note: 2000, feedback: 1200, steps: 64, modelFields: 30 });
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const plain = value => !!value && typeof value === 'object' && !Array.isArray(value) &&
    [Object.prototype, null].includes(Object.getPrototypeOf(value));
  const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
  const noHtml = value => !/<\/?[a-z][^>]*>/i.test(value);
  const text = (value, limit) => typeof value === 'string' ? value.slice(0, limit) : '';
  const copy = value => JSON.parse(JSON.stringify(value));
  const exact = (pattern, value) => { const m = typeof value === 'string' && pattern.exec(value); return m && m[0] === value ? m : null; };
  const bytes = value => new TextEncoder().encode(JSON.stringify(value)).length;
  const stable = value => Array.isArray(value) ? value.map(stable) : plain(value) ?
    Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
  const equal = (left, right) => JSON.stringify(stable(left)) === JSON.stringify(stable(right));

  // Inspect descriptors, never values from accessors or an inherited toJSON.
  function safeJson(value, depth = 1, seen = new Set()) {
    if (depth > 8) return false;
    if (value === null || typeof value === 'boolean') return true;
    if (typeof value === 'number') return Number.isFinite(value);
    if (typeof value === 'string') return value.length <= 15000 && noHtml(value);
    if ((!plain(value) && !Array.isArray(value)) || seen.has(value)) return false;
    const keys = Reflect.ownKeys(value);
    if (Array.isArray(value) && (Object.getPrototypeOf(value) !== Array.prototype || value.length > 2000 ||
        keys.length !== value.length + 1 || !Array.from({ length: value.length }, (_, i) => own(value, i)).every(Boolean))) return false;
    seen.add(value);
    for (const key of keys) {
      if (Array.isArray(value) && key === 'length') continue;
      const d = Object.getOwnPropertyDescriptor(value, key);
      if (typeof key !== 'string' || ['__proto__', 'constructor', 'prototype'].includes(key) ||
          !d.enumerable || !own(d, 'value') || !safeJson(d.value, depth + 1, seen)) return false;
    }
    seen.delete(value);
    return true;
  }

  const blankLegacy = () => ({ version: 1, tasks: {}, practice: {}, last: null, origin: null });
  const blankWorkshop = () => ({ version: 1, revision: 0, entries: {}, checks: {}, models: {}, last: null });
  const blankView = () => ({ details: [], status: '', statusError: false, stepStatus: '', legacyStepFeedback: [],
    filter: { query: '', section: 'all' }, number: { part: 1, draft: '', submitted: null }, media: { gifPlaying: false } });

  function create({ lessons, topics, math }) {
    if (!Array.isArray(lessons) || !Array.isArray(topics) || !math?.check || !math?.parse || !math?.generate ||
        lessons.length !== 43 || topics.length !== 43) throw new TypeError('Incomplete Peterson 5 board course');
    const known = new Map(lessons.map(lesson => [lesson.id, lesson]));
    const authored = new Map(lessons.flatMap(lesson => lesson.tasks.map(task => [task.id, task])));
    const workshopTopics = new Map(topics.map(topic => [topic.id, topic]));
    const skills = new Set(math.skills.map(skill => skill.id));
    for (let i = 1; i <= 43; i++) {
      const id = 'p' + String(i).padStart(2, '0'), topic = workshopTopics.get(id);
      if (!known.has(id) || !topic?.discovery?.id || topic.practice?.length !== 2 || topic.check?.length !== 3)
        throw new TypeError('Incomplete Peterson 5 topic map');
    }

    function validRoute(route) {
      if (['#home', '#topics', '#skills', '#progress'].includes(route)) return true;
      let m = exact(/^#lesson\/(p\d{2})(?:\/(0|[1-9]\d?))?$/, route);
      if (m) return known.has(m[1]) && Number(m[2] || 0) < known.get(m[1]).tasks.length;
      m = exact(/^#practice\/([a-z-]+)\/([123])$/, route);
      if (m) return skills.has(m[1]);
      m = exact(/^#topic\/(p\d{2})\/(discover|practice|check)(?:\/([01]))?$/, route);
      return !!m && workshopTopics.has(m[1]) && (m[3] === undefined || m[2] === 'practice');
    }

    function resolveTask(id) {
      if (authored.has(id)) return authored.get(id);
      const m = exact(/^practice:([a-z-]+):([123]):([1-9]\d{0,5})$/, id);
      if (!m || !skills.has(m[1])) return null;
      return { ...math.generate(m[1], Number(m[3]), Number(m[2])), id };
    }

    function setValues(value) {
      const parts = String(value).trim().split(/[\s,;]+/);
      return parts.length && parts.every(item => /^\d+$/.test(item) && Number.isSafeInteger(Number(item))) ? parts.map(Number) : null;
    }
    function recognized(value, task) {
      if (!task || typeof task === 'string' || !String(value).trim() || task.kind === 'manual') return false;
      if (['choice', 'comparison'].includes(task.kind)) return task.choices ? task.choices.includes(value) : ['<', '=', '>'].includes(value);
      return task.kind === 'set' ? !!setValues(value) : !!math.parse(value);
    }
    function check(value, task) {
      if (!recognized(value, task)) return false;
      if (['choice', 'comparison'].includes(task.kind)) return value.trim() === String(task.answer).trim();
      if (task.kind === 'set') {
        const a = setValues(value), b = setValues(task.answer);
        return !!b && new Set(a).size === a.length && a.length === b.length && a.every(n => b.includes(n));
      }
      return math.check(value, task.answer, task.answerFormat);
    }
    function selected(raw) {
      if (raw === undefined || raw === null) return {};
      if (!plain(raw) || !safeJson(raw)) throw new TypeError('Unsafe shared record');
      return raw;
    }
    function model(raw) {
      raw = selected(raw);
      const out = {};
      // These are the actual control bounds in PetersonModels.mount. Accepting
      // looser values would let an observer display a silently clamped scene.
      const ranges = { step: [0, 4], n: [1, 100], d: [2, 10], a: [2, 30], b: [2, 30], num: [1, 5], den: [2, 6],
        k: [1, 4], trial: [1, 9], digit: [0, 9], whole: [5, 50], workers: [2, 8], hundredths: [1, 999], places: [0, 2], shown: [0, 6] };
      const inquiry = ['iq_draft', 'iq_first', 'iq_last', 'iq_transferDraft', 'iq_transferFirst', 'iq_transferLast'];
      if (Object.keys(raw).length > LIMITS.modelFields) throw new TypeError('Too many shared model controls');
      for (const [key, value] of Object.entries(raw)) {
        if (own(ranges, key)) {
          if (!integer(value, ...ranges[key])) throw new TypeError('Invalid shared model control');
          out[key] = value;
        } else if (['open', 'iq_open'].includes(key)) {
          if (typeof value !== 'boolean') throw new TypeError('Invalid shared model disclosure');
          out[key] = value;
        } else if (key === 'choice') {
          if (!['', 'true', 'false'].includes(value)) throw new TypeError('Invalid shared model choice');
          out[key] = value;
        } else if (inquiry.includes(key)) {
          if (typeof value !== 'string' || value.length > 200) throw new TypeError('Invalid shared model prediction');
          out[key] = value;
        } else throw new TypeError('Unknown shared model control');
      }
      return out;
    }
    function indices(raw, total) {
      raw = selected(raw);
      return Object.fromEntries(Object.entries(raw).filter(([key, value]) => exact(/^(0|[1-9]\d?)$/, key) && Number(key) < total && value === true));
    }
    function firstErrors(raw, task) {
      raw = selected(raw);
      const out = { steps: {} };
      function error(value, question) {
        if (!plain(value)) return null;
        const draft = text(value.value, 200);
        return recognized(draft, question) && !check(draft, question) ? { value: draft, assisted: true } : null;
      }
      const final = error(raw.final, task); if (final) out.final = final;
      for (const [key, value] of Object.entries(selected(raw.steps))) {
        if (!exact(/^(0|[1-9]\d?)$/, key) || Number(key) >= task.steps.length) continue;
        const found = error(value, task.steps[Number(key)]); if (found) out.steps[key] = found;
      }
      return out;
    }

    function legacyRecord(raw, task) {
      raw = selected(raw);
      const steps = task.steps || [], values = (Array.isArray(raw.values) ? raw.values : []).slice(0, steps.length).map(value => text(value, 200));
      const step = integer(raw.step, 0, steps.length) ? raw.step : 0;
      for (let i = 0; i < step; i++) if (typeof steps[i] !== 'string' && steps[i].answer !== undefined && !check(values[i] || '', steps[i]))
        throw new TypeError('Unearned shared legacy step');
      const value = text(raw.value, 200), attempts = integer(raw.attempts, 0, 1000000) ? raw.attempts : 0;
      const correct = raw.correct === true;
      if (correct && (!attempts || !check(value, task))) throw new TypeError('Invalid shared legacy completion');
      const signature = task.id.startsWith('practice:') ? (task.transfer?.skill === 'letter-product' || task.skills?.[0] === 'letter-product'
        ? 'letter-product:' + task.answer : task.prompt + '\u241f' + task.answer + '\u241f' + (task.answerFormat || '')) : '';
      return { value, values, step, revealed: integer(raw.revealed, 0, steps.length) ? raw.revealed : 0,
        guided: raw.guided === true, assisted: true, hint: raw.hint === true,
        stepHints: indices(raw.stepHints, steps.length), reveals: indices(raw.reveals, steps.length),
        attempts, correct, independent: false, reviewed: task.kind === 'manual' && raw.reviewed === true && !!text(raw.note, LIMITS.note).trim(),
        note: text(raw.note, LIMITS.note), feedback: text(raw.feedback, LIMITS.feedback), signature,
        repeated: task.id.startsWith('practice:') && raw.repeated === true,
        completion: correct ? { attempts, assisted: true, independent: false } : null,
        model: model(raw.model), firstErrors: firstErrors(raw.firstErrors, task) };
    }

    function workshopRecord(raw, task, discovery) {
      raw = selected(raw);
      const steps = task.steps || [], value = text(raw.value, LIMITS.draft);
      const first = recognized(text(raw.first, LIMITS.draft), task) ? text(raw.first, LIMITS.draft) : '';
      const firstWrong = recognized(text(raw.firstWrong, LIMITS.draft), task) && !check(text(raw.firstWrong, LIMITS.draft), task) ? text(raw.firstWrong, LIMITS.draft) : '';
      const attempts = integer(raw.attempts, 0, 100000) ? raw.attempts : 0;
      const stepValues = (Array.isArray(raw.stepValues) ? raw.stepValues : []).slice(0, steps.length).map(value => text(value, LIMITS.draft));
      const step = integer(raw.step, 0, steps.length) ? raw.step : 0;
      for (let i = 0; i < step; i++) if (!check(stepValues[i] || '', steps[i])) throw new TypeError('Unearned shared workshop step');
      const accepted = raw.accepted === true;
      if (accepted && (!attempts || !first || !check(value, task))) throw new TypeError('Invalid shared workshop completion');
      return { value, note: text(raw.note, LIMITS.note), attempts, first, firstWrong, accepted, aided: true,
        hints: integer(raw.hints, 0, 2) ? raw.hints : 0, solution: raw.solution === true, showSteps: raw.showSteps === true,
        step, stepValues, modelOpen: discovery && raw.modelOpen === true,
        ...(accepted ? { completion: { aided: true, attempts, first } } : {}) };
    }

    function projectLegacy(route, raw) {
      raw = plain(raw) ? raw : blankLegacy();
      const parts = route.slice(1).split('/'), out = blankLegacy();
      let task;
      if (parts[0] === 'lesson') task = known.get(parts[1]).tasks[Number(parts[2] || 0)];
      else {
        const key = parts[1] + ':' + parts[2], seed = raw.practice?.[key]?.seed ?? 1;
        if (!integer(seed, 1, 999999)) throw new TypeError('Invalid shared practice seed');
        task = resolveTask('practice:' + key + ':' + seed); out.practice[key] = { seed };
      }
      out.tasks[task.id] = legacyRecord(raw.tasks?.[task.id], task);
      out.last = { hash: parts[0] === 'lesson' ? '#lesson/' + parts[1] + '/' + Number(parts[2] || 0) : route };
      if (parts[0] === 'practice' && plain(raw.origin) && validRoute(raw.origin.hash) && raw.origin.hash.startsWith('#lesson/'))
        out.origin = { hash: raw.origin.hash, scroll: Number.isFinite(raw.origin.scroll) ? Math.max(0, Math.min(10000000, raw.origin.scroll)) : 0 };
      return out;
    }

    function projectWorkshop(route, raw) {
      raw = plain(raw) ? raw : blankWorkshop();
      const [, id, stage, position] = route.slice(1).split('/'), topic = workshopTopics.get(id), out = blankWorkshop();
      out.last = route;
      if (stage === 'check') {
        const source = selected(raw.checks?.[id]), result = { answers: {}, drafts: {}, aided: true };
        let open = null;
        for (const task of topic.check) {
          const value = source.answers?.[task.id];
          if (value !== undefined) {
            if (open || !recognized(text(value, LIMITS.draft), task)) throw new TypeError('Invalid shared checkpoint sequence');
            result.answers[task.id] = text(value, LIMITS.draft);
          } else if (!open) open = task;
        }
        if (open && typeof source.drafts?.[open.id] === 'string') result.drafts[open.id] = text(source.drafts[open.id], LIMITS.draft);
        out.checks[id] = result;
      } else {
        const task = stage === 'discover' ? topic.discovery : topic.practice[Number(position || 0)];
        out.entries[task.id] = workshopRecord(raw.entries?.[task.id], task, stage === 'discover');
        if (stage === 'discover') out.models[id] = model(raw.models?.[id]);
      }
      return out;
    }

    function projectView(raw) {
      raw = selected(raw);
      const out = blankView();
      if (Array.isArray(raw.details)) out.details = raw.details.slice(0, LIMITS.steps).map(value => value === true);
      out.status = text(raw.status, LIMITS.feedback); out.statusError = raw.statusError === true;
      out.stepStatus = text(raw.stepStatus, LIMITS.feedback);
      if (Array.isArray(raw.legacyStepFeedback)) out.legacyStepFeedback = raw.legacyStepFeedback.slice(0, LIMITS.steps).map(value => text(value, LIMITS.feedback));
      out.filter.query = text(raw.filter?.query, 100);
      out.filter.section = ['all', 'start', '1', '2'].includes(raw.filter?.section) ? raw.filter.section : 'all';
      out.number.part = raw.number?.part === 2 ? 2 : 1; out.number.draft = text(raw.number?.draft, 16);
      const submitted = raw.number?.submitted;
      if (submitted === 'invalid') out.number.submitted = 'invalid';
      else if (plain(submitted) && [1, 2].includes(submitted.part) && integer(submitted.number, 1, 9999))
        out.number.submitted = { part: submitted.part, number: submitted.number };
      out.media.gifPlaying = raw.media?.gifPlaying === true;
      return out;
    }

    function pack({ route, legacy, workshop, view }) {
      if (!validRoute(route)) throw new TypeError('Invalid Peterson 5 shared route');
      const result = { route, legacy: /^#(?:lesson|practice)\//.test(route) ? projectLegacy(route, legacy) : null,
        workshop: route.startsWith('#topic/') ? projectWorkshop(route, workshop) : null, view: projectView(view) };
      if (!safeJson(result) || bytes(result) > LIMITS.snapshotBytes) throw new TypeError('Unsafe or oversized Peterson 5 scene');
      return result;
    }
    function validateState(value) {
      try {
        return safeJson(value) && plain(value) && bytes(value) <= LIMITS.snapshotBytes && equal(value, pack(value));
      } catch (_) { return false; }
    }
    function unpack(value) {
      if (!validateState(value)) throw new TypeError('Invalid Peterson 5 shared scene');
      return { route: value.route, legacy: value.legacy ? copy(value.legacy) : blankLegacy(),
        workshop: value.workshop ? copy(value.workshop) : blankWorkshop(), view: copy(value.view) };
    }

    function readView(main, options = {}) {
      const out = blankView(), one = selector => main.querySelector(selector);
      out.details = [...main.querySelectorAll('details')].map(element => element.open);
      out.status = one('[data-w-status]')?.textContent || ''; out.statusError = one('[data-w-status]')?.classList.contains('is-error') || false;
      out.stepStatus = one('[data-w-step-status]')?.textContent || '';
      out.legacyStepFeedback = [...main.querySelectorAll('[id^="step-feedback-"]')].map(element => element.textContent || '');
      out.filter.query = one('#workshop-filter')?.value || '';
      out.filter.section = one('[data-w-filter][aria-pressed="true"]')?.dataset.wFilter || 'all';
      out.number.part = Number(one('#book-part')?.value) === 2 ? 2 : 1;
      out.number.draft = one('#exercise-number')?.value || '';
      const found = one('#number-result h3')?.textContent.match(/Часть ([12])\s*·\s*№\s*(\d+)/);
      if (found) out.number.submitted = { part: Number(found[1]), number: Number(found[2]) };
      else if (one('#number-result')?.textContent.trim()) out.number.submitted = 'invalid';
      out.media = options.media || out.media;
      return projectView(out);
    }
    function applyView(main, value, options = {}) {
      if (!safeJson(value) || !equal(value, projectView(value))) throw new TypeError('Invalid Peterson 5 shared view');
      const one = selector => main.querySelector(selector), win = main.ownerDocument.defaultView;
      const filter = one('#workshop-filter');
      if (filter) {
        filter.value = value.filter.query;
        const section = [...main.querySelectorAll('[data-w-filter]')].find(element => element.dataset.wFilter === value.filter.section);
        if (section && section.getAttribute('aria-pressed') !== 'true') section.click();
        filter.dispatchEvent(new win.Event('input', { bubbles: true }));
      }
      const part = one('#book-part'), number = one('#exercise-number');
      if (part) part.value = String(value.number.part);
      if (number) {
        number.value = value.number.draft;
        if (value.number.submitted) options.findNumber?.(value.number.submitted === 'invalid' ? NaN : value.number.submitted.number,
          value.number.submitted === 'invalid' ? value.number.part : value.number.submitted.part);
      }
      const details = [...main.querySelectorAll('details')];
      if (details.length !== value.details.length) throw new TypeError('Shared disclosure layout mismatch');
      details.forEach((element, i) => { element.open = value.details[i]; });
      const status = one('[data-w-status]');
      if (status) { status.textContent = value.status; status.className = 'workshop-feedback' + (value.statusError ? ' is-error' : ''); }
      const step = one('[data-w-step-status]'); if (step) step.textContent = value.stepStatus;
      const legacyFeedback = [...main.querySelectorAll('[id^="step-feedback-"]')];
      if (legacyFeedback.length !== value.legacyStepFeedback.length) throw new TypeError('Shared step layout mismatch');
      legacyFeedback.forEach((element, i) => { element.textContent = value.legacyStepFeedback[i]; });
      options.applyMedia?.(copy(value.media));
    }

    return Object.freeze({ validRoute, resolveTask, pack, unpack, validateState, readView, applyView, blankView, blankLegacy, blankWorkshop });
  }

  const api = Object.freeze({ id: 'peterson5', path: '/trainers/peterson5.html', marker: 'parts1-2',
    version: '1.0.0', stateSchemaVersion: 1, defaultRoute: '#home', limits: LIMITS, create });
  root.Peterson5Board = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
