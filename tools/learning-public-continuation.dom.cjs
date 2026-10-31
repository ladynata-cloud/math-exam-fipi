'use strict';

// Exercise the real public wrappers, local adapter and managed renderer.
// Browser records are isolated fixtures, never a learner's account or history.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { JSDOM, VirtualConsole } = require('jsdom');
const contracts = require('../trainers/oge-basics/learning-contracts');
const repo = path.resolve(__dirname, '..');
const clone = value => JSON.parse(JSON.stringify(value));
const key = id => 'mathExamBasics.divisionCourse.v1.' + id;
const historyKey = id => 'mathExamBasics.divisionCourse.history.v1.' + id;
const tick = () => new Promise(resolve => setImmediate(resolve));

function localScriptFilename(src, pageURL) {
  const page = new URL(pageURL);
  const resource = new URL(src, page);
  assert.equal(resource.origin, page.origin, 'Wrapper dependencies must be same-origin site resources');
  const pathname = decodeURIComponent(resource.pathname);
  assert(!/[\\\0]/.test(pathname), 'Invalid local wrapper dependency path');
  const filename = path.resolve(repo, '.' + pathname);
  assert(filename.startsWith(repo + path.sep), 'Wrapper dependencies must stay inside the site');
  assert(fs.existsSync(filename) && fs.statSync(filename).isFile(), 'Every declared wrapper dependency must be a local file: ' + src);
  return filename;
}

function legacyRecord(id, seed, steps = 0) {
  const { taskSpec, state } = contracts.create(id, seed, { generatorVersion: 1 });
  state.answers = taskSpec.steps.slice(0, steps).map(step => String(step.answer));
  state.step = state.answers.length;
  const normalized = contracts.normalize(taskSpec, state);
  return JSON.stringify({ version: 1, seed, state: normalized, assisted: false, errors: 0 });
}

function mount(t, id, initial = {}, { failWrites = false, failHistoryWrites = false, changeContracts } = {}) {
  const relative = 'trainers/oge-basics/' + id + '.html';
  const html = fs.readFileSync(path.join(repo, relative), 'utf8');
  const errors = [], writes = [], records = new Map(Object.entries(initial));
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error));
  const dom = new JSDOM(html, { url: 'https://example.test/' + relative, runScripts: 'outside-only', virtualConsole });
  const { window } = dom;
  Object.defineProperty(window, 'localStorage', { value: {
    getItem: name => records.get(name) ?? null,
    setItem(name, value) { if (failWrites || (failHistoryWrites && name === historyKey(id))) throw Error('Storage is full'); writes.push([name, value]); records.set(name, value); }
  } });
  let bridge, applied;
  for (const script of [...window.document.querySelectorAll('script[src]')]) {
    const src = script.getAttribute('src').split('?')[0];
    if (src.endsWith('division-course-practice.js')) changeContracts?.(window.MathExamRemediation);
    if (src.endsWith('learning-managed.js')) {
      const register = window.MathExamLearning.register;
      window.MathExamLearning.register = adapter => {
        bridge = adapter;
        const apply = adapter.applyState;
        adapter.applyState = payload => { applied = clone(payload); apply(payload); };
        register(adapter);
      };
    }
    window.eval(fs.readFileSync(localScriptFilename(script.getAttribute('src'), window.location.href), 'utf8'));
  }
  assert(bridge); assert.deepEqual(errors, []);
  window.document.getElementById('practice').click();
  const state = () => clone(bridge.getState());
  const spec = () => clone(applied.taskSpec);
  function answer(value) {
    const field = window.document.getElementById('lm-answer'); assert(field);
    field.value = String(value); field.dispatchEvent(new window.Event('input', { bubbles: true }));
    window.document.getElementById('lm-check').click();
    assert.deepEqual(errors, []);
    contracts.normalize(spec(), state());
  }
  function finish() {
    let remaining = 150;
    while (!state().completed) { assert(remaining-- > 0); answer(spec().steps[state().step].answer); }
  }
  async function next() {
    const button = window.document.getElementById('lm-new'); assert(button);
    button.click(); button.click(); await tick(); assert.deepEqual(errors, []);
  }
  t.after(() => dom.window.close());
  return { window, records, writes, state, spec, answer, finish, next,
    notice: () => window.document.querySelector('.course-local-notice').textContent };
}

test('public wrapper scripts resolve like browser URLs while rejecting foreign, missing and escaping resources', () => {
  const pageURL = 'https://example.test/trainers/oge-basics/multiplication-division/course-estimate.html';
  const expected = path.join(repo, 'trainers/oge-basics/learning-contracts.js');
  assert.equal(localScriptFilename('../learning-contracts.js?version20261031#fixture', pageURL), expected);
  assert.equal(localScriptFilename('/trainers/oge-basics/learning-contracts.js?version20261031', pageURL), expected);
  for (const src of ['https://other.test/script.js', '//other.test/script.js', 'http://example.test/script.js', 'https://example.test:8443/script.js']) {
    assert.throws(() => localScriptFilename(src, pageURL), /same-origin/);
  }
  assert.throws(() => localScriptFilename('/%2e%2e%2foutside.js', pageURL), /inside the site/);
  for (const src of ['/assets/%5cscript.js', '/assets/%00script.js']) {
    assert.throws(() => localScriptFilename(src, pageURL), /Invalid local/);
  }
  for (const src of ['/assets/missing-continuation-fixture.js', '/assets/']) {
    assert.throws(() => localScriptFilename(src, pageURL), /must be a local file/);
  }
});

test('repeat skips an identical condition and keeps solved history before saving the fresh example', async t => {
  const id = 'multiplication-division/course-column-three-by-one';
  const oldSpec = contracts.create(id, 8, { generatorVersion: 1 }).taskSpec;
  assert.equal(oldSpec.task.prompt, contracts.create(id, 9, { generatorVersion: 1 }).taskSpec.task.prompt,
    'The regression fixture really contains adjacent duplicate conditions');
  const saved = legacyRecord(id, 8, oldSpec.steps.length);
  const f = mount(t, id, { [key(id)]: saved });
  assert.deepEqual(f.writes, [], 'Opening a completed legacy record does not rewrite it');
  assert.equal(f.records.get(key(id)), saved);
  await f.next();
  const fresh = JSON.parse(f.records.get(key(id)));
  assert.equal(fresh.seed, 10, 'One deliberate next click skips seed 9 and opens the first different condition');
  assert.notEqual(f.spec().task.prompt, oldSpec.task.prompt);
  assert.equal(f.state().step, 0); assert.equal(f.state().completed, false);
  assert.deepEqual(JSON.parse(f.records.get(historyKey(id))), { schemaVersion: 1, hasCompleted: true });
  assert.equal(f.writes[0][0], historyKey(id)); assert.equal(f.writes[1][0], key(id));
  assert.equal(f.writes.filter(([name]) => name === key(id)).length, 1, 'Double click creates only one new example');
  assert.equal(fresh.generatorVersion, undefined, 'Unversioned multiplication tasks remain compatible');
  const resumed = mount(t, id, Object.fromEntries(f.records));
  assert.equal(resumed.spec().task.prompt, f.spec().task.prompt); assert.deepEqual(resumed.state(), f.state());
  assert.deepEqual(resumed.writes, []);
});

test('legacy division restores exactly; the next example and its reload use generator v2', async t => {
  const id = 'multiplication-division/course-estimate';
  const saved = legacyRecord(id, 17, 3);
  const f = mount(t, id, { [key(id)]: saved });
  const legacySpec = contracts.create(id, 17, { generatorVersion: 1 }).taskSpec;
  assert.equal(f.spec().generatorVersion, undefined);
  assert.equal(f.spec().task.prompt, legacySpec.task.prompt);
  assert.deepEqual(f.spec().steps, legacySpec.steps);
  assert.deepEqual(f.state(), JSON.parse(saved).state);
  assert.equal(f.records.get(key(id)), saved); assert.deepEqual(f.writes, []);
  f.finish(); await f.next();
  const current = JSON.parse(f.records.get(key(id)));
  assert.equal(current.generatorVersion, 2); assert.equal(f.spec().generatorVersion, 2);
  assert.equal(current.state.step, 0);
  f.answer(f.spec().steps[0].answer);
  const resumed = mount(t, id, Object.fromEntries(f.records));
  assert.deepEqual(resumed.spec(), f.spec()); assert.deepEqual(resumed.state(), f.state());
  assert.deepEqual(resumed.writes, []);
});

test('new division work writes its generator version and historical marker on completion', t => {
  const id = 'multiplication-division/course-multiply-bridge';
  const f = mount(t, id);
  assert.equal(f.spec().generatorVersion, 2);
  assert.deepEqual(f.writes, []);
  f.finish();
  assert.equal(JSON.parse(f.records.get(key(id))).generatorVersion, 2);
  assert.equal(JSON.parse(f.records.get(historyKey(id))).hasCompleted, true);
});

test('malformed latest work is left byte-for-byte intact while practice remains usable', t => {
  const id = 'multiplication-division/course-column-one-digit', broken = '{not a record';
  const f = mount(t, id, { [key(id)]: broken });
  f.answer(f.spec().steps[0].answer);
  assert.equal(f.state().step, 1); assert.equal(f.records.get(key(id)), broken);
  assert.equal(f.writes.some(([name]) => name === key(id)), false);
  assert.match(f.notice(), /оставлена без изменений/);
});

test('malformed historical metadata is preserved independently of the current work', async t => {
  const id = 'multiplication-division/course-column-one-digit', broken = '{not history';
  const f = mount(t, id, { [historyKey(id)]: broken });
  f.finish(); await f.next();
  assert.equal(f.state().step, 0);
  assert.equal(f.records.get(historyKey(id)), broken);
  assert.equal(f.writes.some(([name]) => name === historyKey(id)), false);
  assert.equal(JSON.parse(f.records.get(key(id))).state.completed, true, 'Keep the completed record while its history cannot be saved');
  assert.match(f.notice(), /оставлена без изменений/);
});

test('a partial quota failure preserves completed work when only the new history key is refused', async t => {
  const id = 'multiplication-division/course-estimate';
  const spec = contracts.create(id, 17, { generatorVersion: 1 }).taskSpec;
  const saved = legacyRecord(id, 17, spec.steps.length);
  const f = mount(t, id, { [key(id)]: saved }, { failHistoryWrites: true });
  await f.next();
  assert.equal(f.state().step, 0, 'Practice can continue in memory');
  assert.notEqual(f.spec().task.prompt, spec.task.prompt);
  f.answer(f.spec().steps[0].answer);
  assert.equal(f.records.get(key(id)), saved, 'The completed proof remains byte-for-byte intact');
  assert.equal(f.records.has(historyKey(id)), false);
  assert.equal(f.writes.some(([name]) => name === key(id)), false);
  assert.match(f.notice(), /новая работа здесь не сохранится/);
});

test('a failed browser write keeps the existing saved bytes and reports the problem', async t => {
  const id = 'multiplication-division/course-column-one-digit';
  const saved = legacyRecord(id, 3);
  const f = mount(t, id, { [key(id)]: saved }, { failWrites: true });
  f.finish(); await f.next();
  assert.equal(f.state().step, 0);
  assert.equal(f.records.get(key(id)), saved);
  assert.match(f.notice(), /Не удалось сохранить/);
});

test('a bounded search never replaces completed work with an identical condition', async t => {
  const id = 'multiplication-division/course-column-one-digit';
  const old = contracts.create(id, 1, { generatorVersion: 1 });
  const saved = legacyRecord(id, 1, old.taskSpec.steps.length);
  let createCalls = 0;
  const f = mount(t, id, { [key(id)]: saved }, { changeContracts(api) {
    const create = api.create;
    api.create = (...args) => { if (args[2] === undefined) createCalls++; return create(args[0], 1, args[2]); };
  } });
  const before = createCalls;
  await f.next();
  assert.equal(createCalls - before, 64, 'A broken generator cannot cause an unbounded loop');
  assert.equal(f.state().completed, true); assert.equal(f.spec().task.prompt, old.taskSpec.task.prompt);
  assert.equal(f.records.get(key(id)), saved);
  assert.match(f.notice(), /Не удалось подобрать другой пример/);
  assert.equal(f.window.document.getElementById('lm-new').disabled, false);
});
