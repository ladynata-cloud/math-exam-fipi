'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const ROOT = path.resolve(__dirname, '..');
const course = require('../stereo-course/sections/data/course.json');
const copy = value => JSON.parse(JSON.stringify(value));
const tick = () => new Promise(resolve => setTimeout(resolve, 35));
const scripts = ['board-session.js', 'app.js'].map(file => fs.readFileSync(path.join(ROOT, 'stereo-course/sections/assets', file), 'utf8'));

function boot({ hash = '', url = 'https://example.test/trainers/sections-from-zero.html', wrapper = true } = {}) {
  const dom = new JSDOM('<!doctype html><body' + (wrapper ? ' data-sections-board="true"' : '') + '><div id="sections-app"></div></body>', {
    url: url + hash, runScripts: 'outside-only', pretendToBeVisual: true
  });
  const w = dom.window, errors = [];
  let registration, notifications = 0;
  w.TextEncoder = TextEncoder; w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  // Font measurement is the only unavailable DOM primitive; rendering and
  // geometry are real. Actual pixel layout is checked in the browser gate.
  w.SVGElement.prototype.getBBox = function () { return { x: 0, y: -16, width: Math.max(12, this.textContent.length * 12), height: 20 }; };
  w.addEventListener('error', event => errors.push(event.error));
  w.COURSE = w.JSON.parse(JSON.stringify(course));
  const personal = {
    [course.storageKey]: JSON.stringify({ current: 'starter-03', tasks: { 'starter-03': { draft: 'Личная работа, не данные комнаты', revealed: 0 } } }),
    'mathexam.sections.master.activities.v1': JSON.stringify({ view: 'labs', path: { stageId: 'begin-02', readiness: {} } }),
    'unrelated': 'preserve byte for byte'
  };
  for (const [key, value] of Object.entries(personal)) w.localStorage.setItem(key, value);
  w.sessionStorage.setItem('mathexam.profileReturn', 'synthetic-return');
  w.MathExamBoard = { register(config) {
    registration = config;
    const unsubscribe = config.subscribe(() => notifications++);
    return { destroy: unsubscribe };
  } };
  try { for (const source of scripts) w.eval(source); }
  catch (error) { w.close(); throw error; }
  const inWindow = value => w.JSON.parse(JSON.stringify(value));
  return {
    w, doc: w.document, api: w.__sectionsBoard,
    get registration() { return registration; }, get notifications() { return notifications; },
    snapshot: () => copy(w.__sectionsBoard.getState()),
    valid: state => w.__sectionsBoard.validateState(inWindow(state)),
    apply: state => w.__sectionsBoard.applyState(inWindow(state)),
    open: id => w.SECTIONS_APP.selectLesson(id), inWindow,
    personal() {
      assert.deepEqual(Object.fromEntries(Object.keys(w.localStorage).map(key => [key, w.localStorage.getItem(key)])), personal);
      assert.equal(w.sessionStorage.getItem('mathexam.profileReturn'), 'synthetic-return');
    },
    async close() { await tick(); w.SECTIONS_BOARD_SESSION?.destroy(); assert.deepEqual(errors, [], 'no uncaught engine errors'); w.close(); }
  };
}

function click(f, selector) { const node = f.doc.querySelector(selector); assert(node, selector); node.click(); }
function input(f, selector, value) {
  const node = f.doc.querySelector(selector); assert(node, selector); node.value = value;
  node.dispatchEvent(new f.w.Event('input', { bubbles: true }));
}
function construct(f, count) {
  for (let i = 0; i < count; i++) {
    if (f.doc.querySelector('[data-action="next-step"]')) click(f, '[data-action="next-step"]');
    click(f, '[data-action="construct"]');
  }
}
function visible(f) {
  const attribute = (node, key) => {
    const value = node.getAttribute(key);
    return value !== null && ['x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy'].includes(key)
      ? Number(Number(value).toFixed(7)) : value;
  };
  return {
    title: f.doc.querySelector('#lesson-title')?.textContent,
    condition: f.doc.querySelector('.lesson-condition')?.textContent,
    panel: f.doc.querySelector('.step-panel')?.textContent,
    steps: [...f.doc.querySelectorAll('[data-history-step]')].map(node => node.textContent),
    draft: f.doc.querySelector('#proof-draft')?.value,
    answer: f.doc.querySelector('#numeric-answer')?.value,
    feedback: f.doc.querySelector('.answer-form .feedback')?.textContent,
    details: [...f.doc.querySelectorAll('details')].map(node => [node.querySelector('summary')?.textContent, node.open]),
    geometry: [...f.doc.querySelectorAll('.model-svg path,.model-svg text,.model-svg line,.model-svg circle')].map(node => [node.tagName, node.textContent, ...['d', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'data-label', 'class'].map(key => attribute(node, key))])
  };
}
async function restore(a, b, label) {
  await tick();
  const state = a.snapshot(); assert(a.valid(state), label + ': real state satisfies contract');
  const notifications = b.notifications;
  b.apply(state); await tick();
  assert.deepEqual(b.snapshot(), state, label + ': state roundtrip');
  assert.deepEqual(visible(b), visible(a), label + ': visible roundtrip');
  assert.equal(b.notifications, notifications, label + ': no hydration echo');
  assert.equal(b.api.isApplying(), false);
  a.personal(); b.personal();
  return state;
}

test('registered wrapper isolates local progress and all 186 authored cards fit the bridge', async () => {
  const f = boot();
  try {
    assert.equal(f.registration.id, 'sections-from-zero');
    assert.equal(f.registration.parentOrigin, 'https://example.test');
    assert.equal(f.registration.stateSchemaVersion, 1);
    assert.equal(f.snapshot().lessonId, 'starter-01', 'personal current card is not imported');
    assert.equal(typeof f.w.SECTIONS_MASTER, 'undefined', 'room exposes current lessons, not personal activities');
    for (const lesson of course.lessons) {
      f.open(lesson.id);
      const state = f.snapshot();
      assert(f.valid(state), lesson.id); assert.equal(state.lessonId, lesson.id);
      assert.equal(state.work.draft, ''); assert.equal(state.work.revealed, 0);
      assert(Buffer.byteLength(JSON.stringify(state)) < 64 * 1024, lesson.id);
    }
    f.personal();
  } finally { await f.close(); }
});

test('wrong plane feedback, two-error hint and retained steps hydrate without awarding more help', async () => {
  const a = boot({ hash: '#starter-18' }), b = boot();
  try {
    click(a, '[data-action="start-practice"]');
    click(a, '[data-plane-choice="CGHD"]'); click(a, '[data-plane-choice="BFGC"]');
    const wrong = await restore(a, b, 'two wrong planes');
    assert.equal(wrong.work.revealed, 0); assert.equal(b.doc.querySelector('[data-action="construct"]'), null);
    assert.deepEqual(wrong.work.planeAttempts['0'].wrong, ['CGHD', 'BFGC']);
    click(a, '.step-hint > summary');
    const hinted = await restore(a, b, 'hint');
    assert.equal(hinted.work.hintOpen['0'], true); assert.equal(hinted.work.helpUsed, true);
    click(a, '[data-plane-choice="AEFB"]'); construct(a, 1);
    click(a, '[data-action="next-step"]'); click(a, '[data-plane-choice="BFGC"]'); construct(a, 1);
    const built = await restore(a, b, 'two retained steps');
    assert.equal(built.work.revealed, 2); assert.equal(built.work.independentSteps, 0);
    assert.equal(b.doc.querySelectorAll('[data-history-step]').length, 2);
    click(b, '[data-action="next-step"]'); click(b, '[data-plane-choice="CGHD"]'); construct(b, 1);
    await restore(b, a, 'new controller continues the next step');
    assert.equal(a.snapshot().work.revealed, 3);
  } finally { await a.close(); await b.close(); }
});

test('an authored reason question requires plane, reasoning and explicit construction in order', async () => {
  const a = boot({ hash: '#auth-method-04' }), b = boot();
  try {
    click(a, '[data-action="start-practice"]');
    click(a, '[data-plane-choice="ACC1A1"]');
    assert.equal(a.doc.querySelector('[data-action="construct"]'), null);
    click(a, '[data-reason-choice="0"]');
    const wrong = await restore(a, b, 'wrong reason');
    assert.equal(wrong.work.revealed, 0); assert.equal(wrong.work.questionApproved, -1);
    click(a, '[data-reason-choice="2"]');
    const approved = await restore(a, b, 'valid reason before action');
    assert.equal(approved.work.revealed, 0); assert.equal(approved.work.questionApproved, 0);
    construct(b, 1); await restore(b, a, 'build after the approved explanation');
    assert.equal(a.snapshot().work.revealed, 1);
  } finally { await a.close(); await b.close(); }
});

test('drafts, comparison signs, HTML-looking text, catalog filters and camera restore losslessly', async () => {
  const a = boot({ hash: '#auth-method-04' }), b = boot();
  try {
    for (const text of ['a < b, c > d; x <= 2', 'a<b,c>d', '<img src=x>', '~mathexam-text~"literal"', 'Проверка \\u003c и <b>', '<b>' + 'x'.repeat(1993) + '</b>']) {
      input(a, '#proof-draft', text);
      await restore(a, b, 'exact draft');
      assert.equal(b.doc.querySelector('#proof-draft').value, text);
      assert.doesNotMatch(JSON.stringify(a.snapshot()), /<\/?[a-z][^>]*>/i);
      assert.equal(b.doc.querySelector('img[src=x]'), null);
    }
    input(a, '#catalog-query', '<b>Сечение и плоскость</b>');
    const module = a.doc.querySelector('select[aria-label="Раздел курса"]'); module.value = 'metric'; module.dispatchEvent(new a.w.Event('change', { bubbles: true }));
    const level = a.doc.querySelector('[data-catalog-filter="level"]'); level.value = 'C'; level.dispatchEvent(new a.w.Event('change', { bubbles: true }));
    a.doc.querySelector('.model-svg').dispatchEvent(new a.w.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    const state = await restore(a, b, 'catalog and keyboard camera');
    assert.equal(b.doc.querySelector('#catalog-query').value, '<b>Сечение и плоскость</b>');
    assert.equal(state.catalog.module, 'metric'); assert.equal(state.catalog.level, 'C');
    assert(Math.abs(state.work.camera.yaw - (-.65 + .16)) < 1e-9);
  } finally { await a.close(); await b.close(); }
});

test('invalid numeric syntax and wrong/correct answers restore without re-submission', async () => {
  const a = boot({ hash: '#auth-method-04' }), b = boot();
  try {
    click(a, '[data-action="start-study"]'); construct(a, course.lessons.find(l => l.id === 'auth-method-04').steps.length);
    for (const [answer, flag] of [['1/0', 'answerInvalid'], ['7/11', 'answerChecked'], ['2/2', 'correctAnswer']]) {
      input(a, '#numeric-answer', answer);
      a.doc.querySelector('.answer-form').dispatchEvent(new a.w.Event('submit', { bubbles: true, cancelable: true }));
      const state = await restore(a, b, 'answer ' + answer);
      assert.equal(state.work[flag], true);
    }
    assert.equal(b.snapshot().work.workedSeen, true);
    assert.match(b.doc.querySelector('.answer-form .feedback').textContent, /Численный результат совпал/);
  } finally { await a.close(); await b.close(); }
});

test('shared numeric feedback uses the real form parser and rejects forged correctness for all 41 answers', async () => {
  const f = boot();
  try {
    const lessons = course.lessons.filter(lesson => lesson.result?.numeric);
    assert.equal(lessons.length, 41);
    for (const lesson of lessons) {
      f.open(lesson.id); click(f, '[data-action="start-study"]'); construct(f, lesson.steps.length);
      const { value, tolerance = 1e-6 } = lesson.result.numeric;
      const correctForms = [String(value), String(value).replace('.', ','), ' +' + String(value) + ' / 1 ', String(value + tolerance / 2)];
      for (const [answer, correct] of [...correctForms.map(answer => [answer, true]), [String(value + tolerance * 2), false]]) {
        input(f, '#numeric-answer', answer);
        const pending = f.snapshot();
        assert(f.valid(pending), lesson.id + ': pending ' + answer);
        assert.equal(pending.work.answerChecked, false);
        f.doc.querySelector('.answer-form').dispatchEvent(new f.w.Event('submit', { bubbles: true, cancelable: true }));
        const checked = f.snapshot();
        assert.equal(checked.work.answerChecked, true, lesson.id + ': form checks ' + answer);
        assert.equal(checked.work.correctAnswer, correct, lesson.id + ': form judges ' + answer);
        assert(f.valid(checked), lesson.id + ': valid actual feedback');
        const forged = copy(checked); forged.work.correctAnswer = !correct;
        assert.equal(f.valid(forged), false, lesson.id + ': reject forged correctness');
        assert.throws(() => f.apply(forged), /Invalid sections board state/);
        assert.deepEqual(f.snapshot(), checked, lesson.id + ': rejection preserves current work');
      }
      // Restart intentionally retains the last answer while hiding its form.
      // Validation must not discard this valid, pre-existing learning behavior.
      click(f, '[data-action="restart"]');
      assert.equal(f.snapshot().work.revealed, 0);
      assert(f.valid(f.snapshot()), lesson.id + ': retained answer after restart');
    }
    f.personal();
  } finally { await f.close(); }
});

test('shared answer status rejects invalid syntax and feedback on a nonnumeric card without changing the visible work', async () => {
  const f = boot({ hash: '#auth-method-04' });
  try {
    click(f, '[data-action="start-study"]'); construct(f, course.lessons.find(l => l.id === 'auth-method-04').steps.length);
    for (const answer of ['', '1/0', '1e2', '0x10', 'sqrt(1)', '<b>1</b>', '1..0']) {
      input(f, '#numeric-answer', answer);
      assert(f.valid(f.snapshot()), 'unsubmitted syntax remains editable: ' + answer);
      f.doc.querySelector('.answer-form').dispatchEvent(new f.w.Event('submit', { bubbles: true, cancelable: true }));
      const invalid = f.snapshot();
      assert.equal(invalid.work.answerInvalid, true); assert(f.valid(invalid), 'valid syntax feedback: ' + answer);
      const forged = copy(invalid); forged.work.answerInvalid = false; forged.work.answerChecked = true;
      assert.equal(f.valid(forged), false, 'invalid syntax cannot claim a checked result: ' + answer);
      assert.throws(() => f.apply(forged), /Invalid sections board state/);
      assert.deepEqual(f.snapshot(), invalid);
    }
    for (const answer of ['1', '1,0', '2/2', '−1', '.5']) {
      input(f, '#numeric-answer', answer);
      const pending = f.snapshot(), forged = copy(pending); forged.work.answerInvalid = true;
      assert.equal(f.valid(forged), false, 'finite parsed answer cannot claim invalid syntax: ' + answer);
      assert.throws(() => f.apply(forged), /Invalid sections board state/);
      assert.deepEqual(f.snapshot(), pending);
    }
    f.open('starter-01');
    const original = f.snapshot(), originalView = visible(f);
    for (const patch of [{ answer: '1' }, { answerChecked: true }, { answerChecked: true, correctAnswer: true }, { answerInvalid: true }]) {
      const forged = copy(original); Object.assign(forged.work, patch);
      assert.equal(f.valid(forged), false, 'nonnumeric card rejects answer state: ' + JSON.stringify(patch));
      assert.throws(() => f.apply(forged), /Invalid sections board state/);
      assert.deepEqual(f.snapshot(), original); assert.deepEqual(visible(f), originalView);
    }
    f.personal();
  } finally { await f.close(); }
});

test('controller input immediately after remote apply is published when native toggles settle', async () => {
  const a = boot({ hash: '#starter-18' }), b = boot();
  try {
    click(a, '[data-action="start-practice"]'); click(a, '.step-hint > summary');
    click(a, '.starter-draft > summary'); await tick();
    const state = a.snapshot(), initialNotifications = b.notifications;
    b.apply(state); await tick();
    assert.equal(b.notifications, initialNotifications);
    input(a, '#proof-draft', 'Remote input'); await tick();
    b.apply(a.snapshot());
    input(b, '#proof-draft', 'Immediate controller input');
    await tick();
    assert.equal(b.doc.querySelector('#proof-draft').value, 'Immediate controller input');
    assert.equal(b.snapshot().work.draft, 'Immediate controller input');
    assert.equal(b.notifications, initialNotifications + 1, 'real input survives the hydration settlement window');
    assert.equal(b.api.isApplying(), false);
    a.personal(); b.personal();
  } finally { await a.close(); await b.close(); }
});

test('malformed state is rejected atomically before DOM, route, draft or storage changes', async () => {
  const f = boot({ hash: '#starter-18' });
  try {
    click(f, '[data-action="start-practice"]'); input(f, '#proof-draft', 'must remain'); await tick();
    const original = f.snapshot(), originalView = visible(f), route = f.w.location.href;
    const mutations = [
      s => { s.version = 2; }, s => { s.courseId = 'other'; }, s => { s.lessonId = 'unknown'; }, s => { s.route = 'labs'; },
      s => { s.extra = true; }, s => { s.work.extra = true; }, s => { s.work.revealed = 1000; }, s => { s.work.viewCount = 1; },
      s => { s.work.draft = 'x'.repeat(2001); }, s => { s.work.draft = '<img src=x>'; }, s => { s.work.answer = 'x'.repeat(121); },
      s => { s.work.camera.yaw = 2 * Math.PI; }, s => { s.work.camera.pitch = 99; }, s => { s.work.camera = {}; },
      s => { s.work.approved = 0; }, s => { s.work.questionApproved = 0; }, s => { s.work.independentSteps = 1; },
      s => { s.work.hints = [0, 0]; }, s => { s.work.hintOpen = { 999: true }; }, s => { s.work.proofChecks = [true]; },
      s => { s.work.correctAnswer = true; }, s => { s.work.showResult = true; }, s => { s.work.checkCorrect = true; },
      s => { s.work.selectedCheck = 999; }, s => { s.catalog.query = 'x'.repeat(201); }, s => { s.catalog.module = 'unknown'; },
      s => { s.catalog.level = 'D'; }, s => { s.catalog.origin = 'private'; }, s => { s.catalog.open = 1; },
      s => { s.ui.modeOptionsOpen = true; },
      s => { s.work.planeAttempts = { 0: { wrong: [], selected: 'AEFB', correct: false } }; },
      s => { s.work.planeAttempts = { 0: { wrong: [], selected: 'MNP', correct: true } }; },
      s => { s.work.questionAttempts = { 0: { wrong: [], selected: 0, correct: true } }; },
      s => { s.work.draft = '~mathexam-text~not-json'; },
      s => { s.work.draft = '~mathexam-text~"unnecessarily encoded text"'; }
    ];
    for (const mutate of mutations) {
      const bad = copy(original); mutate(bad);
      assert.equal(f.valid(bad), false, mutate.toString());
      assert.throws(() => f.apply(bad), /Invalid sections board state/);
      assert.deepEqual(f.snapshot(), original); assert.deepEqual(visible(f), originalView); assert.equal(f.w.location.href, route);
    }
    const getter = f.inWindow(original); let accessed = false;
    Object.defineProperty(getter, 'work', { enumerable: true, get() { accessed = true; throw Error('not data'); } });
    assert.equal(f.api.validateState(getter), false); assert.equal(accessed, false, 'validation never invokes an accessor');
    const sparse = f.inWindow(original); sparse.work.hints = new f.w.Array(1);
    assert.equal(f.api.validateState(sparse), false);
    const cycle = f.inWindow(original); cycle.work.hintOpen.loop = cycle;
    assert.equal(f.api.validateState(cycle), false);
    const inherited = f.inWindow(original); Object.setPrototypeOf(inherited.work, { inherited: true });
    assert.equal(f.api.validateState(inherited), false);
    assert.deepEqual(f.snapshot(), original); f.personal();
  } finally { await f.close(); }
});

test('canonical course and query flag cannot impersonate the registered wrapper', async () => {
  assert.throws(() => boot({ url: 'https://example.test/stereo-course/sections/?board=true' }), /Sections board wrapper required/);
  const f = boot({ url: 'https://example.test/stereo-course/sections/?board=true', wrapper: false });
  try {
    assert.equal(f.api, undefined); assert.equal(f.registration, undefined);
    assert.equal(typeof f.w.SECTIONS_MASTER?.getState, 'function');
    assert.equal(f.w.SECTIONS_APP.getState().current, 'starter-03', 'personal course retains its ordinary storage');
  } finally { await f.close(); }
});
