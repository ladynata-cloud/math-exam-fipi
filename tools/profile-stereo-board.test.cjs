'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const { JSDOM } = require('jsdom');
const boards = require('../ege-profil/start/board-session.js');
const { LESSON_IDS, validRoute } = boards.stereometry;
const ROOT = resolve(__dirname, '..');
const copy = value => JSON.parse(JSON.stringify(value));

function fixture(kind = 'stereometry', options = {}) {
  const adapter = kind === 'stereometry' ? boards.stereometry : boards;
  const html = readFileSync(resolve(ROOT, '.' + adapter.path), 'utf8');
  const dom = new JSDOM(html, { url: 'https://local.example' + (options.path || adapter.path) + adapter.defaultRoute, runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window, accesses = { local: 0, session: 0 };
  if (options.marker !== undefined) w.document.body.dataset.profileBoard = options.marker;
  w.TextEncoder = TextEncoder;
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  // Count even reads caught inside the application. The four personal stores
  // must remain outside the board session from its very first initialization.
  Object.defineProperty(w, 'localStorage', { get() { accesses.local++; throw new Error('Personal storage must not be read'); } });
  Object.defineProperty(w, 'sessionStorage', { get() { accesses.session++; throw new Error('Personal return must not be read'); } });
  let registration;
  w.MathExamBoard = { register(config) { registration = config; return { destroy() {} }; } };
  for (const script of w.document.querySelectorAll('script[src]')) {
    const path = new URL(script.src).pathname;
    if (path !== '/trainers/board-bridge.js') w.eval(readFileSync(resolve(ROOT, '.' + path), 'utf8'));
  }
  const api = w[adapter.debugKey];
  if (options.inactive) return { dom, w, registration };
  assert(api, 'registered wrapper activates its matching adapter');
  assert.equal(registration.id, adapter.id);
  assert.equal(registration.parentOrigin, 'https://local.example');
  const intoWindow = value => w.JSON.parse(JSON.stringify(value));
  const state = () => copy(api.getState());
  const apply = value => api.applyState(intoWindow(value));
  const valid = value => api.validateState(intoWindow(value));
  const query = selector => w.document.querySelector(selector);
  async function navigate(hash) {
    w.location.hash = hash;
    await new Promise(resolveWait => w.setTimeout(resolveWait, 5));
  }
  function roundtrip(label) {
    const before = state(), text = query('#main').textContent;
    const picture = query('[data-stereo-view]')?.innerHTML;
    assert.equal(valid(before), true, label + ': exported state is valid');
    apply(before);
    assert.deepEqual(state(), before, label + ': state roundtrip');
    assert.equal(query('#main').textContent, text, label + ': visible text and live status');
    assert.equal(query('[data-stereo-view]')?.innerHTML, picture, label + ': geometry is rendered from the restored camera');
    assert.deepEqual(accesses, { local: 0, session: 0 }, label + ': no personal storage access');
  }
  function submit(value) {
    query('#answer').value = String(value);
    query('#answer').dispatchEvent(new w.Event('input', { bubbles: true }));
    query('#answer-form').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
  }
  function currentTask(lessonId, mode) {
    const id = state().progress.sessions[lessonId + ':' + mode].taskId;
    return w.ProfileLessons.find(lesson => lesson.id === lessonId).tasks.find(task => task.id === id);
  }
  return { dom, w, api, accesses, registration, state, apply, valid, query, navigate, roundtrip, submit, currentTask };
}

test('stereometry has eight exact route families and keeps the published expressions boundary', () => {
  assert.equal(LESSON_IDS.length, 8);
  assert.equal(boards.stereometry.id, 'ege-profile-stereometry');
  assert.equal(boards.stereometry.defaultRoute, '#exam/3');
  assert.equal(validRoute('#exam/3'), true);
  assert.equal(validRoute('#calm/3'), true);
  for (const id of LESSON_IDS) {
    for (const page of ['lesson', 'example']) assert.equal(validRoute('#' + page + '/' + id), true);
    for (const page of ['practice', 'repair', 'pause']) for (const mode of ['guided', 'plan', 'independent'])
      assert.equal(validRoute('#' + page + '/' + id + '/' + mode), true);
    assert.equal(boards.validRoute('#lesson/' + id), false, '№8 cannot accept №3 topics');
  }
  for (const route of ['', '#calm', '#exam/8', '#exam/03', '#exam/3/extra', '#lesson/stereo-box/independent',
    '#practice/stereo-box', '#practice/stereo-box/independent/extra', '#practice/%73tereo-box/independent',
    '#lesson/expr-powers', '#lesson/stereo-tetrahedron', '#checkpoint', '#progress', '#repair-task/stereo-box'])
    assert.equal(validRoute(route), false, route);
  assert.equal(boards.validRoute('#exam/8'), true);
});

test('wrapper path and body marker must agree before either adapter registers', () => {
  for (const [kind, options] of [
    ['stereometry', { path: boards.path }],
    ['stereometry', { marker: 'expressions' }],
    ['expressions', { path: boards.stereometry.path }],
    ['expressions', { marker: 'stereometry' }],
    ['stereometry', { path: '/ege-profil/start/index.html' }],
    ['stereometry', { marker: '' }]
  ]) {
    const f = fixture(kind, { ...options, inactive: true });
    try {
      assert.equal(f.registration, undefined, kind + ' ' + JSON.stringify(options));
      assert.equal(f.w.__profileStereoBoard, undefined);
      assert.equal(f.w.__profileExpressionsBoard, undefined);
    } finally { f.dom.window.close(); }
  }
});

test('all eight lessons, examples and 24 sessions restore, including pause and repair', async () => {
  const f = fixture();
  try {
    assert.equal(f.w.document.querySelectorAll('.exam-topic').length, 8);
    f.roundtrip('overview');
    for (const id of LESSON_IDS) {
      for (const page of ['lesson', 'example']) {
        await f.navigate('#' + page + '/' + id);
        f.roundtrip(page + '/' + id);
      }
      for (const mode of ['guided', 'plan', 'independent']) {
        await f.navigate('#practice/' + id + '/' + mode);
        assert.equal(f.query('#micro-start'), null, 'stereometry has no authored micro-step panel');
        f.roundtrip(id + '/' + mode);
        await f.navigate('#pause/' + id + '/' + mode);
        f.roundtrip('pause/' + id + '/' + mode);
        await f.navigate('#repair/' + id + '/' + mode);
        f.roundtrip('repair/' + id + '/' + mode);
      }
    }
    assert.equal(Object.keys(f.state().progress.sessions).length, 24, 'all three modes fit for all eight topics');
    assert.deepEqual(Object.keys(f.state().progress.records).sort(), LESSON_IDS.slice().sort());
    await f.navigate('#calm/3');
    for (const detail of f.w.document.querySelectorAll('#main > details')) detail.open = true;
    f.roundtrip('calm overview');
    const before = f.state(), html = f.query('#main').innerHTML, invalid = copy(before);
    invalid.view.details.trigBasics = true;
    assert.equal(f.valid(invalid), false, 'the №8 trigonometry disclosure does not exist in №3');
    assert.throws(() => f.apply(invalid), /Invalid stereometry board state/);
    assert.deepEqual(f.state(), before);
    assert.equal(f.query('#main').innerHTML, html);
    for (const link of f.w.document.querySelectorAll('#main a[target="_blank"]'))
      assert.equal(link.rel, 'noopener', 'outside resources remain separate from the shared route');
    await f.navigate('#exam/8');
    assert.equal(f.w.location.hash, '#exam/3', 'direct out-of-scope navigation returns to the registered number');
    f.roundtrip('normalized overview');
  } finally { f.dom.window.close(); }
});

test('free camera controls, disclosures and their next local interaction survive application hydration', async () => {
  const f = fixture();
  try {
    await f.navigate('#practice/stereo-compound/independent');
    const sessionKey = 'stereo-compound:independent';
    const initial = f.state().view.model;
    f.query('#task-model button[aria-label="Повернуть вправо"]').click();
    const extra = f.query('#task-model .stereo-extra-controls').parentElement;
    extra.open = true;
    f.query('#task-model .stereo-extra-controls button').click();
    const camera = f.state().view.model;
    assert.equal(camera.extraOpen, true);
    assert.equal(camera.announcement, 'top');
    assert.equal(camera.pitch, 1.04);
    assert(Math.abs(camera.yaw - initial.yaw - Math.PI / 9) < 1e-12);
    assert.equal(f.state().progress.sessions[sessionKey].assisted, false, 'view exploration is not mathematical assistance');
    f.roundtrip('independent additional view');
    f.query('[data-stereo-view]').dispatchEvent(new f.w.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }));
    const next = f.state().view.model;
    assert(Math.abs(next.yaw - camera.yaw + Math.PI / 18) < 1e-12, 'keyboard continues from restored camera closure');
    assert.equal(next.announcement, 'rotate');
    assert.equal(next.announcedYaw, next.yaw);
    assert.equal(f.state().progress.sessions[sessionKey].assisted, false);
    f.roundtrip('keyboard after hydration');
    const task = f.currentTask('stereo-compound', 'independent');
    f.submit(task.answer);
    f.roundtrip('accepted independent answer');
    f.query('#next').click();
    assert.deepEqual(f.state().progress.records['stereo-compound'].independent, [task.id], 'free rotation preserves existing in-room success rules');
    f.roundtrip('completed independent task');
    await f.navigate('#lesson/stereo-cone');
    f.query('#explore-lab').open = true;
    f.query('#lab .stereo-extra-controls').parentElement.open = true;
    f.query('#lab button[aria-label="Повернуть влево"]').click();
    f.roundtrip('lesson lab and nested disclosure');
  } finally { f.dom.window.close(); }
});

test('draft, feedback, assistance and accepted guided history retain task and camera', async () => {
  const f = fixture();
  try {
    f.query('#calm-toggle').click();
    await f.navigate('#practice/stereo-box/independent');
    for (const [value, feedback] of [['', 'empty'], ['1/', 'format'], ['-9999', 'wrong']]) {
      f.submit(value);
      assert.equal(f.state().view.feedback, feedback);
      f.roundtrip(feedback);
    }
    const task = f.currentTask('stereo-box', 'independent');
    f.query('#answer').value = '1/7';
    f.query('#answer').dispatchEvent(new f.w.Event('input', { bubbles: true }));
    f.query('#hint').click();
    f.query('[data-solution-open]').click();
    f.query('[data-solution-next]').click();
    f.query('[data-solution-open]').click();
    f.query('.task-foundation').open = true;
    f.query('.task-foundation details').open = true;
    f.roundtrip('help with hidden two-step solution and unfinished draft');
    assert.deepEqual(f.state().view.solution, { open: false, count: 2 });
    assert.equal(f.state().progress.sessions['stereo-box:independent'].draft, '1/7');
    assert.equal(f.state().progress.sessions['stereo-box:independent'].assisted, true);
    f.query('#repair-current').click();
    await new Promise(resolveWait => f.w.setTimeout(resolveWait, 5));
    assert.equal(f.currentTask('stereo-box', 'guided').id, task.id, 'remediation preserves the independent task');
    assert.equal(f.state().returnToTask, '#practice/stereo-box/independent');
    for (const step of task.steps) {
      f.query('#task-model button[aria-label="Повернуть вправо"]').click();
      const yaw = f.state().view.model.yaw;
      f.submit(step.answer);
      assert.equal(f.state().view.model.yaw, yaw, 'accepted-answer model remount keeps the current orientation');
      f.query('.earned-explanation').open = true;
      f.roundtrip('accepted guided step and opened explanation');
      f.query('#next').click();
    }
    assert.equal(f.state().progress.sessions['stereo-box:guided'].registered, true);
    f.roundtrip('completed remediation');
  } finally { f.dom.window.close(); }
});

test('worked solution limits use authored expanded steps, and completed example UI is restored', async () => {
  const f = fixture();
  try {
    await f.navigate('#practice/stereo-cube/plan');
    f.submit(f.currentTask('stereo-cube', 'plan').answer);
    f.query('#next').click();
    f.query('#another').click();
    const task = f.currentTask('stereo-cube', 'plan');
    assert.equal(task.id, 'stereo-cube-edge');
    assert.equal(task.steps.length, 1);
    assert.equal(f.w.ProfileSolutions.steps(task).length, 6, 'authored worked solution expands the single accepted step');
    f.query('#hint').click();
    f.query('[data-solution-open]').click();
    for (let count = 1; count < 6; count++) f.query('[data-solution-next]').click();
    f.query('[data-solution-open]').click();
    assert.deepEqual(f.state().view.solution, { open: false, count: 6 });
    f.roundtrip('collapsed six-step solution');
    const bad = f.state(); bad.view.solution.count = 7;
    assert.equal(f.valid(bad), false);
    await f.navigate('#example/stereo-pyramid');
    const first = f.w.ProfileLessons.find(lesson => lesson.id === 'stereo-pyramid').tasks[0];
    const total = f.w.ProfileSolutions.steps(first).length;
    for (let count = 1; count < total; count++) f.query('[data-solution-next]').click();
    f.roundtrip('completed example');
    assert.equal(f.query('#example-complete').hidden, false);
    assert.equal(f.query('#example-next'), null);
    f.query('[data-solution-open]').click();
    f.roundtrip('collapsed completed example');
  } finally { f.dom.window.close(); }
});

test('malformed and cross-course states are rejected atomically without evaluating descriptors', async () => {
  const f = fixture(), expressions = fixture('expressions');
  try {
    await f.navigate('#practice/stereo-cylinder/independent');
    f.submit('-98765');
    const before = f.state(), html = f.query('#main').innerHTML;
    const rejected = value => {
      assert.equal(f.valid(value), false);
      assert.throws(() => f.apply(value), /Invalid stereometry board state/);
      assert.deepEqual(f.state(), before);
      assert.equal(f.query('#main').innerHTML, html);
    };
    const changes = [
      v => { v.route = '#exam/8'; }, v => { v.route += '/extra'; }, v => { v.extra = {}; },
      v => { v.progress.records['expr-powers'] = { guided: [], independent: [], attempts: 0 }; },
      v => { v.progress.seen['expr-powers-1'] = 1; },
      v => { v.progress.sessions['stereo-cylinder:independent'].taskId = 'stereo-cylinder-volume'; },
      v => { v.progress.sessions['stereo-cylinder:independent'].step = 1; },
      v => { v.progress.sessions['stereo-cylinder:independent'].answers = ['wrong']; },
      v => { v.progress.sessions['stereo-cylinder:independent'].started = '2026-02-30T00:00:00.000Z'; },
      v => { v.progress.sessions['stereo-cylinder:independent'].draft = '<img src=x>'; },
      v => { v.progress.sessions['stereo-cylinder:independent'].draft = 'x'.repeat(201); },
      v => { v.view.model.taskId = 'stereo-cone-volume'; }, v => { v.view.model.yaw = 1000001; },
      v => { v.view.model.pitch = 1.26; }, v => { v.view.model.extraOpen = 'true'; },
      v => { v.view.model.announcement = 'rotate'; }, v => { v.view.model.announcedYaw = 0; },
      v => { v.view.model.html = '<svg></svg>'; }, v => { v.view.model = null; },
      v => { v.view.solution = { open: true, count: 0 }; }, v => { v.view.solution.count = 999; },
      v => { v.view.feedback = 'right'; }, v => { v.view.details.lab = true; },
      v => { v.view.details.earned = [0]; }, v => { v.view.help = { kind: 'model', controlIndex: 999 }; },
      v => { v.preferences.examples['expr-powers'] = 0; }, v => { v.preferences.micro = { foreign: {} }; },
      v => { v.returnToTask = '#practice/stereo-cone/independent'; }
    ];
    for (const change of changes) {
      const value = copy(before); change(value);
      rejected(value);
    }
    rejected(expressions.state());
    assert.equal(expressions.valid(before), false, 'the published №8 adapter rejects a complete №3 snapshot');
    for (const kind of ['getter', 'sparse', 'array-property', 'symbol']) {
      const value = f.w.JSON.parse(JSON.stringify(before));
      if (kind === 'getter') Object.defineProperty(value.view.model, 'yaw', { enumerable: true, get() { throw new Error('Getter must not execute'); } });
      if (kind === 'sparse') value.progress.sessions['stereo-cylinder:independent'].answers = new f.w.Array(1);
      if (kind === 'array-property') value.view.details.earned.extra = true;
      if (kind === 'symbol') value.view.model[Symbol('extra')] = true;
      assert.equal(f.api.validateState(value), false, kind);
      assert.throws(() => f.api.applyState(value), /Invalid stereometry board state/);
      assert.deepEqual(f.state(), before);
      assert.equal(f.query('#main').innerHTML, html);
    }
    assert.deepEqual(f.accesses, { local: 0, session: 0 });
    assert.deepEqual(expressions.accesses, { local: 0, session: 0 });
  } finally { f.dom.window.close(); expressions.dom.window.close(); }
});

test('external school help retains the current shared task and does not install a personal return route', async () => {
  const f = fixture();
  try {
    await f.navigate('#practice/stereo-prism/independent');
    f.submit('-9999');
    const link = f.query('#difficulty-help .prerequisite-link[target="_blank"]');
    assert(link, 'out-of-scope prerequisite opens separately');
    link.addEventListener('click', event => event.preventDefault());
    link.click();
    assert.equal(f.state().returnToTask, null);
    assert.equal(f.state().progress.sessions['stereo-prism:independent'].assisted, true);
    f.roundtrip('external prerequisite');
  } finally { f.dom.window.close(); }
});
