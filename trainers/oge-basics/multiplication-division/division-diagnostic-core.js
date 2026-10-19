(function(root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./division-lab-core.js'));
  else root.DivisionDiagnostic = factory(root.DivisionLab);
})(typeof globalThis === 'undefined' ? this : globalThis, function(D) {
  'use strict';
  const MAX_CONFIRMATIONS = 8;
  const SKILL_ORDER = Object.freeze(['first', 'facts', 'choice', 'multiplyTwo', 'subtract', 'bring', 'zero', 'addition']);
  const trainer = '/trainers/oge-basics/multiplication-division/';
  const rows = [
    ['first', 'С каких цифр начать', 'division', 'course-first-part', 4],
    ['facts', 'Таблица умножения', 'multiplication', 'multiplication-ladder', 1],
    ['choice', 'Подбор цифры частного', 'division', 'course-digit-choice', 6],
    ['multiplyTwo', 'Умножение на двузначное число', 'multiplication', 'course-multiply-two-digit', 5],
    ['subtract', 'Вычитание, когда нужно занять слева', 'subtraction', 'course-subtract', 3],
    ['bring', 'Число после сноса цифры', 'division', 'course-bring-digit', 7],
    ['zero', 'Ноль внутри частного', 'division', 'course-zeros', 8],
    ['addition', 'Сложение: пишем цифру, остальное в уме', 'addition', null, 2]
  ];
  const skills = Object.freeze(Object.fromEntries(rows.map(([id, title, branch, slug, priority]) => [id, Object.freeze({
    id, title, branch, priority,
    recommendation: Object.freeze({title: id === 'addition' ? 'Сложение столбиком' : title,
      url: id === 'addition' ? trainer + 'arithmetic-foundations.html#add-carry' : id === 'subtract' ? trainer + 'arithmetic-foundations.html#sub-borrow' : trainer + slug + '.html'})
  })])));
  function variantNumber(value) { return Number.isInteger(value) && value >= 0 ? value % 2 : 0; }
  function standalone(id, skill, prompt, answer, phase) {
    return {id, skill, prompt, answer: String(answer), kind: 'number', taskIndex: null, actionIndex: null, phase};
  }
  function build(variant = 0) {
    const v = variantNumber(variant);
    const source = v ? [['zero', '927', '3'], ['twoDigit', '560', '16']] : [['zero', '816', '4'], ['twoDigit', '444', '12']];
    const tasks = source.map(([level, dividend, divisor]) => D.plan({level, dividend, divisor}));
    const warmups = v ? [['facts', '8 × 6', 48], ['addition', '90 + 18', 108], ['addition', '56 + 38', 94]]
      : [['facts', '7 × 8', 56], ['addition', '70 + 14', 84], ['addition', '48 + 27', 75]];
    const questions = [];
    const autoActions = tasks.map(() => []);
    tasks.forEach((p, taskIndex) => {
      p.actions.forEach((a, actionIndex) => {
        if (a.kind === 'answer' || a.kind === 'verify') return;
        const cycle = a.cycle === undefined ? null : p.cycles[a.cycle];
        // These actions are shown from the canonical plan but supply no evidence.
        // In particular, x × 0 and x − x cannot establish multiplication or borrowing skills.
        if (a.kind === 'bring' || (a.kind === 'product' && (cycle.qd <= 1 || p.normalizedDivisor <= 1)) ||
            (a.kind === 'subtract' && (cycle.product === 0 || cycle.partial === cycle.product))) {
          autoActions[taskIndex].push(actionIndex);
          return;
        }
        let skill, kind = a.kind, answer = a.answer, prompt = a.prompt, extra = {};
        if (a.kind === 'start') {
          skill = 'first'; kind = 'selection'; answer = String(a.sourceIndex + 1);
          prompt = 'Сколько первых цифр возьмём для начала деления?';
          extra = {selectionLength: a.sourceIndex + 1, selectionDigits: p.normalizedDividend, selectionDivisor: String(p.normalizedDivisor)};
        } else if (a.kind === 'digit') {
          skill = cycle.qd === 0 ? 'zero' : 'choice';
          prompt = 'Какую цифру частного запишем для ' + cycle.partial + ' : ' + p.normalizedDivisor + '?';
        } else if (a.kind === 'product') {
          skill = p.normalizedDivisor < 10 ? 'facts' : 'multiplyTwo';
          prompt = p.normalizedDivisor + ' × ' + cycle.qd + ' = ?';
        } else if (a.kind === 'subtract') {
          skill = 'subtract'; prompt = cycle.partial + ' − ' + cycle.product + ' = ?';
        } else if (a.kind === 'partial') {
          skill = 'bring';
          const nextCycle = p.cycles.findIndex(c => c.sourceIndex === a.sourceIndex);
          const remainder = p.cycles[nextCycle - 1].remainder;
          prompt = 'К остатку ' + remainder + ' снесли цифру ' + p.digits[a.sourceIndex] + '. Какое число получилось?';
        } else {
          throw Error('Неизвестное действие входной диагностики.');
        }
        questions.push({id: 'v' + v + '-task-' + taskIndex + '-action-' + actionIndex,
          skill, prompt, answer, kind, taskIndex, actionIndex, phase: 'main', ...extra});
      });
    });
    // Independent arithmetic comes last: the addition must not reveal a later product in the division.
    questions.push(...warmups.map(([skill, expression, answer], i) => standalone('v' + v + '-warmup-' + i, skill, expression + ' = ?', answer, 'main')));
    return {variant: v, tasks, questions, autoActions, maxConfirmations: MAX_CONFIRMATIONS};
  }
  function confirmation(skill, variant = 0) {
    if (!Object.hasOwn(skills, skill)) throw Error('Неизвестный навык диагностики.');
    const v = variantNumber(variant);
    const samples = v ? {
      first: ['738', '9', 2], facts: ['7 × 9 = ?', 63],
      choice: ['Подберите одну цифру частного для 38 : 7.', 5],
      multiplyTwo: ['17 × 4 = ?', 68], subtract: ['63 − 47 = ?', 16],
      bring: ['После вычитания осталось 6. Снесли цифру 2. Какое число получилось?', 62],
      zero: ['Внутри деления после сноса получилось 2, делитель — 7. Какую цифру частного запишем сейчас?', 0],
      addition: ['68 + 17 = ?', 85]
    } : {
      first: ['672', '8', 2], facts: ['6 × 9 = ?', 54],
      choice: ['Подберите одну цифру частного для 29 : 6.', 4],
      multiplyTwo: ['13 × 7 = ?', 91], subtract: ['52 − 37 = ?', 15],
      bring: ['После вычитания осталось 3. Снесли цифру 5. Какое число получилось?', 35],
      zero: ['Внутри деления после сноса получилось 3, делитель — 5. Какую цифру частного запишем сейчас?', 0],
      addition: ['57 + 26 = ?', 83]
    };
    const item = samples[skill], id = 'v' + v + '-confirmation-' + skill;
    if (skill === 'first') return {...standalone(id, skill, 'Сколько первых цифр возьмём для начала деления?', item[2], 'confirmation'),
      kind: 'selection', selectionLength: item[2], selectionDigits: item[0], selectionDivisor: item[1]};
    return standalone(id, skill, item[0], item[1], 'confirmation');
  }
  function isCorrect(question, value) {
    if (!question || typeof question.answer !== 'string' || (typeof value !== 'string' && typeof value !== 'number')) return false;
    const text = String(value).trim();
    // All diagnostics use integers; blank, decimals, exponent notation and expressions are not answers.
    if (!/^(0|[1-9]\d*)$/.test(text) || text.length > 8) return false;
    if (['selection', 'digit', 'bring'].includes(question.kind) && text.length !== 1) return false;
    return text === question.answer;
  }
  let knownQuestions;
  function questionIndex() {
    if (!knownQuestions) {
      knownQuestions = new Map();
      for (let v = 0; v < 2; v++) {
        for (const q of [...build(v).questions, ...SKILL_ORDER.map(s => confirmation(s, v))]) knownQuestions.set(q.id, q);
      }
    }
    return knownQuestions;
  }
  function report(records) {
    const grouped = Object.fromEntries(SKILL_ORDER.map(id => [id, []])), seen = new Set(), index = questionIndex();
    for (const r of Array.isArray(records) ? records : []) {
      if (!r || typeof r.id !== 'string' || seen.has(r.id)) continue;
      const q = index.get(r.id);
      if (!q || (typeof r.correct !== 'boolean' && r.skipped !== true)) continue;
      seen.add(r.id);
      // Skill and phase come from the known question, never from persisted display text.
      grouped[q.skill].push({question: q, correct: r.correct === true && r.skipped !== true, skipped: r.skipped === true});
    }
    return SKILL_ORDER.map(skill => {
      const evidence = grouped[skill], total = evidence.length, correct = evidence.filter(e => e.correct).length;
      const skipped = evidence.filter(e => e.skipped).length, errors = total - correct - skipped;
      const confirmations = evidence.filter(e => e.question.phase === 'confirmation').length;
      const failures = errors + skipped;
      const status = total === 0 ? 'untested' : failures >= 2 ? 'focus' : failures === 1 ? 'uncertain' : 'observed';
      const statusTitle = {untested: 'Ещё не проверяли', observed: 'В проверенных заданиях получилось', uncertain: 'Стоит уточнить', focus: 'Стоит потренировать'}[status];
      const observations = [];
      if (!total) observations.push('По этому навыку пока нет ответов.');
      else {
        observations.push('Верно с первой попытки: ' + correct + ' из ' + total + ' проверенных действий.');
        if (errors) observations.push('Ошибок: ' + errors + '.');
        if (skipped) observations.push('Ответ «Не знаю»: ' + skipped + '.');
        if (failures === 1 && confirmations === 0) observations.push('Один ответ ещё не позволяет сделать уверенный вывод.');
        if (failures && evidence.some(e => e.question.phase === 'confirmation' && e.correct)) observations.push('В отдельном уточняющем задании получилось.');
      }
      return {...skills[skill], skill, status, statusTitle, observations,
        counts: {total, correct, errors, skipped, confirmations}, needsConfirmation: failures > 0 && confirmations === 0};
    });
  }
  return Object.freeze({build, confirmation, isCorrect, report, skills, SKILL_ORDER, MAX_CONFIRMATIONS});
});
