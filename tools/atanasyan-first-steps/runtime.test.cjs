'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = path.resolve(__dirname, '../..');
const bundle = JSON.parse(fs.readFileSync(path.join(root, 'learning/atanasyan-first-steps/course.json'), 'utf8'));
const taskId = 'atanasyan-7-9-main-92-part-1';
const nextId = 'atanasyan-7-9-main-92-part-2';
const scope = 'student:runtime-fixture';
const key = id => 'mathExamAtanasyanFirstSteps.v1:' + encodeURIComponent(scope) + ':' + id + ':r1';
function memory() {
  const values = new Map();
  return { values, getItem: name => values.get(name) ?? null, setItem: (name, value) => values.set(name, value) };
}
function setup(options = {}) {
  const virtualConsole = new VirtualConsole(), errors = [];
  virtualConsole.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM('<!doctype html><main id="host"></main>', { url: 'https://mathexam.test/learning/atanasyan-first-steps/', runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole });
  const { window } = dom, host = window.document.querySelector('#host');
  window.HTMLElement.prototype.scrollIntoView = function () {};
  for (const file of ['geometry-course/textbook/assets/math-text.js', 'geometry-course/textbook/assets/planar-viewer.js', 'learning/atanasyan-first-steps/state.js', 'learning/atanasyan-first-steps/app.js']) window.eval(fs.readFileSync(path.join(root, file), 'utf8'));
  const storage = Object.hasOwn(options, 'storage') ? options.storage : memory();
  const dispose = window.AtanasyanFirstSteps.mount(host, { bundle: window.JSON.parse(JSON.stringify(bundle)), initialLessonId: taskId, storageScope: scope, ...options, storage });
  const input = (selector, text) => { const field = host.querySelector(selector); assert.ok(field, selector); field.value = text; field.dispatchEvent(new window.Event('input', { bubbles: true })); };
  const click = selector => { const element = host.querySelector(selector); assert.ok(element, selector); element.click(); };
  const tick = () => new Promise(resolve => window.setTimeout(resolve, 5));
  const open = async id => { click('.afs-task-header button'); click(`[data-lesson-id="${id}"]`); await tick(); };
  const textButton = text => { const item = [...host.querySelectorAll('button')].find(button => button.textContent === text); assert.ok(item, text); item.click(); };
  return { dom, window, host, storage, errors, input, click, tick, open, textButton, dispose, close() { dispose(); window.close(); } };
}
const passed = [], failed = [];
async function check(name, action) { try { await action(); passed.push(name); } catch (error) { failed.push({ name, error: error.stack }); } }

(async () => {
  await check('task and step drafts survive theory dialogs and task navigation', async () => {
    const view = setup();
    try {
      view.input('[data-final-answer]', 'Стороны треугольника: MN, NP и PM.');
      view.click('[data-next-step]'); await view.tick();
      view.input('[data-step-draft="step-1"]', 'Назову вершины M, N, P.');
      assert.equal(view.host.querySelector('.planar-svg').dataset.view, 'step-1');
      const details = view.host.querySelector('[data-step-explanation="0"]'); details.open = true; await view.tick();
      view.click('.afs-rules button'); await view.tick();
      assert.ok(view.host.querySelector('dialog[open]'));
      view.click('dialog button'); await view.tick();
      assert.equal(view.host.querySelector('[data-final-answer]').value, 'Стороны треугольника: MN, NP и PM.');
      assert.equal(view.host.querySelector('[data-step-draft="step-1"]').value, 'Назову вершины M, N, P.');
      await view.open(nextId); await view.open(taskId);
      assert.equal(view.host.querySelector('[data-final-answer]').value, 'Стороны треугольника: MN, NP и PM.');
      assert.equal(view.host.querySelector('[data-step-draft="step-1"]').value, 'Назову вершины M, N, P.');
      assert.equal(view.host.querySelector('[data-step-explanation="0"]').open, true);
      assert.equal(view.host.querySelector('.planar-svg').dataset.view, 'step-1');
      const record = JSON.parse(view.storage.getItem(key(taskId)));
      assert.equal(record.assisted, true); assert.equal(Object.hasOwn(record, 'checked'), false);
      assert.deepEqual(view.errors, []);
    } finally { view.close(); }
  });

  await check('later steps preserve earlier answers and expose only corresponding model views', async () => {
    const view = setup();
    try {
      view.click('[data-next-step]'); await view.tick();
      view.input('[data-step-draft="step-1"]', 'Первый ответ остаётся.');
      view.click('[data-next-step]'); await view.tick();
      assert.equal(view.host.querySelectorAll('[data-step-index]').length, 2);
      assert.equal(view.host.querySelector('[data-step-draft="step-1"]').value, 'Первый ответ остаётся.');
      assert.equal(view.host.querySelector('.planar-svg').dataset.view, 'step-2');
      const record = JSON.parse(view.storage.getItem(key(taskId)));
      assert.equal(record.model.maxStep, record.revealed); assert.equal(record.revealed, 2);
      const help = view.host.querySelector('[data-guided-help]'); help.open = false; await view.tick();
      assert.equal(JSON.parse(view.storage.getItem(key(taskId))).assisted, true);
      assert.ok(!/правильно|верно|решено самостоятельно/i.test(view.host.querySelector('[data-work-status]').textContent));
      assert.deepEqual(view.errors, []);
    } finally { view.close(); }
  });

  await check('blocked storage retains work and never claims persistent saving', async () => {
    const view = setup({ storage: { getItem() { return null; }, setItem() { throw Error('quota'); } } });
    try {
      view.input('[data-final-answer]', 'Работа без доступного хранилища.');
      view.click('[data-save-work]'); await view.tick();
      assert.doesNotMatch(view.host.querySelector('[data-save-status]').textContent, /Запись сохранена на этом устройстве/);
      assert.match(view.host.textContent, /остаются в открытой странице|остаётся.*открытой странице|не сохранил/);
      await view.open(nextId); await view.open(taskId);
      assert.equal(view.host.querySelector('[data-final-answer]').value, 'Работа без доступного хранилища.');
      view.textButton('Скачать резервную копию');
      const exported = JSON.parse(view.host.querySelector('textarea[aria-label="Записи для копирования"]').value);
      assert.equal(exported.records.find(record => record.lessonId === taskId).draft, 'Работа без доступного хранилища.');
      assert.deepEqual(view.errors, []);
    } finally { view.close(); }
  });

  await check('foreign tab update freezes inputs and exports current writing without overwriting the winner', async () => {
    const view = setup();
    try {
      view.input('[data-final-answer]', 'Мой текущий текст');
      const saved = JSON.parse(view.storage.getItem(key(taskId))); saved.draft = 'Текст другого окна'; saved.updatedAt = '2026-10-28T01:00:00.000Z';
      const winner = JSON.stringify(saved); view.storage.setItem(key(taskId), winner);
      view.window.dispatchEvent(new view.window.StorageEvent('storage', { key: key(taskId), newValue: winner }));
      assert.equal(view.host.querySelector('[data-final-answer]').readOnly, true);
      assert.equal(view.host.querySelector('[data-save-work]').disabled, true);
      assert.ok(view.host.querySelector('[data-reload-record]'));
      view.textButton('Скачать мои записи');
      const exported = JSON.parse(view.host.querySelector('textarea[aria-label="Записи для копирования"]').value);
      assert.equal(exported.records.find(record => record.lessonId === taskId).draft, 'Мой текущий текст');
      assert.equal(view.storage.getItem(key(taskId)), winner);
      view.click('[data-reload-record]'); await view.tick();
      assert.equal(view.host.querySelector('[data-final-answer]').value, 'Текст другого окна');
      assert.equal(view.host.querySelector('[data-final-answer]').readOnly, false);
      assert.deepEqual(view.errors, []);
    } finally { view.close(); }
  });

  await check('invalid record on a direct lesson link is visibly locked and offers recovery', async () => {
    const disk = memory(); disk.setItem(key(taskId), '{damaged');
    const view = setup({ storage: disk });
    try {
      assert.match(view.host.textContent, /другой формат/);
      assert.equal(view.host.querySelector('[data-final-answer]').readOnly, true);
      assert.equal(view.host.querySelector('[data-save-work]').disabled, true);
      assert.ok(view.host.querySelector('[data-reload-record]'), 'Recovery controls must survive rendering');
      assert.equal(disk.getItem(key(taskId)), '{damaged');
      assert.deepEqual(view.errors, []);
    } finally { view.close(); }
  });

  await check('teacher preview does not touch learner records or expose their text', async () => {
    let reads = 0, writes = 0;
    const view = setup({ readOnly: true, role: 'teacher', storage: { getItem() { reads++; return 'PRIVATE RECORD'; }, setItem() { writes++; } } });
    try {
      assert.equal(view.host.querySelector('[data-final-answer]').readOnly, true);
      assert.equal(view.host.querySelector('[data-save-work]').disabled, true);
      assert.doesNotMatch(view.host.textContent, /PRIVATE RECORD/);
      view.click('[data-next-step]'); await view.tick();
      assert.equal(view.host.querySelectorAll('[data-step-index]').length, 1);
      assert.equal(view.host.querySelector('[data-step-draft]').readOnly, true);
      assert.equal(reads, 0); assert.equal(writes, 0);
      assert.equal(view.host.querySelector('[data-import-legacy]'), null);
      assert.deepEqual(view.errors, []);
    } finally { view.close(); }
  });

  console.log(JSON.stringify({ gate: failed.length ? 'ATANASYAN_FIRST_STEPS_RUNTIME_FAILED' : 'ATANASYAN_FIRST_STEPS_RUNTIME_OK', passed: passed.length, failed: failed.length, cases: passed, failures: failed }, null, 2));
  if (failed.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
