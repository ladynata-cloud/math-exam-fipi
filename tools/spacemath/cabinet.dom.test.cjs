'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const source = fs.readFileSync(path.join(__dirname, '../../learning/spacemath.js'), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));
const teacher = { id: 'teacher_fixture', role: 'teacher' };
const pupil = { id: 'pupil_fixture', role: 'student', name: 'Проверочный ученик' };
function fixture(t) {
  const dom = new JSDOM('<main id="main"></main>', { url: 'https://cabinet.example/learning/#spacemath', runScripts: 'outside-only' });
  dom.window.eval(source); t.after(() => dom.window.close());
  return { w: dom.window, host: dom.window.document.getElementById('main') };
}
test('private list is scoped, hostile titles stay text, and copy retries retain the operation identity', async t => {
  const f = fixture(t), calls = [], routes = []; let attempt = 0;
  f.w.LearningSpaceMath.mount(f.host, { account: teacher, students: [pupil], navigate: route => routes.push(route), api: async (url, options) => {
    calls.push({ url, options });
    if (!options) return { models: [{ id: 'model_fixture', title: '<img src=x onerror=alert(1)>', objectCount: 3, updatedAt: 1 }] };
    if (++attempt === 1) throw Error('lost response');
    return { attempt: { id: 'copy_fixture' } };
  } });
  await tick(); assert.equal(calls[0].url, '/spacemath/models'); assert.equal(f.host.querySelectorAll('img').length, 0);
  f.host.querySelector('[data-spacemath-copy]').click(); await tick();
  f.host.querySelector('[data-spacemath-copy]').click(); await tick();
  const first = JSON.parse(calls[1].options.body), second = JSON.parse(calls[2].options.body);
  assert.equal(first.sourceAttemptId, 'model_fixture'); assert.deepEqual(first, second); assert(first.opId);
  assert.deepEqual(routes, ['attempt=copy_fixture']);
});
test('a late creation response cannot navigate after account context invalidation', async t => {
  const f = fixture(t); let resolve, current = true; const routes = [];
  const cleanup = f.w.LearningSpaceMath.mount(f.host, { account: pupil, navigate: route => routes.push(route), isCurrent: () => current,
    api: (_url, options) => options ? new Promise(done => { resolve = done; }) : Promise.resolve({ models: [] }) });
  await tick(); f.host.querySelector('form').dispatchEvent(new f.w.Event('submit', { cancelable: true })); await tick();
  current = false; cleanup(); resolve({ attempt: { id: 'old_account_model' } }); await tick();
  assert.deepEqual(routes, []);
});
test('a delayed initial list cannot enable controls during model creation', async t => {
  const f = fixture(t); let list, creation;
  f.w.LearningSpaceMath.mount(f.host, { account: teacher, students: [pupil], navigate() {},
    api: (_url, options) => new Promise(resolve => { if (options) creation = resolve; else list = resolve; }) });
  f.host.querySelector('form').dispatchEvent(new f.w.Event('submit', { cancelable: true })); await tick();
  list({ models: [{ id: 'model_fixture', title: 'A', updatedAt: 1 }] }); await tick();
  assert([...f.host.querySelectorAll('button,input,select')].every(node => node.disabled));
  creation({ attempt: { id: 'created' } }); await tick();
});
test('lesson selection distinguishes continuing a pupil document from copying a private model and fences stale handlers', async t => {
  const f = fixture(t), selections = [], urls = []; let current = true;
  f.w.LearningSpaceMath.mountLessonPicker(f.host, { learnerId: pupil.id, isCurrent: () => current,
    api: async url => { urls.push(url); return { models: [{ id: url.includes('?') ? 'pupil_model' : 'private_model', title: 'Модель', updatedAt: 1 }] }; },
    onSelect: async (choice, request) => { selections.push({ choice: JSON.parse(JSON.stringify(choice)), request }); return false; }
  });
  await tick(); assert.deepEqual(urls, ['/spacemath/models', '/spacemath/models?learnerId=pupil_fixture']);
  const pupilButton = f.host.querySelector('[data-spacemath-saved=pupil_model]');
  pupilButton.click(); await tick(); pupilButton.click(); await tick();
  assert.deepEqual(selections[0].choice, { kind: 'continue', attemptId: 'pupil_model' });
  assert.equal(selections[0].request, selections[1].request, 'Uncertain operation receipt is reused');
  f.host.querySelector('[data-spacemath-saved=private_model]').click(); await tick();
  assert.deepEqual(selections[2].choice, { kind: 'copy', attemptId: 'private_model' });
  current = false; pupilButton.click(); await tick(); assert.equal(selections.length, 3);
});
