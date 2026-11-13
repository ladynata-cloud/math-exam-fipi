(function (root) {
  'use strict';

  const { lessons, checkpoint, repeat } = root.EgeMethodCourse || require('./content.js');
  const { parse } = root.AlgebraMath || require('../../ege-baza/algebra/math.js');
  const byId = new Map(lessons.map(lesson => [lesson.id, lesson]));
  const prefix = 'mathexam.ege-methods.v1.';
  const inputLimit = 48;
  const proofLimit = 500;
  const attemptLimit = 100000;
  const day = 86_400_000;
  const assessments = new Map([checkpoint, repeat].filter(Boolean).map(task => [task.id, task]));
  const modelRanges = { line: [-3, 3], packs: [0, 31], intersection: [3, 12] };
  const object = value => value && typeof value === 'object' && !Array.isArray(value);
  const count = value => Number.isInteger(value) && value >= 0 && value <= attemptLimit;
  const text = (value, limit) => typeof value === 'string' && value.length <= limit;
  const feedback = value => ['', 'missing', 'format', 'wrong'].includes(value);
  const cleanInput = value => String(value).replace(/[\u0000-\u001f\u007f]/g, '').slice(0, inputLimit);
  const cleanProof = value => String(value).replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').slice(0, proofLimit);

  function exactInteger(value) {
    const rational = parse(value);
    return rational?.d === 1 ? rational.n : null;
  }

  function checkDistribution(field, values) {
    if (values.length !== field.size) return 'size';
    if (values.some(value => value < field.min || value > field.max)) return 'range';
    if (values.reduce((total, value) => total + value, 0) !== field.total) return 'total';
    const targetCount = values.filter(value => field.atMost ? value <= field.target : value === field.target).length;
    if (targetCount !== field.targetCount) return 'target';
    return 'correct';
  }

  function check(field, input) {
    if (!input.trim()) return 'missing';
    if (field.kind === 'choice') return input === field.answer ? 'correct' : 'wrong';
    if (field.kind === 'integer') {
      const value = exactInteger(input);
      if (value === null) return 'format';
      return value === field.answer ? 'correct' : 'wrong';
    }
    const separator = field.kind === 'distribution' ? /\s*;\s*/ : /\s*(?:;|,\s+)\s*/;
    const values = input.trim().split(separator).map(exactInteger);
    if (values.some(value => value === null)) return 'format';
    if (field.kind === 'distribution') return checkDistribution(field, values);
    return values.length === field.answer.length && new Set(values).size === values.length &&
      values.every(value => field.answer.includes(value)) ? 'correct' : 'wrong';
  }

  function emptyPractice({ practice }) {
    return {
      drafts: practice.fields.map(() => ''), proof: '', attempts: 0,
      checked: false, done: false, review: false
    };
  }

  function empty(lesson) {
    return {
      guide: {
        solved: [], draft: '', misses: 0, hint: false, theory: false, feedback: '',
        model: lesson.model === 'packs' ? 0 : null
      },
      practice: emptyPractice(lesson)
    };
  }

  function validModel(lesson, value) {
    if (value === null) return lesson.model !== 'packs';
    const range = modelRanges[lesson.model];
    return !!range && Number.isInteger(value) && value >= range[0] && value <= range[1];
  }

  function validPractice(lesson, practice) {
    return object(practice) &&
      Array.isArray(practice.drafts) && practice.drafts.length === lesson.practice.fields.length &&
      practice.drafts.every(value => text(value, inputLimit)) &&
      text(practice.proof, lesson.practice.proof ? proofLimit : 0) && count(practice.attempts) &&
      typeof practice.checked === 'boolean' && typeof practice.done === 'boolean' && typeof practice.review === 'boolean' &&
      (!practice.done || (practice.checked && practice.attempts > 0 &&
        lesson.practice.fields.every((field, index) => check(field, practice.drafts[index]) === 'correct'))) &&
      (!practice.review || practice.done);
  }

  function validRecord(lesson, record) {
    const guide = record?.guide;
    return object(record) && object(guide) &&
      Array.isArray(guide.solved) && guide.solved.length <= lesson.steps.length &&
      guide.solved.every((value, index) => text(value, inputLimit) && check(lesson.steps[index].field, value) === 'correct') &&
      text(guide.draft, inputLimit) && count(guide.misses) && feedback(guide.feedback) &&
      typeof guide.hint === 'boolean' && typeof guide.theory === 'boolean' && validModel(lesson, guide.model) &&
      validPractice(lesson, record.practice);
  }

  function validAssessment(task, record) {
    return object(record) && validPractice(task, record.practice) &&
      (record.practice.done ? Number.isSafeInteger(record.completedAt) && record.completedAt > 0 &&
        record.completedAt < 8.64e15 - day : record.completedAt === null);
  }

  function repeatAt(record) {
    return record.practice.done ? record.completedAt + day : null;
  }

  function answerGuide(record, lesson, index, value) {
    const guide = record.guide;
    if (index !== guide.solved.length || !lesson.steps[index]) return;
    guide.draft = cleanInput(value);
    const result = check(lesson.steps[index].field, guide.draft);
    if (result === 'correct') {
      guide.solved.push(guide.draft);
      Object.assign(guide, { draft: '', misses: 0, hint: false, feedback: '' });
      return;
    }
    guide.feedback = result;
    if (result === 'wrong') guide.misses = Math.min(attemptLimit, guide.misses + 1);
    if (guide.misses >= 2) guide.hint = true;
  }

  function answerPractice(record, lesson, drafts) {
    const practice = record.practice;
    if (practice.done || drafts.length !== lesson.practice.fields.length) return;
    practice.drafts = drafts.map(cleanInput);
    const results = lesson.practice.fields.map((field, index) => check(field, practice.drafts[index]));
    practice.checked = true;
    if (results.some(result => result === 'missing' || result === 'format')) return;
    practice.attempts = Math.min(attemptLimit, practice.attempts + 1);
    practice.done = results.every(result => result === 'correct');
  }

  function answerAssessment(record, task, drafts, now = Date.now()) {
    if (record.practice.done) return;
    answerPractice(record, task, drafts);
    if (record.practice.done) record.completedAt = now;
  }

  function createProgress(storage, locks, warn, validate = validRecord, initial = empty, keyPrefix = prefix) {
    const memory = new Map();
    const unavailable = new Set();
    function block(id) {
      unavailable.add(id);
      warn();
    }
    function read(lesson) {
      const id = lesson.id;
      if (!unavailable.has(id)) {
        try {
          const raw = storage?.getItem(keyPrefix + id);
          if (raw != null) {
            const value = JSON.parse(raw);
            if (!validate(lesson, value)) throw Error('Invalid course record');
            memory.set(id, value);
          } else {
            memory.delete(id);
          }
        } catch {
          block(id);
        }
      }
      return structuredClone(memory.get(id) || initial(lesson));
    }
    function update(lesson, change) {
      const id = lesson.id;
      const key = keyPrefix + id;
      const write = () => {
        const value = read(lesson);
        change(value);
        memory.set(id, value);
        if (!unavailable.has(id)) {
          try {
            if (!storage) throw Error('Storage is unavailable');
            storage.setItem(key, JSON.stringify(value));
          } catch {
            block(id);
          }
        }
        return value;
      };
      return locks?.request ? locks.request(key, write) : Promise.resolve(write());
    }
    return { read, update };
  }

  const assessmentPrefix = 'mathexam.ege-methods.assessment.v1.';
  function createAssessmentProgress(storage, locks, warn) {
    return createProgress(storage, locks, warn, validAssessment,
      task => ({ practice: emptyPractice(task), completedAt: null }), assessmentPrefix);
  }

  function route(hash) {
    if (hash === '#progress') return { page: 'progress', id: null };
    const match = /^#(lesson|practice)\/([a-z-]+)$/.exec(hash);
    if (match && byId.has(match[2])) return { page: match[1], id: match[2] };
    return { page: 'map', id: null };
  }

  function personalRoute(hash) {
    const task = hash.slice(1);
    return assessments.has(task) ? { page: task, id: null } : route(hash);
  }

  function validRoom(value) {
    if (!object(value) || !object(value.view) || !object(value.records)) return false;
    const { page, id } = value.view;
    const routeValid = (page === 'map' || page === 'progress') ? id === null :
      (page === 'lesson' || page === 'practice') && byId.has(id);
    return routeValid && Object.entries(value.records).every(([key, record]) =>
      byId.has(key) && validRecord(byId.get(key), record));
  }

  const api = {
    answerAssessment, answerGuide, answerPractice, assessmentPrefix, assessments, byId, check, cleanInput,
    cleanProof, createAssessmentProgress, createProgress, empty, inputLimit, prefix, proofLimit,
    personalRoute, repeatAt, route, validRecord, validRoom
  };
  root.EgeMethodState = api;
  if (typeof module === 'object') module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
