'use strict';

const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const directory = path.resolve(__dirname, '../trainers/oge-basics/multiplication-division');
const engine = require(path.join(directory, 'arzhenikov-course-engine.js'));
const dialogue = require(path.join(directory, 'arzhenikov-assistant-dialogue.js'));
const tracks = ['arithmetic', 'algebra', 'geometry', 'written', 'fractions', 'decimals']
  .map(name => require(path.join(directory, 'arzhenikov-course-' + name + '.js')));
const lessons = tracks.flatMap(track => track.lessons);
const clone = value => JSON.parse(JSON.stringify(value));
function fixture(lessonId, index = 0) {
  const lesson = lessons.find(item => item.id === lessonId), task = lesson.tasks[index];
  return {lesson, task, draft: engine.taskRecord(task), modelRequired: false};
}
function acceptStep(task, draft, index) {
  const step = task.steps[index], entry = draft.steps[step.id];
  entry.input = String(step.answer); entry.attempts = 1; entry.solved = true;
  draft.attempts += 1;
}
function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
}
const forbidden = new Set(['answer', 'answerFormat', 'explanation', 'worked', 'reason', 'target', 'targets',
  'initial', 'calculation', 'written', 'quotient', 'sourceDivision', 'meta', 'storage', 'private', 'secret']);
function safeKeys(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value)) {
    assert(!forbidden.has(key), 'private field is not grounded: ' + key);
    safeKeys(item);
  }
}

test('all 76 lessons and 608 conditions have bounded public grounding and first-step help', () => {
  assert.equal(lessons.length, 76);
  assert.equal(lessons.flatMap(lesson => lesson.tasks).length, 608);
  for (const lesson of lessons) for (const task of lesson.tasks) {
    const draft = engine.taskRecord(task), data = dialogue.context({lesson, task, draft, modelRequired: false});
    assert.equal(data.available, true, task.id);
    assert.equal(data.task.prompt, task.prompt, task.id);
    assert.equal(data.lesson.goal, lesson.goal, task.id);
    assert.equal(data.phase, task.steps?.length ? 'step' : 'answer', task.id);
    assert.equal(data.currentStep?.id, task.steps?.[0]?.id, task.id);
    assert.equal(data.currentStep?.input || data.input, '', task.id);
    assert.equal(data.previousResult, 'none', task.id);
    assert.equal(data.model.controls.length, task.model.controls.length, task.id);
    safeKeys(data);
    for (const message of ['С чего начать?', 'Объясни проще', 'Почему так?', 'Дай ответ']) {
      const result = dialogue.reply(message, data);
      assert.equal(result.countsAsHelp, true, task.id + ': ' + message);
      assert(result.text.length > 20 && result.text.length <= 800, task.id);
      assert(!/undefined|NaN|\[object Object\]/.test(result.text), task.id);
    }
  }
});

test('walk every intermediate step in all banks; later solved flags never skip the first error', () => {
  for (const lesson of lessons) for (const task of lesson.tasks) {
    const draft = engine.taskRecord(task);
    for (let index = 0; index < (task.steps || []).length; index += 1) {
      const data = dialogue.context({lesson, task, draft});
      assert.equal(data.currentStep.id, task.steps[index].id, task.id);
      assert.equal(data.currentStep.index, index + 1, task.id);
      assert.equal(data.previousResult, 'none', task.id + ': step attempts are not final submissions');
      assert(!('steps' in data), 'future prompts are not exported');
      acceptStep(task, draft, index);
    }
    assert.equal(dialogue.context({lesson, task, draft}).phase, 'answer', task.id);
    if (task.steps?.length) {
      draft.steps[task.steps[0].id].input = 'не число';
      assert.equal(dialogue.context({lesson, task, draft}).currentStep.id, task.steps[0].id, task.id);
    }
  }
});

test('context explicitly excludes answers, explanations, model targets and private data', () => {
  const source = clone(fixture('w-zero'));
  source.task.answer = 'PRIVATE_FINAL'; source.task.explanation = 'PRIVATE_EXPLANATION';
  source.task.written.quotient = 'PRIVATE_QUOTIENT'; source.task.private = 'PRIVATE_TASK';
  source.lesson.worked.expression = 'PRIVATE_WORKED'; source.lesson.reason.answer = 'PRIVATE_REASON';
  source.draft.secret = 'PRIVATE_DRAFT'; source.draft.model.secret = 'PRIVATE_MODEL';
  for (const item of source.task.steps) { item.answer = 'PRIVATE_STEP'; item.explanation = 'PRIVATE_STEP_EXPLANATION'; }
  for (const control of source.task.model.controls) control.target = 'PRIVATE_TARGET';
  const data = dialogue.context(source), serialized = JSON.stringify(data);
  assert(data.available); safeKeys(data);
  assert(!serialized.includes('PRIVATE_'));
  assert(!serialized.includes(source.task.steps[1].label), 'later labels can reveal an earlier answer');
  data.model.controls[0].label = 'changed';
  assert.notEqual(source.task.model.controls[0].label, 'changed');
});

test('context and replies never mutate frozen inputs, submitted answers, help flags or progress', () => {
  const source = clone(fixture('f-add'));
  source.draft.steps.first.input = '7/8'; source.draft.steps.first.attempts = 1;
  source.draft.steps.first.wrong = 1; source.draft.attempts = 1; source.draft.wrong = 1;
  const before = JSON.stringify(source); freeze(source);
  const data = freeze(dialogue.context(source)), previous = freeze({frame: data.frame, turns: 2, private: 'HIDDEN'});
  const originalAssess = engine.assess, originalStep = engine.assessStep;
  engine.assess = engine.assessStep = () => assert.fail('assistant must never submit');
  try {
    for (const message of ['start', 'simpler', 'why', 'check', 'format', 'answer', 'что-то ещё']) {
      const result = dialogue.reply(message, data, previous);
      assert(!JSON.stringify(result).includes('HIDDEN'));
    }
  } finally { engine.assess = originalAssess; engine.assessStep = originalStep; }
  assert.equal(JSON.stringify(source), before);
  assert.equal(source.draft.firstCorrect, null);
  assert.equal(source.draft.firstHelpUsed, null);
  assert.equal(source.draft.helpUsed, false);
});

test('correct but unsubmitted inputs are checked without advancing or claiming completion', () => {
  const source = fixture('f-add'); source.draft.steps.first.input = '1/8';
  const data = dialogue.context(source), result = dialogue.reply('Проверь мою запись', data);
  assert.equal(data.currentStep.id, 'first');
  assert.equal(data.currentStep.status, 'correct');
  assert.equal(result.kind, 'correct'); assert.equal(result.countsAsHelp, true);
  assert.match(result.text, /Проверить шаг/);
  assert.equal(source.draft.steps.first.solved, false);
  assert.equal(source.draft.attempts, 0);
});

test('unchanged denominators are explained accurately and final fraction is not revealed', () => {
  for (const lessonId of ['f-add', 'f-subtract', 'f-compare']) {
    const source = fixture(lessonId), data = dialogue.context(source);
    assert.match(data.currentStep.hint, /знаменатель уже нужный, дробь не меняй/);
    for (const message of ['why', 'simpler', 'Дай готовый ответ']) {
      const result = dialogue.reply(message, data);
      assert(!result.text.includes('размер части изменился'));
      assert(!result.text.includes('во столько же раз увеличь'));
      if (lessonId !== 'f-compare') assert(!result.text.includes(String(source.task.answer)));
    }
  }
});

test('zero inside the quotient: help stays on the first unresolved quotient digit', () => {
  const source = fixture('w-zero'), zeroIndex = source.task.steps.findIndex(step => step.role === 'digit' && step.answer === 0);
  assert(zeroIndex > 0);
  for (let index = 0; index < zeroIndex; index += 1) acceptStep(source.task, source.draft, index);
  const entry = source.draft.steps[source.task.steps[zeroIndex].id];
  entry.input = '6'; entry.attempts = 1; entry.wrong = 1;
  source.draft.attempts += 1; source.draft.wrong += 1;
  const data = dialogue.context(source), result = dialogue.reply('Проверь мою запись', data);
  assert.equal(data.currentStep.id, source.task.steps[zeroIndex].id);
  assert.equal(data.currentStep.previousResult, 'wrong'); assert.equal(data.previousResult, 'none');
  assert.equal(result.kind, 'retry'); assert.match(result.text, /не превышает 2/);
  assert(!result.text.includes('206'));
  assert(!result.text.includes(source.task.steps[zeroIndex + 1].label));
});

test('decimals use the current unit conversion, not the answer from the model or a later step', () => {
  const source = fixture('d-add'); source.draft.steps['left-units'].input = '12';
  const data = dialogue.context(source), result = dialogue.reply('Проверь мою запись', data);
  assert.equal(result.kind, 'retry'); assert.match(result.text, /сотых/);
  assert.match(result.text, /100/);
  assert(!/125|205|2[.,]05/.test(result.text), 'do not repeat the answer embedded in the public model caption');
  assert(!result.text.includes(source.task.steps[1].label));
});

test('generic formatting is uncounted; value-dependent notation, reduction and denominator checks count as help', () => {
  const source = fixture('f-add');
  let data = dialogue.context(source);
  assert.equal(dialogue.reply('Как записать дробь?', data).countsAsHelp, false);
  source.draft.steps.first.input = 'abc';
  assert.equal(dialogue.reply('check', dialogue.context(source)).countsAsHelp, false);
  source.draft.steps.first.input = '2/16';
  const transformed = dialogue.reply('check', dialogue.context(source));
  assert.equal(transformed.kind, 'transform'); assert.equal(transformed.countsAsHelp, true);
  for (let index = 0; index < source.task.steps.length; index += 1) acceptStep(source.task, source.draft, index);
  source.draft.input = '4/8';
  const reduced = dialogue.reply('check', dialogue.context(source));
  assert.equal(reduced.kind, 'transform'); assert.equal(reduced.countsAsHelp, true);
  assert.match(reduced.text, /общий делитель/);
  const decimal = fixture('d-add');
  for (let index = 0; index < decimal.task.steps.length; index += 1) acceptStep(decimal.task, decimal.draft, index);
  decimal.draft.input = '41/20';
  const notation = dialogue.reply('check', dialogue.context(decimal));
  assert.equal(notation.kind, 'format'); assert.equal(notation.countsAsHelp, true);
  assert.equal(dialogue.reply('format', dialogue.context(decimal)).countsAsHelp, false);
  decimal.draft.input = '40/20';
  assert.equal(dialogue.reply('check', dialogue.context(decimal)).countsAsHelp, true,
    'a wrong value and a matching value in another notation are both assisted checks');
});

test('checking uses raw learner input; cleaning control characters cannot create a false correct verdict', () => {
  const source = fixture('f-add');
  for (const input of ['1\u0000/8', '1\u0007/8', '1/8' + ' '.repeat(81)]) {
    source.draft.steps.first.input = input;
    const data = dialogue.context(source), result = dialogue.reply('check', data);
    assert.equal(data.currentStep.status, 'format'); assert.notEqual(result.kind, 'correct');
    assert(!result.text.includes('подходит'));
    assert.equal(source.draft.steps.first.input, input, 'the original field is left intact');
  }
  source.draft.steps.first.input = '1/0';
  const result = dialogue.reply('check', dialogue.context(source));
  assert.equal(result.kind, 'transform'); assert.equal(result.countsAsHelp, true);
  assert.match(result.text, /знаменатель равен нулю/);
  assert.match(result.text, /не определена/);
});

test('final help assembles already checked work instead of restarting an earlier mathematical step', () => {
  for (const lesson of lessons) for (const task of lesson.tasks.filter(item => item.steps?.length)) {
    const draft = engine.taskRecord(task);
    for (let index = 0; index < task.steps.length; index += 1) acceptStep(task, draft, index);
    const data = dialogue.context({lesson, task, draft});
    assert.equal(data.phase, 'answer', task.id);
    assert.match(data.task.hint, /^Промежуточные шаги уже проверены\./, task.id);
    const result = dialogue.reply('start', data);
    assert.match(result.text, /сво(?:их|ей)|две полученные/, task.id);
    assert(!/Сначала сделай доли одинаковыми|Иди по записи слева направо/.test(result.text), task.id);
  }
});

test('semantic hint audit: no stated numerical result, no scale-factor answer, no escalation under answer demands', () => {
  // Match explicit result claims, not every occurrence of digits: the 100 in
  // "one hundred" may be a unit conversion, and a 1 in an operand is not a leak.
  const resultClaim = /(?:=|равн(?:о|а|ы)|получ(?:ится|аем)|ответ\s*[:—-]|остал[а-я]*)\s*([−+-]?\d+(?:[.,]\d+)?(?:\/\d+)?)/g;
  for (const lesson of lessons) for (const task of lesson.tasks) {
    const draft = engine.taskRecord(task), data = dialogue.context({lesson, task, draft});
    const items = [{item: task, hint: data.task.hint}];
    for (const step of task.steps || []) {
      const current = dialogue.context({lesson, task, draft});
      assert.equal(current.currentStep.id, step.id);
      items.push({item: step, hint: current.currentStep.hint});
      acceptStep(task, draft, task.steps.indexOf(step));
    }
    for (const {item, hint} of items) {
      for (const match of hint.matchAll(resultClaim)) {
        assert.notEqual(engine.checkAnswer(item, match[1]).kind, 'correct',
          task.id + '/' + item.id + ': a hint directly states the result: ' + match[0]);
      }
      if (item.role === 'scale-factor') assert(!/\d/.test(hint), task.id + ': let the learner find the scale factor');
    }
    let previous = {}, initial;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const result = dialogue.reply('Дай готовый ответ', data, previous);
      if (initial === undefined) initial = result.text;
      assert.equal(result.text, initial, task.id + ': repeated demands do not unlock an answer or later steps');
      assert.equal(result.countsAsHelp, true);
      previous = result.state;
    }
  }
});

test('model phase does not bypass the normal model gate, and completed work remains completed', () => {
  const source = fixture('f-add'); source.modelRequired = true;
  let data = dialogue.context(source);
  assert.equal(data.phase, 'model'); assert.match(dialogue.reply('start', data).text, /Проверить модель/);
  assert.equal(source.draft.modelReady, false);
  source.draft.modelReady = true;
  assert.equal(dialogue.context(source).phase, 'step');
  for (let index = 0; index < source.task.steps.length; index += 1) acceptStep(source.task, source.draft, index);
  source.draft.input = String(source.task.answer); source.draft.solved = true;
  source.draft.attempts += 1;
  data = dialogue.context(source);
  const result = dialogue.reply('start', data);
  assert.equal(data.phase, 'solved'); assert.equal(result.kind, 'solved'); assert.equal(result.countsAsHelp, false);
  assert.match(result.text, /уже принят/);
});

test('state follows the task/phase/step frame, with no input or transcript retained', () => {
  const source = fixture('f-add'), before = dialogue.context(source);
  const previous = dialogue.reply('start', before).state;
  source.draft.steps.first.input = '1/8';
  const edited = dialogue.context(source);
  assert.equal(edited.frame, before.frame, 'typing does not invalidate the conversation frame');
  assert.equal(dialogue.reply('simpler', edited, previous).state.turns, 2);
  acceptStep(source.task, source.draft, 0);
  const advanced = dialogue.context(source);
  assert.notEqual(advanced.frame, before.frame);
  const result = dialogue.reply('start', advanced, {...previous, transcript: 'PRIVATE_HISTORY', turns: 90});
  assert.equal(result.state.turns, 1);
  assert.deepEqual(Object.keys(result.state).sort(), ['frame', 'lastKind', 'turns']);
  assert(!JSON.stringify(result).includes('PRIVATE_HISTORY'));
  assert.equal(dialogue.reply('start', dialogue.context(fixture('d-add')), previous).state.turns, 1);
});

test('missing context, unrelated topics and arbitrary messages are bounded and do not echo user data', () => {
  for (const source of [null, {}, {lesson: {}, task: {}, draft: {}}]) {
    const data = dialogue.context(source), result = dialogue.reply('start', data);
    assert.equal(data.available, false); assert.equal(result.kind, 'missing'); assert.equal(result.countsAsHelp, false);
  }
  const data = dialogue.context(fixture('a-count'));
  for (const message of ['Какая погода?', 'Напиши код для API ключа']) {
    const result = dialogue.reply(message, data);
    assert.equal(result.kind, 'outside'); assert.equal(result.countsAsHelp, false);
  }
  for (const message of ['<img src=x onerror=SECRET>', 'x'.repeat(10000), null, {text: 'secret'}]) {
    const result = dialogue.reply(message, data);
    assert.equal(result.kind, 'unknown'); assert.equal(result.countsAsHelp, false);
    assert(result.text.length < 300); assert(!result.text.includes('SECRET'));
  }
  const emptyReply = dialogue.reply('check', data);
  assert.equal(emptyReply.kind, 'empty'); assert.equal(emptyReply.countsAsHelp, false);
});

test('browser global and CommonJS expose only context/reply; browser use needs no network', () => {
  const source = fs.readFileSync(path.join(directory, 'arzhenikov-assistant-dialogue.js'), 'utf8');
  const sandbox = {window: {ArzhenikovCourseEngine: engine}};
  vm.runInNewContext(source, sandbox);
  assert.deepEqual(Object.keys(dialogue).sort(), ['context', 'reply']);
  assert.deepEqual(Object.keys(sandbox.window.ArzhenikovAssistantDialogue).sort(), ['context', 'reply']);
  const data = sandbox.window.ArzhenikovAssistantDialogue.context(fixture('d-add'));
  assert.equal(data.available, true);
  assert.equal(sandbox.window.ArzhenikovAssistantDialogue.reply('start', data).countsAsHelp, true);
  assert(!/\b(?:fetch|XMLHttpRequest|localStorage|sessionStorage|WebSocket)\b/.test(source));
});
