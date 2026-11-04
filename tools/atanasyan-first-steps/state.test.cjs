'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const state = require(path.join(root, 'learning/atanasyan-first-steps/state.js'));
const bundle = JSON.parse(fs.readFileSync(path.join(root, 'learning/atanasyan-first-steps/course.json'), 'utf8'));
const lesson = bundle.lessons.find(item => item.id === 'atanasyan-7-9-main-92-part-1');
const clone = value => JSON.parse(JSON.stringify(value));
function storage() {
  const values = new Map();
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}
const passed = [];
function check(name, action) { action(); passed.push(name); }

check('account namespaces and public records remain isolated', () => {
  const disk = storage();
  const a = state.createStore({ storage: disk, scope: 'student:fixture-a' });
  const b = state.createStore({ storage: disk, scope: 'student:fixture-b' });
  const publicStore = state.createStore({ storage: disk });
  const record = a.read(lesson); record.draft = 'Общая сторона отмечена на рисунке.';
  assert.equal(a.write(lesson, record).saved, true);
  assert.equal(b.read(lesson).draft, '');
  assert.equal(publicStore.read(lesson).draft, '');
  assert.notEqual(a.keyFor(lesson), b.keyFor(lesson));
});

check('assistance stays recorded after closing help and rewriting a draft', () => {
  const disk = storage(), store = state.createStore({ storage: disk, scope: 'student:fixture-a' });
  const record = store.read(lesson); record.assisted = true; record.draft = 'Решение после подсказки';
  store.write(lesson, record);
  const proposed = state.empty(lesson); proposed.draft = 'Новое рассуждение';
  store.write(lesson, proposed);
  assert.equal(store.read(lesson).assisted, true);
  assert.equal(state.createStore({ storage: disk, scope: 'student:fixture-a' }).read(lesson).assisted, true);
  assert.equal(Object.hasOwn(store.read(lesson), 'checked'), false);
});

check('future model views and hidden steps are rejected', () => {
  const record = state.empty(lesson); record.assisted = true; record.revealed = 1; record.model.maxStep = 1;
  record.model.viewId = 'step-2';
  assert.throws(() => state.normalize(record, lesson), /INVALID_COURSE_RECORD/);
  record.model.viewId = 'step-1'; record.explained = [1];
  assert.throws(() => state.normalize(record, lesson), /INVALID_COURSE_RECORD/);
  record.explained = [0]; record.stepDrafts['unknown-step'] = 'Текст';
  assert.throws(() => state.normalize(record, lesson), /INVALID_COURSE_RECORD/);
});

check('all 799 authored source steps have a valid retained model state', () => {
  let states = 0;
  for (const card of bundle.lessons) {
    for (let index = 0; index < card.steps.length; index++) {
      const record = state.empty(card);
      record.assisted = true; record.revealed = index + 1; record.model.maxStep = index + 1;
      record.model.viewId = card.steps[index].view || 'neutral';
      record.stepDrafts[card.steps[index].id] = 'Запись к этому шагу';
      record.explained = [index]; record.justified = [index];
      assert.deepEqual(state.normalize(record, card), record, card.id + ' / ' + card.steps[index].id);
      states++;
    }
  }
  assert.equal(states, 799);
});

check('read-only mode never reads or writes pupil or legacy storage', () => {
  let reads = 0, writes = 0;
  const disk = { getItem() { reads++; throw Error('Do not read'); }, setItem() { writes++; throw Error('Do not write'); } };
  const store = state.createStore({ storage: disk, scope: 'student:fixture-a', readOnly: true });
  assert.equal(store.read(lesson).draft, '');
  assert.equal(store.write(lesson, state.empty(lesson)).readOnly, true);
  assert.deepEqual(store.all(bundle.lessons), []);
  assert.equal(store.legacy(lesson, bundle.book.id), null);
  assert.equal(store.last(bundle.lessons), null);
  store.remember(lesson);
  assert.equal(reads, 0); assert.equal(writes, 0);
});

check('unavailable storage retains full work in memory for export', () => {
  const notices = [], store = state.createStore({ storage: null, onNotice: (...item) => notices.push(item) });
  const record = store.read(lesson); record.draft = 'Текст для сохранения'; record.assisted = true;
  record.revealed = 1; record.model.maxStep = 1; record.stepDrafts[lesson.steps[0].id] = 'Первый шаг';
  const result = store.write(lesson, record);
  assert.equal(result.saved, false); assert.equal(result.memory, true);
  assert.equal(store.read(lesson).draft, record.draft);
  assert.equal(store.all(bundle.lessons)[0].stepDrafts[lesson.steps[0].id], 'Первый шаг');
  assert.equal(notices.filter(item => item[1] === 'storage').length, 1);
});

check('concurrent writes retain both versions and do not overwrite the winner', () => {
  const disk = storage(), first = state.createStore({ storage: disk }), second = state.createStore({ storage: disk });
  const a = first.read(lesson), b = second.read(lesson);
  a.draft = 'Версия первого окна'; first.write(lesson, a);
  const winner = disk.getItem(first.keyFor(lesson));
  b.draft = 'Версия второго окна';
  assert.equal(second.write(lesson, b).conflict, true);
  assert.equal(disk.getItem(first.keyFor(lesson)), winner);
  assert.equal(second.read(lesson).draft, b.draft);
  assert.equal(second.all([lesson])[0].draft, b.draft);
  assert.equal(second.reload(lesson).draft, a.draft);
});

check('invalid stored record stays intact instead of being silently replaced', () => {
  const disk = storage(), notices = [], store = state.createStore({ storage: disk, onNotice: (...item) => notices.push(item) });
  const key = store.keyFor(lesson); disk.setItem(key, '{invalid');
  assert.equal(store.read(lesson).draft, '');
  assert.equal(store.hasConflict(lesson), true);
  const record = state.empty(lesson); record.draft = 'Новая запись';
  assert.equal(store.write(lesson, record).conflict, true);
  assert.equal(disk.getItem(key), '{invalid');
  assert.ok(notices.some(item => item[1] === 'invalid'));
});

check('legacy work is offered explicitly and does not transfer checked credit', () => {
  const disk = storage(), store = state.createStore({ storage: disk, scope: 'student:fixture-a' });
  const legacyKey = `mathExamTextbook.v1:${bundle.book.id}:${lesson.id}:r${lesson.revision}`;
  const old = { draft: 'Прежняя запись', revealed: 1, assisted: false, checked: true, stepDrafts: { 'step-1': 'Мой шаг' } };
  disk.setItem(legacyKey, JSON.stringify(old));
  assert.equal(store.read(lesson).draft, '');
  const imported = store.legacy(lesson, bundle.book.id);
  assert.equal(imported.draft, old.draft); assert.equal(imported.assisted, true);
  assert.equal(Object.hasOwn(imported, 'checked'), false);
  assert.equal(store.read(lesson).draft, '', 'Offering import must not perform import');
  assert.deepEqual(JSON.parse(disk.getItem(legacyKey)), old);
  store.write(lesson, imported);
  assert.equal(store.read(lesson).draft, old.draft);
});

console.log(JSON.stringify({ gate: 'ATANASYAN_FIRST_STEPS_STATE_OK', tests: passed.length, passed }));
