'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const { JSDOM } = require('jsdom');
const boards = require('../ege-profil/start/board-session.js');
const ROOT = resolve(__dirname, '..');
const copy = value => JSON.parse(JSON.stringify(value));
const courses = [
  { key: 'planimetry', number: 1, topics: 6, tasks: 36, entry: 'geo-angles' },
  { key: 'vectors', number: 2, topics: 4, tasks: 24, entry: 'vec-coordinates' },
  { key: 'probability', number: 4, topics: 3, tasks: 18, entry: 'prob-count' },
  { key: 'randomVariables', number: 6, topics: 3, tasks: 18, entry: 'prob-distribution' },
  { key: 'equations', number: 7, topics: 6, tasks: 36, entry: 'eq-linear' }
];

function fixture(key, options = {}) {
  const adapter = key === 'expressions' ? boards : boards[key], html = readFileSync(resolve(ROOT, '.' + adapter.path), 'utf8');
  const dom = new JSDOM(html, {
    url: 'https://local.example' + (options.path || adapter.path) + adapter.defaultRoute,
    runScripts: 'outside-only', pretendToBeVisual: true
  });
  const w = dom.window, accesses = { local: 0, session: 0 }, actions = { start: 0, finish: 0, persist: 0, remediate: 0 };
  if (options.marker !== undefined) w.document.body.dataset.profileBoard = options.marker;
  w.TextEncoder = TextEncoder;
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  // Count even attempted reads hidden by an application catch block.
  Object.defineProperty(w, 'localStorage', { get() { accesses.local++; throw Error('Personal progress must not be read'); } });
  Object.defineProperty(w, 'sessionStorage', { get() { accesses.session++; throw Error('Personal return must not be read'); } });
  let registration;
  w.MathExamBoard = { register(config) { registration = config; return { destroy() {} }; } };
  for (const script of w.document.querySelectorAll('script[src]')) {
    const path = new URL(script.src).pathname;
    if (path === '/trainers/board-bridge.js') continue;
    w.eval(readFileSync(resolve(ROOT, '.' + path), 'utf8'));
    if (path === '/ege-profil/start/state.js') {
      const create = w.ProfileState.create;
      w.ProfileState.create = (...args) => {
        const state = create(...args);
        for (const name of Object.keys(actions)) {
          const original = state[name];
          state[name] = (...values) => { actions[name]++; return original(...values); };
        }
        return state;
      };
    }
  }
  const api = w[adapter.debugKey];
  if (options.inactive) return { dom, w, registration };
  assert(api, key + ': matching path and marker activate the adapter');
  assert.equal(registration.id, adapter.id);
  assert.equal(registration.parentOrigin, 'https://local.example');
  const state = () => copy(api.getState());
  const intoWindow = value => w.JSON.parse(JSON.stringify(value));
  const apply = value => api.applyState(intoWindow(value));
  const valid = value => api.validateState(intoWindow(value));
  const query = selector => w.document.querySelector(selector);
  async function navigate(hash) {
    w.location.hash = hash;
    await new Promise(done => w.setTimeout(done, 5));
  }
  function controls() {
    return [...query('#main').querySelectorAll('input,select,details,button[aria-expanded],button[aria-pressed]')].map(node => ({
      tag: node.tagName, type: node.type, value: node.value, checked: node.checked, disabled: node.disabled,
      open: node.open, expanded: node.getAttribute('aria-expanded'), pressed: node.getAttribute('aria-pressed')
    }));
  }
  function roundtrip(label) {
    const before = state(), text = query('#main').textContent, fields = controls();
    assert.equal(valid(before), true, label + ': produced snapshot is valid');
    for (const name of Object.keys(actions)) actions[name] = 0;
    apply(before);
    assert.deepEqual(actions, { start: 0, finish: 0, persist: 0, remediate: 0 }, label + ': hydration does not replay attempts or persist');
    assert.deepEqual(state(), before, label + ': semantic state is restored exactly');
    const restored = query('#main').textContent;
    if (restored !== text) {
      let at = 0;
      while (at < Math.min(restored.length, text.length) && restored[at] === text[at]) at++;
      assert.fail(label + ': visible text differs at ' + at + '\nExpected: ' + JSON.stringify(text.slice(Math.max(0, at - 50), at + 150)) +
        '\nRestored: ' + JSON.stringify(restored.slice(Math.max(0, at - 50), at + 150)));
    }
    assert.deepEqual(controls(), fields, label + ': controls and disclosures are restored');
    assert.deepEqual(accesses, { local: 0, session: 0 }, label + ': no personal storage access');
  }
  function draft(value) {
    const input = query('#answer') || [...query('#answer-form').querySelectorAll('input[type="radio"]')].find(node => node.value === String(value));
    assert(input, 'the authored input accepts this test value');
    if (input.type === 'radio') input.checked = true;
    else input.value = String(value);
    input.dispatchEvent(new w.Event('input', { bubbles: true }));
  }
  function submit(value) {
    draft(value);
    query('#answer-form').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
  }
  function currentTask(id, mode) {
    const taskId = state().progress.sessions[id + ':' + mode].taskId;
    return w.ProfileLessons.find(lesson => lesson.id === id).tasks.find(task => task.id === taskId);
  }
  async function selectTask(id, mode, taskId) {
    await navigate('#practice/' + id + '/' + mode);
    await navigate(adapter.defaultRoute);
    const next = state(), session = next.progress.sessions[id + ':' + mode];
    Object.assign(session, { taskId, step: 0, wrong: false, assisted: mode !== 'independent', familiar: false,
      done: false, draft: '', answers: [], registered: false });
    next.progress.seen[taskId] = Math.max(1, next.progress.seen[taskId] || 0);
    apply(next);
    await navigate('#practice/' + id + '/' + mode);
    assert.equal(state().progress.sessions[id + ':' + mode].taskId, taskId);
  }
  return { dom, w, api, adapter, registration, accesses, actions, state, apply, valid, query, navigate, roundtrip, draft, submit, currentTask, selectTask };
}

test('optional recovery, checkpoint and mistake records preserve old room snapshots and strict task scope', async () => {
  for (const course of [...courses, { key: 'stereometry', entry: 'stereo-box' }, { key: 'expressions', entry: 'expr-powers' }]) {
    const f = fixture(course.key);
    try {
      const old = f.state();
      for (const key of ['theory', 'startHelp', 'resources']) delete old.view.details[key];
      assert.equal(f.valid(old), true, course.key + ': earlier disclosure shape remains valid');
      f.apply(old);
      const next = f.state(), lesson = f.w.ProfileLessons.find(l => l.id === course.entry);
      const record = next.progress.records[lesson.id], controls = lesson.tasks.slice(-3);
      record.recovered = controls.slice(0, 2).map(t => t.id);
      record.checkpointIndependent = [controls[2].id];
      record.mistakes = [lesson.tasks[0].id, controls[0].id];
      assert.equal(f.valid(next), true, course.key + ': bounded additive fields accepted');
      f.apply(next);
      assert.deepEqual(f.state().progress.records[lesson.id], copy(record));
      f.roundtrip(course.key + ': progress extensions');
      for (const change of [
        r => { r.recovered = [lesson.tasks[0].id]; },
        r => { r.checkpointIndependent = [controls[0].id, controls[0].id]; },
        r => { r.mistakes = ['unrelated-task']; },
        r => { r.recovered = true; },
        r => { r.unapproved = []; }
      ]) {
        const bad = copy(next); change(bad.progress.records[lesson.id]);
        assert.equal(f.valid(bad), false, course.key + ': malformed/foreign progress rejected');
      }
      await f.navigate('#lesson/' + lesson.id);
      const theory = f.query('details.theory'); assert.equal(theory.open, false);
      theory.open = true;
      f.roundtrip(course.key + ': requested theory remains open');
      await f.navigate('#calm/' + f.adapter.defaultRoute.split('/').at(-1));
      const guide = f.query('.calm-start-help'); assert.equal(guide.open, false); guide.open = true;
      const resources = f.query('.course-resources'); if (resources) resources.open = true;
      f.roundtrip(course.key + ': requested catalogue help/resources remain open');
    } finally { f.w.close(); }
  }
});

test('five fixed adapters accept only their own exact routes and retain the published №3/№8 APIs', () => {
  for (const course of courses) {
    const adapter = boards[course.key];
    assert.equal(adapter.defaultRoute, '#exam/' + course.number);
    assert.equal(adapter.LESSON_IDS.length, course.topics);
    assert.equal(adapter.validRoute('#calm/' + course.number), true);
    for (const id of adapter.LESSON_IDS) {
      for (const page of ['lesson', 'example']) assert.equal(adapter.validRoute('#' + page + '/' + id), true);
      for (const page of ['practice', 'pause', 'repair']) for (const mode of ['guided', 'plan', 'independent'])
        assert.equal(adapter.validRoute('#' + page + '/' + id + '/' + mode), true);
      for (const other of courses.filter(item => item !== course)) assert.equal(boards[other.key].validRoute('#lesson/' + id), false);
    }
    for (const route of ['', '#calm', '#exam/0' + course.number, '#exam/' + course.number + '/extra',
      '#practice/' + course.entry, '#lesson/' + course.entry + '/guided', '#checkpoint', '#progress', '#home',
      '#practice/' + course.entry + '/independent/extra', '#lesson/stereo-box', '#lesson/expr-powers'])
      assert.equal(adapter.validRoute(route), false, course.key + ': ' + route);
  }
  assert.equal(boards.id, 'ege-profile-expressions');
  assert.equal(boards.validRoute('#exam/8'), true);
  assert.equal(boards.stereometry.validRoute('#exam/3'), true);
});

test('all five wrapper paths and markers must match before registration', () => {
  for (const course of courses) for (const options of [
    { path: '/ege-profil/start/index.html' }, { marker: 'expressions' },
    { path: boards.stereometry.path }, { marker: '' }
  ]) {
    const f = fixture(course.key, { ...options, inactive: true });
    try {
      assert.equal(f.registration, undefined, course.key + ': mismatched activation stays closed');
      for (const adapter of [boards, boards.stereometry, ...courses.map(item => boards[item.key])])
        assert.equal(f.w[adapter.debugKey], undefined);
    } finally { f.dom.window.close(); }
  }
});

for (const course of courses) {
  test(course.key + ': authored coverage and every lesson, example and practice mode roundtrip without personal state', async () => {
    const f = fixture(course.key);
    try {
      const lessons = f.w.ProfileLessons.filter(lesson => lesson.position === course.number);
      assert.deepEqual(lessons.map(lesson => lesson.id).sort(), f.w.JSON.parse(JSON.stringify(f.adapter.LESSON_IDS)).sort());
      assert.equal(lessons.reduce((total, lesson) => total + lesson.tasks.length, 0), course.tasks);
      assert.equal(f.w.document.querySelectorAll('.exam-topic').length, course.topics);
      for (const lesson of lessons) for (const task of lesson.tasks) for (let step = 0; step < task.steps.length; step++)
        assert.equal(f.w.ProfileCalmMicro.steps(task, step).length, 0, task.id + ': no authored micro-state is omitted');
      f.roundtrip(course.key + ' overview');
      for (const id of f.adapter.LESSON_IDS) {
        for (const page of ['lesson', 'example']) { await f.navigate('#' + page + '/' + id); f.roundtrip(page + '/' + id); }
        for (const mode of ['guided', 'plan', 'independent']) {
          await f.navigate('#practice/' + id + '/' + mode);
          assert.equal(f.query('#micro-start'), null);
          f.roundtrip(id + '/' + mode);
          for (const page of ['pause', 'repair']) { await f.navigate('#' + page + '/' + id + '/' + mode); f.roundtrip(page + '/' + id + '/' + mode); }
        }
      }
      assert.equal(Object.keys(f.state().progress.sessions).length, course.topics * 3);
      assert.deepEqual(Object.keys(f.state().progress.records).sort(), f.adapter.LESSON_IDS.slice().sort());
      await f.navigate('#calm/' + course.number);
      f.query('.calm-number-foundations').open = true;
      f.roundtrip(course.key + ' calm catalogue');
      const invalid = f.state(); invalid.view.details.trigBasics = true;
      assert.equal(f.valid(invalid), false, 'these numbers do not have the №8 trigonometry disclosure');
      await f.navigate('#exam/8');
      assert.equal(f.w.location.hash, f.adapter.defaultRoute);
    } finally { f.dom.window.close(); }
  });

  test(course.key + ': draft, feedback, hidden solution steps, accepted work and result survive hydration', async () => {
    const f = fixture(course.key), id = course.entry, key = id + ':independent';
    try {
      await f.navigate('#practice/' + id + '/independent');
      f.draft('7/19');
      assert.equal(f.state().progress.sessions[key].draft, '7/19');
      const session = f.state().progress.sessions[key];
      f.query('#pause-practice').click();
      await new Promise(done => f.w.setTimeout(done, 5));
      f.roundtrip('pause with draft');
      await f.navigate('#practice/' + id + '/independent');
      assert.deepEqual(f.state().progress.sessions[key], session);
      assert.equal(f.query('#answer').value, '7/19');
      f.submit('-98765');
      assert.equal(f.state().view.feedback, 'wrong');
      f.query('#hint').click();
      f.query('[data-solution-open]').click();
      f.query('[data-solution-next]').click();
      f.query('[data-solution-open]').click();
      assert.deepEqual(f.state().view.solution, { open: false, count: 2 });
      f.roundtrip('wrong answer and collapsed two-step explanation');
      f.query('[data-solution-open]').click();
      f.query('[data-solution-next]').click();
      assert.equal(f.state().view.solution.count, 3, 'next local reveal continues from the restored count');
      f.submit(f.currentTask(id, 'independent').answer);
      assert.equal(f.state().view.feedback, 'right');
      if (['probability', 'randomVariables'].includes(course.key))
        assert.equal(f.w.document.querySelectorAll('#task-model .probability-task-model').length, 1, 'accepted work replaces the old drawing instead of appending a second model');
      f.roundtrip('accepted independent answer');
      f.query('#next').click();
      assert.equal(f.state().progress.sessions[key].done, true);
      f.roundtrip('completed result');
      await f.navigate('#practice/' + id + '/guided');
      const task = f.currentTask(id, 'guided');
      for (let step = 0; step < task.steps.length; step++) {
        f.submit(task.steps[step].answer);
        assert.equal(f.state().progress.sessions[id + ':guided'].answers.length, step + 1);
        f.roundtrip('accepted guided step ' + step);
        f.query('#next').click();
      }
      assert.equal(f.state().progress.sessions[id + ':guided'].done, true);
      f.roundtrip('guided result');
    } finally { f.dom.window.close(); }
  });
}

test('three in-drawing trigonometry solutions are bounded to live practice and resume revealed steps', async () => {
  const f = fixture('planimetry');
  try {
    for (const id of ['geo-right-sine', 'geo-right-cosine', 'geo-right-tangent']) {
      await f.selectTask('geo-right', 'guided', id);
      assert.equal(f.query('#task-solution'), null);
      assert.equal(f.state().view.solution, null);
      f.query('[data-trig-open]').click();
      f.query('[data-trig-next]').click();
      f.query('[data-trig-open]').click();
      assert.deepEqual(f.state().view.model.walkthrough, { open: false, count: 2 });
      f.roundtrip(id + ' collapsed inline explanation');
      f.query('[data-trig-open]').click();
      f.query('[data-trig-next]').click();
      assert.equal(f.state().view.model.walkthrough.count, 3);
      const invalid = f.state(); invalid.view.solution = { open: false, count: 0 };
      assert.equal(f.valid(invalid), false, 'a nonexistent generic panel is not accepted');
      const task = f.currentTask('geo-right', 'guided');
      for (const step of task.steps) { f.submit(step.answer); f.query('#next').click(); }
      assert.equal(f.state().view.model.walkthrough, null, 'result uses the original generic solution');
      assert(f.state().view.solution);
      f.roundtrip(id + ' completed result');
      const wrongContext = f.state(); wrongContext.view.model.walkthrough = { open: false, count: 0 };
      assert.equal(f.valid(wrongContext), false, 'hidden walkthrough cannot be restored into result context');
    }
  } finally { f.dom.window.close(); }
});

test('cross-course, malformed and descriptor states are rejected before memory or DOM changes', async () => {
  const fixtures = courses.map(course => fixture(course.key));
  try {
    for (let index = 0; index < fixtures.length; index++) {
      const f = fixtures[index], course = courses[index], key = course.entry + ':independent';
      await f.navigate('#practice/' + course.entry + '/independent');
      const before = f.state(), html = f.query('#main').innerHTML;
      const reject = value => {
        assert.equal(f.valid(value), false);
        assert.throws(() => f.apply(value), /Invalid .* board state/);
        assert.deepEqual(f.state(), before);
        assert.equal(f.query('#main').innerHTML, html);
      };
      for (const other of fixtures.filter(item => item !== f)) reject(other.state());
      for (const change of [
        v => { v.route = '#exam/8'; }, v => { v.extra = {}; },
        v => { v.progress.records['expr-powers'] = { guided: [], independent: [], attempts: 0 }; },
        v => { v.progress.sessions[key].answers = ['wrong']; }, v => { v.progress.sessions[key].draft = '<img src=x>'; },
        v => { v.progress.sessions[key].started = '2026-02-30T00:00:00.000Z'; },
        v => { v.view.model = null; }, v => { v.view.model.html = '<svg></svg>'; },
        v => { v.view.solution = null; }, v => { v.view.solution.count = 999; },
        v => { v.view.feedback = 'right'; }, v => { v.view.details.lab = true; },
        v => { v.view.details.earned = [0]; }, v => { v.preferences.micro.foreign = {}; }
      ]) { const value = copy(before); change(value); reject(value); }
      for (const kind of ['getter', 'sparse', 'array-property', 'symbol']) {
        const value = f.w.JSON.parse(JSON.stringify(before)); let invoked = false;
        if (kind === 'getter') Object.defineProperty(value.view, 'model', { enumerable: true, get() { invoked = true; throw Error('Getter must not run'); } });
        if (kind === 'sparse') value.progress.sessions[key].answers = new f.w.Array(1);
        if (kind === 'array-property') value.view.details.earned.extra = true;
        if (kind === 'symbol') value.view[Symbol('extra')] = true;
        assert.equal(f.api.validateState(value), false, kind);
        assert.throws(() => f.api.applyState(value), /Invalid .* board state/);
        assert.equal(invoked, false);
        assert.deepEqual(f.state(), before);
        assert.equal(f.query('#main').innerHTML, html);
      }
      assert.deepEqual(f.accesses, { local: 0, session: 0 });
    }
  } finally { fixtures.forEach(f => f.dom.window.close()); }
});
