(() => {
  'use strict';

  const storageKey = 'mathexam.profile-alphabets.v1.';
  const normalize = value => String(value).replaceAll('²', '^2').normalize('NFKC').toLowerCase().trim()
    .replace(/[−–—]/g, '-').replace(/[·×*]/g, '').replace(/\s+/g, '')
    .replace(/[\u0430\u0432\u0441\u0435\u043e\u0442\u043c\u043d\u0440\u0445]/g,
      letter => ({ а: 'a', в: 'b', с: 'c', е: 'e', о: 'o', т: 't', м: 'm', н: 'h', р: 'p', х: 'x' })[letter]);

  function fraction(value) {
    const ratio = /^([+-]?\d+)\/([+-]?\d+)$/.exec(value);
    if (ratio) return BigInt(ratio[2]) ? [BigInt(ratio[1]), BigInt(ratio[2])] : null;
    const decimal = /^([+-]?)(\d*)(?:[,.](\d*))?$/.exec(value);
    if (!decimal || !(decimal[2] || decimal[3])) return null;
    const digits = decimal[3] || '';
    return [BigInt(decimal[1] + decimal[2] + digits), 10n ** BigInt(digits.length)];
  }

  function matches(raw, answers) {
    if (typeof raw !== 'string' || raw.length > 120) return false;
    // A typed multiplication sign belongs to algebraic text, not to a number.
    const numeric = value => String(value).normalize('NFKC').replace(/[−–—]/g, '-').trim().replace(/\s*\/\s*/g, '/');
    const input = normalize(raw);
    if (!input) return false;
    const value = fraction(numeric(raw));
    return answers.some(answer => {
      const expected = fraction(numeric(answer));
      return expected ? Boolean(value && value[0] * expected[1] === expected[0] * value[1]) : input === normalize(answer);
    });
  }

  function fresh() {
    return { phase: 0, attempts: [], helped: false, draft: '', events: [], independent: false };
  }

  function create(storage) {
    let available = Boolean(storage);
    const memory = new Map();

    function read(id) {
      if (available) {
        try {
          const raw = storage.getItem(storageKey + id);
          const value = raw && JSON.parse(raw);
          if (value && Number.isInteger(value.phase) && value.phase >= 0 &&
              Array.isArray(value.attempts) && Array.isArray(value.events) &&
              typeof value.draft === 'string' && typeof value.helped === 'boolean' &&
              typeof value.independent === 'boolean') return value;
        } catch {
          available = false;
        }
      }
      return memory.get(id) ?? fresh();
    }

    function save(id, state) {
      memory.set(id, state);
      if (available) {
        try {
          storage.setItem(storageKey + id, JSON.stringify(state));
        } catch {
          available = false;
        }
      }
      return state;
    }

    return { read, save, available: () => available };
  }

  function progress(record, lesson) {
    if (record.independent) return 'verified';
    if (record.phase > lesson.checks.length || record.helped || record.attempts.includes(false)) return 'supported';
    return record.phase || record.draft || record.attempts.length ? 'started' : 'new';
  }

  function question(record, lesson) {
    return record.phase === 0 ? lesson.practice : lesson.checks[record.phase - 1];
  }

  function addEvent(record, type, extra = {}) {
    record.events.push({ type, phase: record.phase, at: new Date().toISOString(), ...extra });
  }

  function check(record, lesson, raw) {
    const current = question(record, lesson);
    if (!current || !raw.trim() || record.attempts.at(-1) === true) return null;
    const correct = matches(raw, current.answers);
    const familiar = record.events.some(event => event.phase === record.phase &&
      ['correct', 'wrong', 'hint'].includes(event.type));
    record.draft = raw;
    record.attempts.push(correct);
    addEvent(record, correct ? 'correct' : 'wrong', { answer: raw, helped: record.helped });
    if (record.phase && correct && !familiar && !record.helped) record.independent = true;
    return correct;
  }

  function hint(record, lesson) {
    if (!question(record, lesson) || record.helped || record.attempts.at(-1) === true) return;
    record.helped = true;
    addEvent(record, 'hint');
  }

  function advance(record, lesson) {
    if (record.attempts.at(-1) !== true) return;
    record.phase = record.phase && record.independent ? lesson.checks.length + 1 : record.phase + 1;
    record.attempts = [];
    record.draft = '';
    record.helped = false;
    addEvent(record, 'advance');
  }

  function restart(record) {
    if (!record.phase) return;
    const reset = { ...fresh(), events: record.events, independent: record.independent, note: record.note };
    addEvent(reset, 'repeat');
    return reset;
  }

  globalThis.ProfileAlphabetEngine = { storageKey, create, matches, progress, question, check, hint, advance, restart };
})();
