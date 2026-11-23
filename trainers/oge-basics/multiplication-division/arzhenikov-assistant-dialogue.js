/* Bounded, offline help grounded in the open Arzhenikov course condition.
 * It reads the course checker, never submits an answer or writes progress.
 * Only the current, first unfinished step crosses the context boundary. */
(function (root, factory) {
  'use strict';
  const commonJS = typeof module === 'object' && module.exports;
  const engine = commonJS ? require('./arzhenikov-course-engine.js') : root.ArzhenikovCourseEngine;
  const api = factory(engine);
  if (commonJS) module.exports = api;
  root.ArzhenikovAssistantDialogue = api;
})(typeof window === 'object' ? window : globalThis, function (engine) {
  'use strict';

  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const text = (value, limit = 600) => typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, limit) : '';
  const id = value => typeof value === 'string' && /^[a-z][a-z0-9-]{0,99}$/.test(value) ? value : '';
  const formats = ['integer', 'decimal', 'fraction', 'mixed', 'comparison'];
  const format = item => formats.includes(item.answerFormat) ? item.answerFormat : 'integer';
  const count = value => Number.isSafeInteger(value) && value >= 0 ? value : 0;
  const empty = () => ({version: 1, available: false, frame: 'missing', phase: 'missing'});

  function checked(item, input) {
    input = typeof input === 'string' ? input : '';
    if (!input.trim()) return {status: 'empty', formatIssue: ''};
    if (input.length > 80) return {status: 'format', formatIssue: 'syntax'};
    if (/^[+\-−]?(?:\d+\s+)?\d+\s*\/\s*[+\-−]?0+$/.test(input.trim())) {
      return {status: 'format', formatIssue: 'zero-denominator'};
    }
    const result = engine.checkAnswer(item, input);
    if (result.kind !== 'format') return {status: result.kind === 'correct' ? 'correct' : 'wrong', formatIssue: ''};
    // The checker distinguishes a missing notation from a mathematical
    // transformation. Never disguise a reduction/denominator hint as free
    // formatting help, and never export its expected answer or internal data.
    const message = result.message || '';
    const issue = /Сократи числитель/.test(message) ? 'reduce'
      : /В этом шаге нужен знаменатель/.test(message) ? 'denominator'
      : /Значение верное/.test(message) ? 'notation' : 'syntax';
    return {status: 'format', formatIssue: issue};
  }

  function previousResult(entry, attempts = count(entry.attempts), wrong = count(entry.wrong)) {
    if (!attempts) return 'none';
    if (entry.solved === true && attempts > wrong) return 'correct';
    // A mixed history can survive a reset. Do not invent the last submission
    // from aggregate counters or mistake attempts on earlier steps for a final
    // answer submission.
    return wrong === attempts ? 'wrong' : 'unknown';
  }

  function safeHint(item) {
    // Some bank hints describe an increasing denominator even when it is
    // already the required one. Preserve that case explicitly, without
    // copying the bank's post-answer explanation or looking at a model target.
    if (item.requiredDenominator && /знаменател/.test(item.hint || '')) {
      return 'Сравни знаменатели. Если знаменатель уже нужный, дробь не меняй; иначе найди множитель для перехода к нужному знаменателю.';
    }
    if (item.role === 'scale-factor') {
      return 'Посчитай, на сколько разрядов нужно сдвинуть запятую вправо в делителе, чтобы дробной части не осталось. Подбери одинаковый множитель для обоих чисел.';
    }
    return text(item.hint, 300) || 'Выдели известные величины в условии и реши, что нужно найти на этом шаге.';
  }

  function finalHint(task) {
    const prefix = 'Промежуточные шаги уже проверены. ';
    if (task.label === 'Частное целиком') return prefix + 'Прочитай цифры частного в своей записи уголком по порядку.';
    if (task.label === 'Последний остаток') return prefix + 'Найди последний остаток в своей записи уголком.';
    if (format(task) === 'comparison') return prefix + 'Сравни две полученные величины и выбери знак между ними.';
    if (task.requireReduced) return prefix + 'Составь итог из своих записей и проверь, можно ли сократить дробную часть.';
    return prefix + 'Собери из своих записей итог, который спрашивает условие.';
  }

  function context(options = {}) {
    if (!object(options) || !engine || typeof engine.checkAnswer !== 'function') return empty();
    const {lesson, task, draft, modelRequired} = options;
    if (!object(lesson) || !object(task) || !object(draft) || !id(lesson.id) || !id(task.id)
      || !text(lesson.goal) || !text(task.prompt) || !Array.isArray(lesson.tasks)
      || !lesson.tasks.some(item => item.id === task.id) || !object(task.model)
      || !Array.isArray(task.model.controls)) return empty();

    const steps = Array.isArray(task.steps) ? task.steps : [];
    const entries = object(draft.steps) ? draft.steps : {};
    let currentStep = null;
    for (let index = 0; index < steps.length; index += 1) {
      const step = steps[index], entry = object(entries[step.id]) ? entries[step.id] : {};
      // Check the actual field, not a display-cleaned version: removing a
      // control character must not turn an invalid learner entry into a pass.
      const input = text(entry.input, 80), result = checked(step, entry.input);
      const accepted = entry.solved === true && count(entry.attempts) > count(entry.wrong) && result.status === 'correct';
      if (accepted) continue;
      currentStep = {
        id: id(step.id), index: index + 1, total: steps.length,
        prompt: text(step.label), hint: safeHint(step), format: format(step), input,
        status: result.status, formatIssue: result.formatIssue,
        previousResult: previousResult(entry)
      };
      break;
    }
    const input = text(draft.input, 80), result = checked(task, draft.input);
    const solved = draft.solved === true && !currentStep && result.status === 'correct';
    const phase = solved ? 'solved' : modelRequired === true && draft.modelReady !== true ? 'model'
      : currentStep ? 'step' : 'answer';
    const stepAttempts = steps.reduce((total, step) => total + count(entries[step.id]?.attempts), 0);
    const stepWrong = steps.reduce((total, step) => total + count(entries[step.id]?.wrong), 0);
    const controls = task.model.controls.filter(control => object(control) && id(control.id)).map(control => ({
      id: id(control.id), label: text(control.label, 160),
      value: Number.isFinite(draft.model?.[control.id]) ? draft.model[control.id] : null
    }));
    // This is an explicit allowlist. Do not spread course records: explanations,
    // worked answers, calculations, written.quotient and targets are private to
    // the normal checker and must not reach the assistant's grounding.
    return {
      version: 1, available: true,
      frame: [lesson.id, task.id, phase, currentStep ? currentStep.id : 'final'].join(':'), phase,
      lesson: {id: lesson.id, title: text(lesson.title, 160), goal: text(lesson.goal)},
      task: {id: task.id, prompt: text(task.prompt), label: text(task.label, 160),
        unit: text(task.unit, 40), format: format(task), hint: steps.length && !currentStep ? finalHint(task) : safeHint(task)},
      model: {description: text(task.model.caption), controls},
      currentStep, input, status: result.status, formatIssue: result.formatIssue,
      previousResult: previousResult(draft, Math.max(0, count(draft.attempts) - stepAttempts),
        Math.max(0, count(draft.wrong) - stepWrong))
    };
  }

  function intent(message) {
    if (typeof message !== 'string' || message.length > 400) return 'unknown';
    const value = text(message, 400).toLowerCase().replace(/ё/g, 'е');
    if (['start', 'simpler', 'why', 'check', 'answer', 'format'].includes(value)) return value;
    if (/готов(?:ый|ое) (?:ответ|решение)|(?:дай|скажи|напиши|покажи|выдай)(?: мне)? (?:только )?ответ|реши (?:за|вместо) меня|только ответ/.test(value)) return 'answer';
    if (/погод|анекдот|политик|напиши код|напиши стих|парол|api.?ключ|скрыт[а-я]* (?:ответ|данн)|забудь инструкц/.test(value)) return 'outside';
    if (/почему|зачем|объясни смысл|что это значит/.test(value)) return 'why';
    if (/как (?:ввести|набрать|напечатать)|как записать (?:дробь|смешанное число|ответ)|формат/.test(value)) return 'format';
    if (/проще|попроще|не понял|не поняла|не понимаю|непонятно|трудно|не получается/.test(value)) return 'simpler';
    if (/проверь|проверить|ошибк|неправильн|верно|правильно/.test(value)) return 'check';
    if (/с чего|нача|помоги|подсказ|как реш|что (?:делать|дальше)|следующий шаг/.test(value)) return 'start';
    return 'unknown';
  }

  function formatHint(kind) {
    if (kind === 'comparison') return 'Выбери один знак сравнения: <, > или =.';
    if (kind === 'mixed') return 'Отдели целую часть пробелом, затем запиши числитель / знаменатель. Для целого результата достаточно одного числа.';
    if (kind === 'fraction') return 'Запиши числитель, затем / и знаменатель. Единицу измерения в поле добавлять не нужно.';
    if (kind === 'decimal') return 'Введи одно число с запятой или точкой. Единицу измерения в поле добавлять не нужно.';
    return 'Введи одно целое число. Минус можно поставить перед числом; единицу измерения в поле добавлять не нужно.';
  }

  function validContext(value) {
    return object(value) && value.version === 1 && value.available === true && typeof value.frame === 'string'
      && ['model', 'step', 'answer', 'solved'].includes(value.phase)
      && object(value.lesson) && object(value.task) && object(value.model);
  }

  function reply(message, grounding, previousState = {}) {
    const valid = validContext(grounding), frame = valid ? text(grounding.frame, 350) : 'missing';
    const turns = object(previousState) && previousState.frame === frame ? Math.min(count(previousState.turns), 99) : 0;
    const finish = (body, kind, countsAsHelp = false) => ({text: text(body, 800), kind, countsAsHelp,
      state: {frame, turns: turns + 1, lastKind: kind}});
    if (!valid) return finish('Открой задание курса: тогда я смогу подсказать шаг по его условию.', 'missing');

    const request = intent(message);
    if (request === 'outside') return finish('Я помогаю с открытой задачей этого курса. Выбери «С чего начать?» или «Проверь мою запись».', 'outside');
    if (request === 'unknown') return finish('Могу подсказать следующий шаг, объяснить его проще или проверить запись в поле. Выбери подходящий вопрос под задачей.', 'unknown');
    if (grounding.phase === 'solved') return finish('Ответ уже принят тренажёром. Нажми кнопку продолжения под задачей.', 'solved');

    const focus = grounding.currentStep || {...grounding.task, input: grounding.input,
      status: grounding.status, formatIssue: grounding.formatIssue};
    if (request === 'format') return finish(formatHint(focus.format), 'format');

    if (grounding.phase === 'model') {
      const prefix = request === 'answer' ? 'Помогу сделать следующий шаг самостоятельно. ' : '';
      return finish(prefix + 'Сначала покажи условие на модели: ' + grounding.model.description
        + ' Затем нажми «Проверить модель».', 'model', true);
    }

    const stepName = grounding.currentStep ? 'Сейчас шаг «' + focus.prompt + '». ' : '';
    const action = grounding.currentStep ? 'Внеси свой вариант в поле этого шага.' : 'Внеси свой вариант в поле ответа.';
    if (request === 'check') {
      if (focus.status === 'empty') return finish('В поле текущего шага пока нет записи. Введи свой вариант в это поле и снова выбери «Проверь мою запись».', 'empty');
      if (focus.status === 'format') {
        if (focus.formatIssue === 'zero-denominator') return finish('В этой записи знаменатель равен нулю. Дробь с таким знаменателем не определена. Проверь нижнее число.', 'transform', true);
        if (focus.formatIssue === 'reduce') return finish('Для этого шага нужна сокращённая дробь. Найди общий делитель числителя и знаменателя.', 'transform', true);
        if (focus.formatIssue === 'denominator') return finish('Сверь знаменатель с указанным в текущем шаге. Сохрани величину дроби при смене записи.', 'transform', true);
        // This branch is reached after checking the value. Even without the
        // word "correct", a notation-only verdict distinguishes a matching
        // value from a wrong one. Count that check as help; a standalone
        // question about input notation above remains independent of equality.
        return finish(formatHint(focus.format), 'format', focus.formatIssue === 'notation');
      }
      if (focus.status === 'correct') return finish('Эта запись подходит. Чтобы сохранить результат, нажми «'
        + (grounding.currentStep ? 'Проверить шаг' : 'Проверить ответ') + '».', 'correct', true);
      return finish('В этой записи есть ошибка. ' + stepName + focus.hint, 'retry', true);
    }
    if (request === 'why') return finish('Цель урока: ' + grounding.lesson.goal + ' ' + stepName + focus.hint, 'why', true);
    if (request === 'simpler') return finish('Пока разберём один шаг. ' + stepName + focus.hint + ' ' + action, 'simpler', true);
    if (request === 'answer') return finish('Помогу получить ответ своим ходом. ' + stepName + focus.hint, 'hint', true);
    return finish(stepName + focus.hint + ' ' + action, 'start', true);
  }

  return {context, reply};
});
