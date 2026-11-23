'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '../trainers/oge-basics/multiplication-division');
const E = require(path.join(root, 'arzhenikov-completion-engine.js'));
const {checkAnswer} = require(path.join(root, 'arzhenikov-course-engine.js'));
const clone = value => JSON.parse(JSON.stringify(value));
const bank = {items: Array.from({length: 16}, (_, index) => ['placement', 'review', 'final'].map(pool => ({
  id: pool + '-item-' + index, pool, skill: 'skill-' + index, family: 'lesson-' + index, lessonId: 'lesson-' + index,
  placementOrder: pool === 'placement' && index < 8 ? index : undefined,
  prompt: 'Сколько всего предметов?', answer: index + 2, answerFormat: 'integer',
  hint: 'Секретная подсказка для явного запроса.', explanation: 'Секретное полное решение.',
  calculation: {op: 'add', args: [index, 2]}
}))).flat()};
bank.items.find(item => item.id === 'final-item-0').reason = {
  prompt: 'Почему это действие подходит?', options: [{id: 'right', text: 'Соединяем две части.'}, {id: 'wrong', text: 'Ищем одну часть.'}],
  answer: 'right', explanation: 'Объяснение только после явного действия.'
};
const find = id => bank.items.find(item => item.id === id);
const begin = (ids, mode = 'final', suppliedBank = bank) => {
  const state = E.fresh(); E.start(state, {mode, itemIds: ids, now: 100}, suppliedBank); return state;
};
function solve(state, suppliedBank = bank) {
  const item = suppliedBank.items.find(candidate => candidate.id === E.current(state).id);
  E.setInput(state, String(item.answer));
  assert.equal(E.submit(state, suppliedBank, checkAnswer).kind, 'correct');
  if (item.reason) {
    E.setReason(state, item.reason.answer);
    assert.equal(E.submit(state, suppliedBank, checkAnswer, {field: 'reason'}).kind, 'correct');
  }
}
function finish(state, suppliedBank = bank) {
  while (E.current(state)) { solve(state, suppliedBank); assert(E.next(state, suppliedBank, 200)); }
}

test('the three modes select eight placement anchors, all sixteen final families and no unseen review topics', () => {
  assert.equal(E.key, 'mathexam.arzhenikov.completion.v1');
  assert.deepEqual(E.selectItems('placement', bank), Array.from({length: 8}, (_, index) => 'placement-item-' + index));
  assert.equal(E.selectItems('final', bank).length, 16);
  assert.deepEqual(E.selectItems('review', bank, {courseState: {lessons: {}}}), []);
  assert.deepEqual(E.selectItems('unknown', bank), []);
  const state = E.fresh(); assert.equal(E.start(state, {mode: 'review', itemIds: []}, bank), null);
  assert.equal(state.active, null);
});

test('review eligibility comes from a real lesson start or saved action, never an empty viewed record', () => {
  const courses = {lessons: {
    viewed: {visits: 0, phase: 'intro', tasks: {}},
    empty: {tasks: {one: {input: '  ', attempts: 0, moves: 0}}},
    begun: {visits: 1, tasks: {}},
    typed: {tasks: {one: {input: '1/'}}},
    moved: {tasks: {one: {moves: 1}}},
    attempted: {tasks: {one: {attempts: 1}}},
    step: {tasks: {one: {steps: {part: {input: '2'}}}}},
    helped: {tasks: {one: {hint: true}}}
  }};
  const before = clone(courses);
  assert.deepEqual(E.eligibleLessonIds(courses), ['begun', 'typed', 'moved', 'attempted', 'step', 'helped']);
  assert.deepEqual(courses, before, 'eligibility must not write into the old course state');
});

test('review prioritizes weak visited families, chooses a fresh condition within each family and caps the queue at six', () => {
  const suppliedBank = clone(bank);
  suppliedBank.items.push({...find('review-item-7'), id: 'review-fallback-seven', sourceTaskId: 'old-seven'});
  const courses = {lessons: Object.fromEntries(Array.from({length: 9}, (_, index) => ['lesson-' + index,
    {visits: 1, tasks: {one: {attempts: 1, firstCorrect: index === 7 ? false : true, wrong: index === 7 ? 1 : 0}}}]))};
  const history = {'review-item-7': {presentations: 1, latest: {firstCorrect: false, wrong: 1}}};
  const ids = E.selectItems('review', suppliedBank, {courseState: courses, history});
  assert.equal(ids.length, 6);
  assert.equal(ids[0], 'review-fallback-seven', 'new numbers for the weak family precede its known condition');
  assert.equal(new Set(ids.map(id => suppliedBank.items.find(item => item.id === id).family)).size, ids.length);
  assert(!ids.some(id => /item-(?:9|1[0-5])$/.test(id)), 'never include a topic that has not been started');
  assert.equal(E.selectItems('review', bank, {courseState: courses, limit: 2}).length, 2);
  assert.equal(E.selectItems('review', bank, {courseState: {lessons: {'lesson-3': {visits: 1}}}}).length, 1);
});

test('a first attempt, a correction and explicitly requested help remain separate after reload', () => {
  let state = begin(['final-item-1']);
  E.setInput(state, ''); assert.equal(E.submit(state, bank, checkAnswer).kind, 'format');
  E.setInput(state, '1+2'); assert.equal(E.submit(state, bank, checkAnswer).kind, 'format');
  assert.equal(E.current(state).attempts, 0);
  assert.equal(E.current(state).firstCorrect, null);
  E.setInput(state, '99');
  const wrong = E.submit(state, bank, checkAnswer);
  assert.equal(wrong.kind, 'wrong');
  assert(!JSON.stringify(wrong).includes(find('final-item-1').hint), 'wrong feedback does not reveal the hint');
  assert(!JSON.stringify(wrong).includes(find('final-item-1').explanation), 'wrong feedback does not reveal the solution');
  assert.equal(E.current(state).firstCorrect, false);
  assert.equal(E.current(state).firstHelpUsed, false);
  E.useHelp(state, 'hint');
  E.setInput(state, '3');
  state = E.normalize(clone(state), bank, checkAnswer);
  assert.equal(E.current(state).input, '3');
  assert.equal(E.current(state).firstCorrect, false);
  assert.equal(E.current(state).helpUsed, true);
  assert.equal(E.submit(state, bank, checkAnswer).kind, 'correct');
  assert(E.next(state, bank, 200));
  const report = E.summary(state, bank);
  assert.equal(report.complete, true); assert.equal(report.corrected, 1); assert.equal(report.independent, 0);
  assert.equal(report.helped, 1); assert.deepEqual(report.recommendedLessonIds, ['lesson-1']);
});

test('help can be opened before any attempt and is sticky across input changes and normalization', () => {
  let state = begin(['final-item-1']);
  assert(E.useHelp(state, 'solution'));
  assert.equal(E.current(state).attempts, 0);
  E.setInput(state, '3');
  state = E.normalize(clone(state), bank, checkAnswer);
  assert(E.current(state).help.solution);
  solve(state); E.next(state, bank, 200);
  const entry = E.summary(state, bank).results[0];
  assert.equal(entry.firstCorrect, true); assert.equal(entry.firstHelpUsed, true); assert.equal(entry.independent, false);
  assert.equal(state.history[entry.id].first.firstHelpUsed, true);
});

test('a related lesson helps paused exposed checks, while unrelated and future topics stay neutral', () => {
  const state = begin(['final-item-0', 'final-item-1']);
  E.start(state, {mode:'placement', itemIds:['placement-item-0'], now:110}, bank);
  const untouched = clone(state);
  assert.equal(E.useLessonHelp(state, 'lesson-7', bank), false);
  assert.equal(E.useLessonHelp(state, 'lesson-1', bank), false, 'a future unpresented task has no help event');
  assert.deepEqual(state, untouched);
  assert.equal(E.useLessonHelp(state, 'lesson-0', bank), true);
  assert.equal(state.active, 'placement', 'recording a lesson visit does not switch the active check');
  assert.equal(state.sessions.final.entries['final-item-0'].helpUsed, true);
  assert.equal(E.current(state).helpUsed, true);
  const helped = clone(state);
  assert.equal(E.useLessonHelp(state, 'lesson-0', bank), false, 'repeated rendering is idempotent');
  assert.deepEqual(state, helped);
  solve(state); E.next(state, bank);
  assert.equal(E.summary(state, bank).independent, 0);
  E.start(state, {mode:'final', itemIds:['final-item-0', 'final-item-1'], now:120}, bank);
  solve(state);
  assert.equal(E.current(state).firstHelpUsed, true);
  assert.equal(E.current(state).reason.firstHelpUsed, true);
});

test('opening a related lesson after a correct answer affects the remaining explanation, not the past answer', () => {
  let state = begin(['final-item-0']);
  E.setInput(state, '2'); assert.equal(E.submit(state, bank, checkAnswer).kind, 'correct');
  assert.equal(E.current(state).firstHelpUsed, false);
  assert.equal(E.useLessonHelp(state, 'lesson-0', bank), true);
  state = E.normalize(clone(state), bank, checkAnswer);
  assert.equal(E.current(state).firstCorrect, true);
  assert.equal(E.current(state).firstHelpUsed, false);
  assert.equal(E.current(state).helpAt.hint, 1);
  assert.equal(E.current(state).helpAtReason.hint, 0);
  E.setReason(state, 'right'); E.submit(state, bank, checkAnswer, {field:'reason'}); E.next(state, bank);
  const report = E.summary(state, bank);
  assert.equal(report.independent, 1);
  assert.equal(report.reasonIndependent, 0);
  assert.equal(state.history['final-item-0'].first.firstHelpUsed, false);
  assert.equal(state.history['final-item-0'].first.reason.firstHelpUsed, true);
});

test('visiting a lesson cannot retroactively mark a finished answer as assisted', () => {
  const state = begin(['final-item-1']);
  solve(state);
  const answered = clone(state);
  assert.equal(E.useLessonHelp(state, 'lesson-1', bank), false);
  assert.deepEqual(state, answered);
  E.next(state, bank);
  const finished = clone(state);
  assert.equal(E.useLessonHelp(state, 'lesson-1', bank), false);
  assert.deepEqual(state, finished);
  assert.equal(E.summary(state, bank).independent, 1);
});

test('reason choice is saved separately and reasoning errors or later help do not rewrite the first numerical answer', () => {
  let state = begin(['final-item-0']);
  E.setReason(state, 'wrong');
  assert.equal(E.submit(state, bank, checkAnswer, {field: 'reason'}).kind, 'blocked');
  E.setInput(state, '2'); assert.equal(E.submit(state, bank, checkAnswer).kind, 'correct');
  assert.equal(E.next(state, bank), false, 'a required explanation cannot be bypassed by a numeric answer');
  state = E.normalize(clone(state), bank, checkAnswer);
  assert.equal(E.current(state).reason.choice, 'wrong');
  assert.equal(E.submit(state, bank, checkAnswer, {field: 'reason'}).kind, 'wrong');
  E.useHelp(state, 'solution'); E.setReason(state, 'right');
  assert.equal(E.submit(state, bank, checkAnswer, {field: 'reason'}).kind, 'correct');
  E.next(state, bank, 200);
  state = E.normalize(clone(state), bank, checkAnswer);
  const report = E.summary(state, bank), entry = report.results[0];
  assert.equal(report.independent, 1, 'mathematical evidence is separate from reasoning');
  assert.equal(report.reasonCorrect, 1); assert.equal(report.reasonIndependent, 0);
  assert.equal(entry.firstCorrect, true); assert.equal(entry.firstHelpUsed, false);
  assert.equal(entry.reason.firstCorrect, false); assert.equal(entry.reason.firstHelpUsed, false);
  assert.equal(entry.helpUsed, true);
});

test('an interruption resumes the exact queue and draft instead of recomputing a new assignment', () => {
  let state = begin(['review-item-4', 'review-item-1'], 'review');
  solve(state); E.next(state, bank);
  E.setInput(state, '7/'); E.setReason(state, 'ignored');
  state = E.normalize(clone(state), bank, checkAnswer);
  const existing = state.sessions.review;
  assert.equal(E.start(state, {mode: 'review', itemIds: ['review-item-8'], now: 999}, bank), existing);
  assert.deepEqual(existing.itemIds, ['review-item-4', 'review-item-1']);
  assert.equal(existing.cursor, 1); assert.equal(E.current(state).input, '7/');
  assert.equal(existing.startedAt, 100);
  assert.equal(state.history['review-item-1'].presentations, 1, 'reloading does not create another presentation');
});

test('skipping is visible and completes a session without inventing a mathematical attempt or a solved answer', () => {
  const state = begin(['final-item-1', 'final-item-2']);
  assert(E.skip(state)); assert.equal(E.current(state).attempts, 0);
  assert(E.next(state, bank)); solve(state); assert(E.next(state, bank, 200));
  const report = E.summary(E.normalize(clone(state), bank, checkAnswer), bank);
  assert.equal(report.complete, true); assert.equal(report.finished, 2); assert.equal(report.skipped, 1);
  assert.equal(report.attempted, 1); assert.equal(report.correct, 1); assert.equal(report.independent, 1);
  assert.deepEqual(report.recommendedLessonIds, ['lesson-1']);
});

test('known course conditions are never first independent assessment evidence', () => {
  const suppliedBank = clone(bank), item = suppliedBank.items.find(item => item.id === 'review-item-1');
  item.previouslySeen = true; item.sourceTaskId = 'old-lesson-check'; item.familiarPractice = true;
  let state = begin([item.id], 'review', suppliedBank);
  assert.equal(E.current(state).presentation, 2);
  finish(state, suppliedBank);
  state = E.normalize(clone(state), suppliedBank, checkAnswer);
  const report = E.summary(state, suppliedBank);
  assert.equal(report.independent, 0); assert.equal(report.familiar, 1); assert.equal(report.results[0].familiarPractice, true);
  assert.equal(state.history[item.id].first, null, 'an earlier course exposure is not reconstructed as an assessment attempt');
  assert.equal(state.history[item.id].externalSeen, true);
});

test('a later familiar replay never overwrites the first correct answer, even when its help and error differ', () => {
  let state = begin(['review-item-1'], 'review'); finish(state);
  const first = clone(state.history['review-item-1'].first);
  E.start(state, {mode: 'review', itemIds: ['review-item-1'], now: 300}, bank);
  assert.equal(E.current(state).presentation, 2);
  E.useHelp(state, 'hint'); E.setInput(state, '999'); E.submit(state, bank, checkAnswer); solve(state); E.next(state, bank, 400);
  state = E.normalize(clone(state), bank, checkAnswer);
  assert.deepEqual(state.history['review-item-1'].first, first);
  assert.equal(state.history['review-item-1'].latest.firstCorrect, false);
  assert.equal(state.history['review-item-1'].latest.firstHelpUsed, true);
  assert.equal(E.summary(state, bank).independent, 0);
  const laterCourseBank = clone(bank); laterCourseBank.items.find(item => item.id === 'review-item-1').previouslySeen = true;
  assert.deepEqual(E.normalize(clone(state), laterCourseBank, checkAnswer).history['review-item-1'].first, first,
    'later exposure in a lesson cannot erase an earlier successful assessment');
});

test('normalization refuses a solved flag without a real answer, first-attempt evidence and a valid required explanation', () => {
  const state = begin(['final-item-0', 'final-item-1']);
  const item = state.sessions.final.entries['final-item-0'];
  item.solved = true; item.reason.solved = true;
  state.sessions.final.cursor = 2; state.sessions.final.completedAt = 300;
  let clean = E.normalize(clone(state), bank, checkAnswer);
  assert.equal(E.summary(clean, bank).correct, 0); assert.equal(E.summary(clean, bank).independent, 0);
  assert.equal(clean.sessions.final.completedAt, null); assert.equal(clean.sessions.final.cursor, 0);
  E.setInput(state, '2');
  item.input = '2'; item.attempts = 1; item.firstCorrect = true; item.firstHelpUsed = false;
  clean = E.normalize(clone(state), bank, checkAnswer);
  assert.equal(E.summary(clean, bank).correct, 0, 'the original first input is required as evidence, not only a flag');
  const valid = begin(['final-item-0']); solve(valid); E.next(valid, bank, 300);
  valid.sessions.final.entries['final-item-0'].reason.choice = 'wrong';
  valid.history['final-item-0'].first.reason.choice = 'wrong';
  valid.history['final-item-0'].latest.reason.choice = 'wrong';
  clean = E.normalize(clone(valid), bank, checkAnswer);
  assert.equal(clean.sessions.final.completedAt, null, 'a bad stored explanation cannot finish the item');
  assert.equal(E.summary(clean, bank).reasonCorrect, 0);
});

test('a stale session cannot erase help opened before the first mathematical answer', () => {
  let state = begin(['final-item-1']);
  const stale = clone(state.sessions.final);
  E.useHelp(state, 'hint');
  assert.equal(state.history['final-item-1'].first.firstCorrect, null);
  state.sessions.final = stale;
  state = E.normalize(clone(state), bank, checkAnswer);
  assert.equal(E.current(state).help.hint, true); assert.equal(E.current(state).helpUsed, true);
  solve(state); E.next(state, bank);
  assert.equal(E.summary(state, bank).independent, 0);
  assert.equal(state.history['final-item-1'].first.firstHelpUsed, true);
});

test('a stale session cannot erase the first wrong explanation or help used before an explanation', () => {
  let state = begin(['final-item-0']);
  E.setInput(state, '2'); E.submit(state, bank, checkAnswer);
  const stale = clone(state.sessions.final);
  E.setReason(state, 'wrong'); E.submit(state, bank, checkAnswer, {field: 'reason'});
  E.useHelp(state, 'solution');
  state.sessions.final = stale;
  state = E.normalize(clone(state), bank, checkAnswer);
  assert.equal(E.current(state).reason.firstCorrect, false);
  assert.equal(E.current(state).help.solution, true);
  E.setReason(state, 'right'); E.submit(state, bank, checkAnswer, {field: 'reason'}); E.next(state, bank);
  assert.equal(E.summary(state, bank).independent, 1);
  assert.equal(E.summary(state, bank).reasonIndependent, 0);
  assert.equal(state.history['final-item-0'].first.reason.firstCorrect, false);

  let helped = begin(['final-item-0']);
  E.setInput(helped, '2'); E.submit(helped, bank, checkAnswer);
  const beforeHelp = clone(helped.sessions.final);
  E.useHelp(helped, 'hint'); helped.sessions.final = beforeHelp;
  helped = E.normalize(clone(helped), bank, checkAnswer);
  E.setReason(helped, 'right'); E.submit(helped, bank, checkAnswer, {field: 'reason'}); E.next(helped, bank);
  assert.equal(E.summary(helped, bank).independent, 1);
  assert.equal(E.summary(helped, bank).reasonIndependent, 0);
});

test('normalization rejects unknown, cross-mode, repeated and oversized queues, and does not activate a missing session', () => {
  for (const ids of [['missing'], ['review-item-1'], ['final-item-1', 'final-item-1'], Array(65).fill('final-item-1')]) {
    const state = begin(['final-item-1']); state.sessions.final.itemIds = ids;
    const clean = E.normalize(state, bank, checkAnswer);
    assert.equal(clean.sessions.final, null); assert.equal(clean.active, null);
  }
  assert.deepEqual(E.normalize({version: 999}, bank, checkAnswer), E.fresh());
  assert.deepEqual(E.normalize(null, bank, checkAnswer), E.fresh());
  const state = begin(['final-item-1']); state.active = 'unknown';
  assert.equal(E.normalize(state, bank, checkAnswer).active, null);
});

test('future unpresented items cannot supply achievements or move the cursor past an unfinished item', () => {
  const state = begin(['final-item-1', 'final-item-2']);
  const fabricated = clone(state.sessions.final.entries['final-item-1']);
  Object.assign(fabricated, {id: 'final-item-2', presentation: 1, input: '4', firstInput: '4', attempts: 1,
    firstCorrect: true, firstHelpUsed: false, solved: true});
  state.sessions.final.entries[fabricated.id] = fabricated;
  const clean = E.normalize(state, bank, checkAnswer);
  assert.equal(clean.sessions.final.entries[fabricated.id].presentation, 0);
  assert.equal(E.summary(clean, bank).correct, 0);
  assert.equal(clean.history[fabricated.id], undefined);
});

test('short drafts and malformed explanation choices are safe, and returned reports cannot mutate saved evidence', () => {
  let state = begin(['final-item-0']);
  E.setInput(state, '9'.repeat(500)); assert.equal(E.current(state).input.length, 40);
  E.setReason(state, 'not-an-option');
  state = E.normalize(clone(state), bank, checkAnswer);
  assert.equal(E.current(state).reason.choice, '');
  solve(state); E.next(state, bank);
  const report = E.summary(state, bank); report.results[0].firstCorrect = false; report.results[0].reason.solved = false;
  assert.equal(state.history['final-item-0'].first.firstCorrect, true);
  assert.equal(E.summary(state, bank).reasonCorrect, 1);
});

test('ordinary offline browser scripts and Node expose the same engine without a storage or network dependency', () => {
  const context = {window: {}}; vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, 'arzhenikov-completion-engine.js'), 'utf8'), context);
  const browser = context.window.ArzhenikovCompletionEngine;
  assert.deepEqual(Object.keys(browser).sort(), Object.keys(E).sort());
  assert.deepEqual(JSON.parse(JSON.stringify(browser.fresh())), E.fresh());
  assert.deepEqual(Array.from(browser.selectItems('placement', bank)), E.selectItems('placement', bank));
});
