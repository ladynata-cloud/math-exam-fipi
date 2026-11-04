'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const M = require('../peterson6/math.js');
const dataContext={window:{}};vm.runInNewContext(fs.readFileSync(__dirname+'/data.js','utf8'),dataContext);const lessons=dataContext.window.NikolskyCourse.lessons;
const task = lessons.flatMap(l => l.tasks).find(t => t.kind === 'number' && t.steps.length >= 2);
assert(task, 'A numeric course task is needed for import regression tests');
const blank = () => ({ version: 1, tasks: {}, practice: {}, last: null, origin: null });
const importedResult = () => ({ value: task.answer, correct: true, independent: true, attempts: 1, assisted: false, note: 'Запись из файла' });

function runtime(initial) {
  const elements = {};
  const node = () => ({ innerHTML: '', textContent: '', value: '', hidden: true, querySelectorAll: () => [], setAttribute() {}, removeAttribute() {}, addEventListener() {} });
  const document = { getElementById: id => elements[id] || (elements[id] = node()), querySelectorAll: () => [], querySelector: () => node(), addEventListener() {} };
  const window = { NikolskyCourse: { lessons, chapters: [], sourceMap: { sections: [] } }, PetersonMath: M, NikolskyCheck: require('./check.js'), addEventListener() {}, scrollTo() {} };
  const ctx = { window, document, localStorage: { getItem: () => JSON.stringify(initial), setItem() {} }, location: { hash: '#progress' }, console, requestAnimationFrame: f => f(), setTimeout, URL, Blob };
  vm.runInNewContext(fs.readFileSync(__dirname + '/app.js', 'utf8'), ctx);
  return { api: window.NikolskyApp, async load(record) {
    const state = blank(); state.tasks[task.id] = record;
    await elements['import-file'].onchange({ target: { files: [{ size: 1000, text: async () => JSON.stringify({ course: 'nikolsky10-2022', state }) }] } });
    return window.NikolskyApp.getState().tasks[task.id];
  } };
}

test('import preserves current notebook when the incoming file has a completed answer', async () => {
  const state = blank(); state.tasks[task.id] = { note: 'Собственное объяснение', value: '', attempts: 0 };
  const result = await runtime(state).load(importedResult());
  assert.equal(result.note, 'Собственное объяснение');
  assert.equal(result.correct, false);
  assert.equal(result.value, '');
});

test('import preserves a step-only draft with no final answer or notebook', async () => {
  const state = blank(); state.tasks[task.id] = { values: ['Незавершённое вычисление'], step: 0, note: '', value: '' };
  const result = await runtime(state).load(importedResult());
  assert.equal(result.values[0], 'Незавершённое вычисление');
  assert.equal(result.correct, false);
});

test('import preserves assistance history and accepted steps', async () => {
  const state = blank(); state.tasks[task.id] = { values: [task.steps[0].answer], step: 1, assisted: true, guided: false, hint: false, value: '', note: '' };
  const result = await runtime(state).load(importedResult());
  assert.equal(result.step, 1);
  assert.equal(result.assisted, true);
  assert.equal(result.independent, false);
});

test('import fills an untouched record with validated saved work', async () => {
  const state = blank(); state.tasks[task.id] = { values: [], step: 0, value: '', note: '' };
  const result = await runtime(state).load(importedResult());
  assert.equal(result.value, task.answer);
  assert.equal(result.correct, true);
  assert.equal(result.independent, true);
  assert.equal(result.note, 'Запись из файла');
});
