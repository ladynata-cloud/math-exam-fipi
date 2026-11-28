'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const S = require('../school/state');
const M = require('../school/math');
const C = require('../school/curriculum');
require('../school/algebra7').install(C, M);
require('../school/secondary').install(C, M);
require('../school/core-content').install(C);
require('../school/core-math').install(M);
require('../school/paths').install(C);
const editions = require('../school/editions-content');
editions.install(C);
require('../school/editions-math').install(M);
const v6 = require('../school/vilenkin6-lessons');
v6.install(C, editions);
require('../school/vilenkin6-math').install(M);
require('../school/vilenkin5-lessons').install(C, v6);
require('../school/vilenkin5-math').install(M, C);

const ids = C.lessons.map(lesson => lesson.id);
const fifth = 'v5f-fraction-same-add';
const sixth = 'v6f-fraction-lcd';

function session(id, changes = {}) {
  return { id, seed: 0, task: M.generate(id, 0), mode: 'learn', step: 0, attempt: 0,
    checkIndex: 0, assisted: false, exposed: false, correct: false, message: '',
    hintLevels: {}, answers: [], savedInput: '', ...changes };
}

function saveAndLoad(state) {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  S.save(storage, state);
  const loaded = S.load(storage, ids);
  assert.equal(loaded.warning, '');
  return loaded.state;
}

test('validated personal backup resumes accepted work, typed text, assistance and check position separately', () => {
  const state = S.blank();
  const learned = session(fifth);
  learned.answers = [M.fmt(learned.task.steps[0].answer)];
  Object.assign(learned, { step: 1, savedInput: '3/', hintLevels: { 1: 2 }, assisted: true });
  S.checkpointVilenkin(state, learned);
  const check = session(sixth, { mode: 'check', checkIndex: 2, attempt: 1, exposed: true,
    savedInput: '999', message: 'Попробуй ещё раз.' });
  S.checkpointVilenkin(state, check);
  const verified = saveAndLoad(state);
  const before = JSON.stringify(verified);
  const done = S.restoreVilenkin(verified, 'vilenkin5', M);
  assert.equal(done.id, fifth);
  assert.equal(done.step, 1);
  assert.deepEqual(done.answers, learned.answers);
  assert.equal(done.savedInput, '3/');
  assert.equal(done.hintLevels[1], 2);
  assert.equal(done.assisted, true);
  const retry = S.restoreVilenkin(verified, sixth, M);
  for (const key of ['mode', 'checkIndex', 'attempt', 'exposed', 'correct', 'savedInput', 'message']) {
    assert.equal(retry[key], check[key], key);
  }
  assert.equal(JSON.stringify(verified), before, 'looking up a draft cannot change progress');
  S.clearVilenkin(verified, sixth);
  assert.equal(S.restoreVilenkin(verified, 'vilenkin6', M), null);
  assert.equal(S.restoreVilenkin(verified, fifth, M).savedInput, '3/');
});

test('a change in the task, its step, its answer or its required form invalidates the saved step', () => {
  const active = session(sixth, { mode: 'check', checkIndex: 1, savedInput: '42' });
  const state = S.blank();
  S.checkpointVilenkin(state, active);
  const before = JSON.stringify(state);
  const edits = [
    t => { t.prompt += ' Найди другую величину.'; },
    t => { t.steps[0].prompt += ' округли до десятых.'; },
    t => { t.steps[0].answer = 987654; },
    t => { t.answer = 987654; },
    t => { t.answerFormat = 'prime-factors'; }
  ];
  assert.equal(S.restoreVilenkin(state, sixth, M).savedInput, '42');
  for (const edit of edits) {
    const changedMath = { ...M, generate(id, seed) { const task = M.generate(id, seed); edit(task); return task; } };
    assert.equal(S.restoreVilenkin(state, sixth, changedMath), null);
    assert.equal(JSON.stringify(state), before);
  }
});

test('corrupt or foreign drafts cannot erase valid progress or be applied to another skill', () => {
  const state = S.blank();
  S.checkpointVilenkin(state, session(fifth, { savedInput: 'мой ответ' }));
  S.checkpointVilenkin(state, session(sixth));
  S.result(state, { skill: fifth, mode: 'check', correct: true, assisted: false, exposed: false,
    attempt: 1, time: 1000, fingerprint: 'previously-earned-check' });
  const invalid = [
    { skill: fifth }, { seed: -1 }, { seed: 0.5 }, { mode: 'diagnostic' }, { step: 9999 },
    { checkIndex: 9 }, { attempt: -1 }, { assisted: 'false' }
  ];
  for (const bad of invalid) {
    const copy = JSON.parse(JSON.stringify(state));
    Object.assign(copy.vilenkinDrafts[sixth], bad);
    const loaded = saveAndLoad(copy);
    assert.equal(S.restoreVilenkin(loaded, sixth, M), null, JSON.stringify(bad));
    assert.equal(S.restoreVilenkin(loaded, fifth, M).savedInput, 'мой ответ');
    assert.deepEqual(loaded.events, state.events);
    assert.deepEqual(loaded.skills, state.skills);
  }
});

test('old progress without drafts loads, and diagnostic or assigned lessons never become personal drafts', () => {
  const old = S.blank();
  delete old.vilenkinDrafts;
  old.last = { skill: fifth, mode: 'check', seed: 1001 };
  const state = saveAndLoad(old);
  assert.deepEqual(state.last, old.last);
  assert.equal(S.restoreVilenkin(state, fifth, M), null);
  S.checkpointVilenkin(state, session(sixth, { mode: 'diagnostic', diagnostic: { index: 0 } }));
  assert.equal(S.restoreVilenkin(state, sixth, M), null);
  S.checkpointVilenkin(state, session(sixth, { savedInput: 'начал сам' }));
  state.assignment = { schema: 'mathexam-assignment', version: 1, id: 'a-1',
    title: 'Задание преподавателя', skills: [sixth], seed: 17 };
  S.checkpointVilenkin(state, session(sixth, { mode: 'check', savedInput: 'по заданию' }));
  assert.equal(S.restoreVilenkin(state, sixth, M), null);
  state.assignment = null;
  assert.equal(S.restoreVilenkin(state, sixth, M).savedInput, 'начал сам');
});

test('a historical course-level save restores typed work conservatively and respects later recorded success', () => {
  const state = S.blank();
  const mark = S.fingerprint(sixth, M.generate(sixth, 0));
  state.vilenkinDrafts = { vilenkin6: { skill: sixth, mode: 'check', seed: 0, step: 0,
    attempt: 1, checkIndex: 1, correct: false, assisted: true, exposed: false,
    fingerprint: mark, savedInput: 'ещё проверю', message: '', remedy: '' } };
  S.expose(state, mark);
  const migrated = saveAndLoad(state);
  const draft = S.restoreVilenkin(migrated, sixth, M);
  assert.equal(draft.savedInput, 'ещё проверю');
  assert.equal(draft.attempt, 1);
  assert.equal(draft.assisted, true);
  assert.equal(draft.exposed, true);
  assert.equal(draft.correct, false);
  S.result(migrated, { skill: sixth, mode: 'check', correct: true, assisted: true,
    exposed: true, attempt: 2, time: 1000, fingerprint: mark });
  const reloaded = saveAndLoad(migrated);
  const completed = S.restoreVilenkin(reloaded, sixth, M);
  assert.equal(completed.correct, true);
  assert.equal(completed.attempt, 2);
  assert.equal(reloaded.events.length, 1);
  assert.deepEqual(reloaded.skills[sixth].checks, []);
});

test('the ten most recent skills for each grade survive, including an older lesson the pupil revisited', () => {
  const state = S.blank();
  const fifthGrade = C.pathById.vilenkin5.ids.slice(0, 11);
  S.checkpointVilenkin(state, session(sixth, { savedInput: 'пока оставлю здесь' }));
  for (const id of fifthGrade.slice(0, 10)) S.checkpointVilenkin(state, session(id));
  S.checkpointVilenkin(state, session(fifthGrade[0], { savedInput: 'вернулся' }));
  S.checkpointVilenkin(state, session(fifthGrade[10]));
  const verified = saveAndLoad(state);
  assert.equal(S.restoreVilenkin(verified, 'vilenkin5', M).id, fifthGrade[10]);
  assert.equal(S.restoreVilenkin(verified, fifthGrade[1], M), null);
  assert.equal(S.restoreVilenkin(verified, fifthGrade[0], M).savedInput, 'вернулся');
  assert.equal(S.restoreVilenkin(verified, 'vilenkin6', M).savedInput, 'пока оставлю здесь');
});

test('imported teacher reports retain results without copying private lesson text into the cabinet', () => {
  const state = S.blank();
  S.checkpointVilenkin(state, session(fifth, { savedInput: 'личная запись о решении' }));
  const report = S.validateReport({ schema: 'mathexam-report', version: 1, alias: '',
    assignmentId: '', createdAt: 1, progress: state }, ids);
  assert(!JSON.stringify(report).includes('личная запись о решении'));
  assert.deepEqual(report.progress.events, state.events);
  assert.equal(S.restoreVilenkin(state, fifth, M).savedInput, 'личная запись о решении');
});

test('only results from the same personal attempt can close a stale checkpoint', () => {
  const state = S.blank();
  const active = session(sixth, { mode: 'check' });
  const mark = S.fingerprint(sixth, active.task);
  S.expose(state, mark);
  S.checkpointVilenkin(state, active);
  const event = { skill: sixth, mode: 'check', correct: true, assisted: false,
    exposed: true, attempt: 1, time: 1000, fingerprint: mark };
  S.result(state, event); // A teacher-assigned session on the same condition.
  assert.equal(S.restoreVilenkin(saveAndLoad(state), sixth, M).correct, false);
  const completed = S.result(state, { ...event, assisted: true, attempt: 2, time: 2000,
    vilenkinRun: active.vilenkinRun });
  const resumed = S.restoreVilenkin(saveAndLoad(state), sixth, M);
  assert.equal(resumed.correct, true);
  assert.equal(resumed.attempt, 2);
  assert.equal(resumed.assisted, true);
  assert.equal(state.events.length, 2);
  const beforeDuplicate = JSON.stringify(state);
  const duplicate = S.result(state, { ...event, exposed: false, time: 3000, vilenkinRun: active.vilenkinRun });
  assert.deepEqual(duplicate, completed);
  assert.equal(JSON.stringify(state), beforeDuplicate, 'replayed completion cannot promote or add another result');
});
