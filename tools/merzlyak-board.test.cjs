'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const ROOT = path.resolve(__dirname, '..');
const bundle = require('../stereo-course/merzlyak-10-base/data/course.json');
const copy = value => JSON.parse(JSON.stringify(value));
const tick = () => new Promise(resolve => setTimeout(resolve, 10));
function boot(source = bundle, url = 'https://example.test/trainers/merzlyak-10-base.html') {
  const dom = new JSDOM('<body data-merzlyak-board="true"><div id="app"></div></body>', { url, runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window, doc = w.document, models = [], errors = [];
  let notifications = 0, registration;
  w.TextEncoder = TextEncoder; w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = () => {};
  w.addEventListener('error', event => errors.push(event.error));
  w.localStorage.setItem('mathExamTextbook.v1:merzlyak-2022-10-base:ex-16-010:r1', JSON.stringify({draft: 'Личная проверочная работа', revealed: 2}));
  w.localStorage.setItem('unrelated', 'preserve');
  const personalBefore = JSON.stringify({ ...w.localStorage });
  w.TaskSceneViewer = { mount(container, model, options = {}) {
    const svg = doc.createElement('svg'), live = doc.createElement('p');
    live.className = 'am-sr-only'; container.replaceChildren(svg, live);
    let camera = model.planar ? { yaw: 0, pitch: -Math.PI / 2 } : options.savedCamera || { yaw: .6, pitch: .4 };
    const api = {
      setView(view) { svg.dataset.view = view; return true; },
      getState() { return { ...camera }; },
      move(yaw, pitch) { camera = { yaw, pitch }; svg.dataset.yaw = yaw; svg.dataset.pitch = pitch; live.textContent = 'Вид модели изменён. Геометрия осталась прежней.'; options.onChange?.(camera); },
      destroy() { container.replaceChildren(); }
    };
    api.setView('neutral'); svg.dataset.yaw = camera.yaw; svg.dataset.pitch = camera.pitch; models.push(api); return api;
  }};
  w.MathExamBoard = { register(config) { registration = config; const cleanup = config.subscribe(() => notifications++); return { destroy: cleanup }; } };
  for (const file of ['stereo-course/assets/math-text.js', 'stereo-course/merzlyak-10-base/assets/engine.js', 'stereo-course/merzlyak-10-base/assets/board-session.js']) w.eval(fs.readFileSync(path.join(ROOT, file), 'utf8'));
  const inWindow = value => w.JSON.parse(JSON.stringify(value));
  const result = w.MerzlyakBoard.boot(inWindow(source), doc.getElementById('app'));
  const api = w.__merzlyakBoard;
  return { w, doc, api, models, result, inWindow, get registration() { return registration; }, get notifications() { return notifications; },
    snapshot: () => copy(api.getState()), apply: value => api.applyState(inWindow(value)), valid: value => api.validateState(inWindow(value)),
    personal() { assert.equal(JSON.stringify({ ...w.localStorage }), personalBefore); },
    close() { result.session.destroy(); result.app.destroy(); assert.deepEqual(errors, []); w.close(); }
  };
}
function input(f, selector, value) { const node = f.doc.querySelector(selector); assert(node, selector); node.value = value; node.dispatchEvent(new f.w.Event('input', { bubbles: true })); }
function click(f, selector) { const node = f.doc.querySelector(selector); assert(node, selector); node.click(); }
function submit(f, selector) { f.doc.querySelector(selector).dispatchEvent(new f.w.Event('submit', { bubbles: true, cancelable: true })); }
function visible(f) {
  return {
    title: f.doc.querySelector('h1')?.textContent,
    answer: f.doc.querySelector('#final-answer')?.value,
    feedback: f.doc.querySelector('[data-final-feedback]')?.textContent,
    steps: [...f.doc.querySelectorAll('[data-step]')].map(node => node.textContent),
    open: [...f.doc.querySelectorAll('details')].map(node => node.open),
    views: [...f.doc.querySelectorAll('svg[data-view]')].map(node => ({ ...node.dataset })),
    theory: f.doc.querySelector('dialog')?.textContent
  };
}
test('registered wrapper and current-card state cover all 989 reviewed cards within the bridge bound', () => {
  const f = boot();
  try {
    assert.equal(f.registration.id, 'merzlyak-10-base'); assert.equal(f.registration.parentOrigin, 'https://example.test');
    assert.equal(f.result.app.coverage.available, 989);
    for (const lesson of bundle.lessons) {
      assert(f.result.app.open(lesson.id));
      const state = f.snapshot();
      assert(f.valid(state), lesson.id); assert.equal(state.lessonId, lesson.id); assert.equal(state.work.draft, '');
      assert(Buffer.byteLength(JSON.stringify(state)) < 64 * 1024);
    }
    f.personal();
  } finally { f.close(); }
});
test('catalog search, filters and pagination restore without importing personal progress', async () => {
  const a = boot(), b = boot();
  try {
    input(a, '#catalog-search', '16.10'); await tick();
    const snapshot = a.snapshot(); assert.equal(snapshot.catalog.search, '16.10'); b.apply(snapshot); await tick();
    assert.deepEqual(b.snapshot(), snapshot);
    assert.deepEqual([...b.doc.querySelectorAll('[data-lesson]')].map(node => node.dataset.lesson), ['ex-16-010', 'merz-question-16-10']);
    a.result.app.open('ex-16-010'); assert.equal(a.snapshot().work.draft, '');
    a.result.app.home(); assert.equal(a.snapshot().catalog.search, '16.10');
    a.personal(); b.personal();
  } finally { a.close(); b.close(); }
});
test('draft, checked feedback, progressive explanations, camera and disclosures hydrate silently and continue', async () => {
  const a = boot(), b = boot();
  try {
    a.result.app.open('ex-16-010');
    input(a, '#final-answer', '7'); submit(a, '[data-final-form]');
    click(a, '[data-main-help] > summary'); await tick();
    click(a, '[data-steps] + button'); click(a, '[data-steps] + button');
    click(a, '[data-step] > details > summary'); await tick();
    a.models.at(-1).move(1.2, .3); await tick();
    const first = a.snapshot(), beforeNotifications = b.notifications;
    assert.equal(first.view.feedback.final, 'wrong'); assert.equal(first.work.revealed, 2);
    b.apply(first); await tick();
    assert.deepEqual(b.snapshot(), first); assert.deepEqual(visible(b), visible(a));
    assert.equal(b.notifications, beforeNotifications, 'remote native toggles do not notify or award help');
    assert.equal(b.api.isApplying(), false, 'native toggle suppression is drained');
    click(b, '[data-steps] + button'); await tick();
    assert.equal(b.snapshot().work.revealed, 3, 'next local step continues after hydration');
    input(b, '#final-answer', '18'); submit(b, '[data-final-form]'); await tick();
    assert.equal(b.snapshot().view.feedback.final, 'assisted'); assert.equal(b.snapshot().work.checked, true);
    a.apply(b.snapshot()); await tick(); assert.deepEqual(a.snapshot(), b.snapshot()); assert.deepEqual(visible(a), visible(b));
    a.personal(); b.personal();
  } finally { a.close(); b.close(); }
});
test('theory overlay camera, disclosures and return retain the original task state', async () => {
  const a = boot(), b = boot();
  try {
    a.result.app.open('merz-ex-10-001'); input(a, '#final-answer', 'Моё доказательство');
    click(a, '[data-main-help] > summary'); await tick();
    const theoryButton = [...a.doc.querySelectorAll('[data-main-help] button')].find(node => node.textContent.startsWith('Почему?'));
    assert(theoryButton); theoryButton.click(); await tick();
    assert(a.doc.querySelector('dialog')); click(a, 'dialog > div:last-child > details > summary'); await tick();
    a.models.at(-1).move(1.1, .2);
    const snapshot = a.snapshot(); assert(snapshot.view.theory.active); assert(a.valid(snapshot));
    b.apply(snapshot); await tick(); assert.deepEqual(b.snapshot(), snapshot); assert.deepEqual(visible(b), visible(a));
    click(b, 'dialog > button'); await tick(); assert.equal(b.snapshot().view.theory.active, null);
    assert.equal(b.doc.querySelector('#final-answer').value, 'Моё доказательство');
    a.personal(); b.personal();
  } finally { a.close(); b.close(); }
});
test('a controller edit or navigation immediately after hydration is published after remote toggles settle', async () => {
  const a=boot(),b=boot();
  try{
    a.result.app.open('ex-16-010');click(a,'[data-main-help] > summary');await tick();click(a,'[data-steps] + button');await tick();
    const state=a.snapshot();
    b.apply(state);await tick();assert.equal(b.notifications,0,'remote-only restore has no echo');
    b.apply(state);input(b,'#final-answer','immediate local input');await tick();
    assert.equal(b.snapshot().work.draft,'immediate local input');assert.equal(b.notifications,1,'new input survives the hydration window');assert.equal(b.api.isApplying(),false);
    const before=b.notifications;b.apply(state);click(b,'header > button');await tick();
    assert.equal(b.snapshot().lessonId,null);assert.equal(b.api.isApplying(),false,'detached old disclosures cannot keep the adapter busy');assert.equal(b.notifications,before+1,'immediate return to catalog is published');
    a.personal();b.personal();
  }finally{a.close();b.close();}
});
test('synthetic authored step input feedback restores without re-submitting', async () => {
  const lesson = copy(bundle.lessons.find(item => item.id === 'ex-16-010'));
  lesson.testOnly = true; lesson.steps[0].input = { prompt: 'TEST ONLY шаг', accepted: ['3/2'], feedback: 'TEST ONLY проверь 3/2' };
  const source = { catalog: { ...copy(bundle.catalog), entries: [copy(bundle.catalog.entries.find(item => item.id === lesson.id))] }, lessons: [lesson], allowTestFixtures: true };
  const a = boot(source), b = boot(source);
  try {
    a.result.app.open(lesson.id); click(a, '[data-main-help] > summary'); await tick(); click(a, '[data-steps] + button');
    input(a, '[data-step] input', 'bad'); submit(a, '[data-step] form'); await tick();
    const state = a.snapshot(); assert.equal(state.view.feedback.steps[lesson.steps[0].id], 'wrong');
    b.apply(state); await tick(); assert.deepEqual(b.snapshot(), state); assert.deepEqual(visible(b), visible(a));
    input(b, '[data-step] input', '3/2'); submit(b, '[data-step] form'); await tick();
    assert.equal(b.snapshot().view.feedback.steps[lesson.steps[0].id], 'correct');
    a.personal(); b.personal();
  } finally { a.close(); b.close(); }
});
test('malformed snapshots are rejected before route, DOM, storage or work mutation', async () => {
  const f = boot();
  try {
    f.result.app.open('ex-16-010'); input(f, '#final-answer', 'untouched'); await tick();
    const before = f.snapshot(), beforeView = visible(f), route = f.w.location.href;
    const mutations = [
      s => { s.bookId = 'another'; }, s => { s.lessonId = 'unreviewed'; }, s => { s.extra = true; },
      s => { s.work.draft = 'x'.repeat(2001); }, s => { s.work.draft = '<img src=x>'; },
      s => { s.work.revealed = 100; }, s => { s.work.stepDrafts.unknown = 'x'; },
      s => { s.view.model.view = 'unknown'; }, s => { s.view.model.camera.pitch = 99; },
      s => { s.view.opened = [999]; }, s => { s.view.opened = [0, 0]; },
      s => { s.view.theory.active = { id: 'ex-16-010' }; }, s => { s.catalog.readyPage = 999; },
      s => { s.work.camera.yaw = s.view.model.camera.yaw = 2*Math.PI; },
      s => { s.catalog.search = '16.10'; s.catalog.readyPage = 1; }
    ];
    for (const mutate of mutations) {
      const invalid = copy(before); mutate(invalid); assert.equal(f.valid(invalid), false);
      assert.throws(() => f.apply(invalid), /Invalid Merzlyak board state/);
      assert.deepEqual(f.snapshot(), before); assert.deepEqual(visible(f), beforeView); assert.equal(f.w.location.href, route);
    }
    const getter = f.inWindow(before); Object.defineProperty(getter, 'work', { enumerable: true, get() { throw Error('must not evaluate'); } });
    assert.equal(f.api.validateState(getter), false); assert.deepEqual(f.snapshot(), before);
    f.personal();
  } finally { f.close(); }
});
test('mathematical comparisons and HTML-looking drafts retain exact text through the safe wire format', async () => {
  const a=boot(),b=boot();
  try{
    a.result.app.open('merz-ex-10-001');
    for(const text of ['a < b, c > d; x <= 2, y >= 3','a<b,c>d','<img src=x>','~mathexam-text~"literal"','Проверка \\u003c и <b>','<b>'+'x'.repeat(1993)+'</b>']){
      input(a,'#final-answer',text);await tick();
      assert.equal(a.doc.querySelector('#final-answer').value,text,'controller text unchanged');
      const state=a.snapshot();assert(a.valid(state));assert.doesNotMatch(JSON.stringify(state),/<\/?[a-z][^>]*>/i);
      b.apply(state);await tick();assert.equal(b.doc.querySelector('#final-answer').value,text,'observer receives exact text');assert.deepEqual(b.snapshot(),state);
    }
    a.result.app.home();const search='<b>'+'x'.repeat(193)+'</b>';input(a,'#catalog-search',search);await tick();
    assert.equal(search.length,200);assert(a.valid(a.snapshot()));b.apply(a.snapshot());await tick();assert.equal(b.doc.querySelector('#catalog-search').value,search);assert.deepEqual(b.snapshot(),a.snapshot());
    a.personal();b.personal();
  }finally{a.close();b.close();}
});
test('ordinary canonical page cannot activate the registered wrapper by query alone', () => {
  assert.throws(() => boot(bundle, 'https://example.test/stereo-course/merzlyak-10-base/?board=true'), /Board wrapper required/);
});
