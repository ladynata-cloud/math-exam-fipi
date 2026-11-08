'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { JSDOM } = require('jsdom');
const { logTrig: adapter } = require('../ege-profil/start/board-session.js');
const ROOT = path.resolve(__dirname, '..');
const copy = value => JSON.parse(JSON.stringify(value));
function fixture({withoutAdapter = false, withoutBridge = false} = {}) {
  const dom = new JSDOM(fs.readFileSync(path.join(ROOT, adapter.path), 'utf8'), {
    url: 'https://local.example' + adapter.path + '#course', runScripts: 'outside-only', pretendToBeVisual: true
  });
  const w = dom.window, accesses = { local: 0, session: 0 };
  w.TextEncoder = TextEncoder; w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = () => {};
  for (const [name, kind] of [['localStorage', 'local'], ['sessionStorage', 'session']])
    Object.defineProperty(w, name, { get() { accesses[kind]++; throw Error('Personal storage must not be read'); } });
  let registration;
  if (!withoutBridge) w.MathExamBoard = { register(config) { registration = config; return { destroy() {} }; } };
  for (const script of w.document.querySelectorAll('script[src]')) {
    const name = new URL(script.src).pathname;
    if (name !== '/trainers/board-bridge.js' && (!withoutAdapter || name !== '/ege-profil/start/board-session.js')) w.eval(fs.readFileSync(path.join(ROOT, name), 'utf8'));
  }
  const api = w.__profileLogTrigBoard;
  if (!withoutAdapter && !withoutBridge) { assert.equal(registration.id, adapter.id); assert.equal(registration.parentOrigin, w.location.origin); }
  const into = value => w.JSON.parse(JSON.stringify(value));
  const state = () => copy(api.getState());
  const valid = value => api.validateState(into(value));
  const apply = value => api.applyState(into(value));
  const tick = () => new Promise(resolve => w.setTimeout(resolve, 5));
  async function navigate(hash) { w.location.hash = hash; await tick(); }
  function roundtrip(label) {
    const before = state(), text = w.document.querySelector('#main').textContent;
    assert.equal(valid(before), true, label + ': emitted state validates');
    apply(before);
    assert.deepEqual(state(), before, label + ': exact semantic state');
    assert.equal(w.document.querySelector('#main').textContent, text, label + ': visible lesson restored');
    assert.deepEqual(accesses, { local: 0, session: 0 }, 'no reads or writes to individual progress');
  }
  function submit(value) {
    const form = w.document.querySelector('#answer-form'), text = form.querySelector('#answer');
    if (text) { text.value = String(value); text.dispatchEvent(new w.Event('input', { bubbles: true })); }
    else {
      const input = [...form.querySelectorAll('input[name="answer"]')].find(input => input.value === String(value));
      assert(input, 'authored choice exists'); input.checked = true; input.dispatchEvent(new w.Event('change', { bubbles: true }));
    }
    form.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
  }
  return { dom, w, api, registration, state, valid, apply, into, accesses, navigate, roundtrip, submit, tick };
}

test('fixed nine-topic boundary has a course overview without an invented exam number', () => {
  assert.equal(adapter.LESSON_IDS.length, 9); assert.equal(adapter.defaultRoute, '#course');
  assert.equal(adapter.validRoute('#course'), true);
  for (const id of adapter.LESSON_IDS) {
    for (const page of ['lesson', 'example']) assert.equal(adapter.validRoute('#' + page + '/' + id), true);
    for (const page of ['practice', 'repair', 'pause']) for (const mode of ['guided', 'plan', 'independent'])
      assert.equal(adapter.validRoute('#' + page + '/' + id + '/' + mode), true);
  }
  for (const route of ['', '#home', '#exam/8', '#exam/undefined', '#calm/undefined', '#progress', '#lesson/expr-powers',
    '#lesson/TRIG-ANGLE', '#lesson/%74rig-angle', '#lesson/trig-angle/guided', '#practice/trig-angle',
    '#practice/trig-angle/guided/extra', '#course/extra', '#checkpoint']) assert.equal(adapter.validRoute(route), false, route);
});

test('all selected lesson, worked-example and practice routes round-trip, with scoped links and isolated storage', async () => {
  const f = fixture();
  try {
    f.roundtrip('overview');
    assert.equal(f.w.document.querySelectorAll('.exam-topic').length, 9);
    for (const id of adapter.LESSON_IDS) {
      for (const route of ['#lesson/' + id, '#example/' + id, ...['guided', 'plan', 'independent'].map(mode => '#practice/' + id + '/' + mode)]) {
        await f.navigate(route); f.roundtrip(route);
      }
    }
    await f.navigate('#lesson/trig-angle');
    assert.equal(f.w.document.querySelector('.breadcrumb a').getAttribute('href'), '#course');
    for (const link of f.w.document.querySelectorAll('#main a[href]')) {
      const url = new URL(link.href);
      if (link.target === '_blank') assert.equal(url.pathname.startsWith('/trainers/'), false, 'relative course resources resolve canonically');
    }
    await f.navigate('#lesson/expr-powers'); assert.equal(f.w.location.hash, '#course'); f.roundtrip('unsupported topic fallback');
  } finally { f.w.close(); }
});

test('all 54 authored conditions can reach a restored result through guided and independent answers', async () => {
  const f = fixture(), completed = new Set();
  try {
    for (const id of adapter.LESSON_IDS) for (const mode of ['guided', 'independent']) {
      await f.navigate('#practice/' + id + '/' + mode);
      for (let attempt = 0; attempt < 3; attempt++) {
        const session = f.state().progress.sessions[id + ':' + mode];
        const task = f.w.ProfileLessons.find(lesson => lesson.id === id).tasks.find(task => task.id === session.taskId);
        completed.add(task.id);
        for (const question of mode === 'guided' ? task.steps : [task]) {
          f.submit(question.answer); assert.equal(f.state().view.feedback, 'right', task.id); f.roundtrip(task.id + ': accepted answer');
          f.w.document.querySelector('#next').click();
        }
        assert.equal(f.state().progress.sessions[id + ':' + mode].done, true); f.roundtrip(task.id + ': result');
        if (attempt < 2) f.w.document.querySelector('#another').click();
      }
    }
    assert.equal(completed.size, 54);
  } finally { f.w.close(); }
});

test('logarithm graph help, exploration, cursor and lesson disclosures restore independently without replaying help', async () => {
  const f = fixture();
  try {
    await f.navigate('#practice/fn-explog/independent');
    const button = f.w.document.querySelector('[data-model-action="function-help"]'); button.click();
    let details = f.w.document.querySelector('.function-explore'); details.open = true; await f.tick();
    const slider = details.querySelector('input'); slider.value = String(Number(slider.min) + (Number(slider.max) - Number(slider.min)) / 2);
    slider.dispatchEvent(new f.w.Event('input', { bubbles: true }));
    assert.equal(f.state().view.model.help, true); assert.equal(f.state().view.model.explore, true);
    assert.equal(f.state().view.details.materials, false, 'model explorer is not the separate lesson materials disclosure');
    f.roundtrip('graph helper and point'); await f.tick(); f.roundtrip('delayed hydration toggle');
    details = f.w.document.querySelector('.function-explore'); details.open = false; await f.tick();
    f.roundtrip('hidden graph exploration preserves point');
    await f.navigate('#lesson/fn-explog');
    f.w.document.querySelector('#explore-lab').open = true; f.w.document.querySelector('#main > details.extra-help').open = true;
    f.w.document.querySelector('.function-explore').open = true; await f.tick();
    f.roundtrip('lesson graph and materials separately open');
    assert.equal(f.state().view.details.materials, true);
  } finally { f.w.close(); }
});

test('circle lesson model state survives a restore and continues locally with exact degrees and feedback', async () => {
  const f = fixture();
  try {
    for (const [id, degrees] of [['trig-angle', '-300'], ['trig-coordinates', '135'], ['trig-special', '140'], ['trig-tangent', '90']]) {
      await f.navigate('#lesson/' + id);
      f.w.document.querySelector('#explore-lab').open = true;
      const input = f.w.document.querySelector('#lab input[type="number"]'); assert(input);
      input.value = degrees; input.dispatchEvent(new f.w.Event('input', { bubbles: true }));
      f.w.document.querySelector('#lab [data-check]').click();
      assert.equal(f.state().view.model.degrees, Number(degrees)); f.roundtrip(id + ': moved circle');
      assert.equal(f.state().view.model.feedback, 'correct');
    }
  } finally { f.w.close(); }
});

test('both ODZ inequality choices retain their exact mathematical symbols in guided board answers', async () => {
  const f = fixture();
  try {
    await f.navigate('#practice/algebra-logarithmic/guided');
    const lesson = f.w.ProfileLessons.find(lesson => lesson.id === 'algebra-logarithmic');
    f.submit(lesson.tasks[0].steps[0].answer); f.w.document.querySelector('#next').click();
    f.submit('>'); assert.equal(f.state().view.feedback, 'right');
    assert.equal(f.state().progress.sessions['algebra-logarithmic:guided'].draft, '>');
    f.roundtrip('positive ODZ direction');
    await f.navigate('#practice/algebra-logarithmic/independent');
    f.submit(lesson.tasks[3].answer); f.w.document.querySelector('#next').click();
    f.w.document.querySelector('#another').click();
    assert.equal(f.state().progress.sessions['algebra-logarithmic:independent'].taskId, lesson.tasks[4].id);
    f.w.document.querySelector('#repair-current').click(); await f.tick();
    f.submit(lesson.tasks[4].steps[0].answer); f.w.document.querySelector('#next').click();
    f.submit('<'); assert.equal(f.state().view.feedback, 'right');
    const session = f.state().progress.sessions['algebra-logarithmic:guided'];
    assert.equal(session.taskId, lesson.tasks[4].id); assert.equal(session.draft, '<'); assert.equal(session.answers[1], '<');
    f.roundtrip('negative ODZ direction with exact-task remediation');
  } finally { f.w.close(); }
});

test('malformed, forged and oversized snapshots reject atomically before any visible change', async () => {
  const f = fixture();
  try {
    await f.navigate('#practice/fn-explog/guided');
    const before = f.state(), key = 'fn-explog:guided';
    const changes = [
      state => { state.route = '#practice/eq-root/guided'; },
      state => { state.progress.records['eq-root'] = { guided: [], independent: [], attempts: 0 }; },
      state => { state.progress.sessions[key].taskId = 'trig-angle-1'; },
      state => { state.progress.sessions[key].answers = ['99999999']; state.view.feedback = 'right'; },
      state => { state.progress.sessions[key].started = '2026-99-01T00:00:00.000Z'; },
      state => { state.progress.sessions[key].draft = '<img src=x onerror=alert(1)>'; },
      state => { state.progress.sessions[key].draft = 'x'.repeat(201); },
      state => { state.progress.sessions[key].done = true; },
      state => { state.view.model.taskId = 'fn-explog-999'; },
      state => { state.view.model.cursor = 1e100; },
      state => { state.view.model.cursor = null; },
      state => { state.view.model.html = '<b>foreign</b>'; },
      state => { state.view.model.help = 'true'; },
      state => { state.preferences.micro = { extra: 'x'.repeat(65536) }; },
      state => { state.view.details.materials = true; }
    ];
    for (const change of changes) {
      const invalid = copy(before); change(invalid); assert.equal(f.valid(invalid), false);
      assert.throws(() => f.apply(invalid)); assert.deepEqual(f.state(), before, 'rejection is atomic');
    }
    const getter = f.into(before); let called = false;
    f.w.Object.defineProperty(getter.view.model, 'cursor', { enumerable: true, get() { called = true; return 0; } });
    assert.equal(f.api.validateState(getter), false); assert.equal(called, false);
    const cycle = f.into(before); cycle.view.model.cursor = cycle; assert.equal(f.api.validateState(cycle), false);
    const polluted = f.into(before); f.w.Object.defineProperty(polluted.view.model, '__proto__', { enumerable: true, value: {} });
    assert.equal(f.api.validateState(polluted), false);
    assert.deepEqual(f.accesses, { local: 0, session: 0 });
  } finally { f.w.close(); }
});


test('unavailable adapter or SDK cannot turn the registered wrapper into personal learning', async () => {
  for (const missing of ['withoutAdapter', 'withoutBridge']) {
    const f = fixture({[missing]: true});
    try {
      assert.deepEqual(f.accesses, {local:0, session:0}, missing + ': no personal-storage getter');
      assert.equal(f.w.document.querySelector('#main').inert, true);
      assert.equal(f.w.document.querySelector('#calm-toggle').disabled, true);
      assert.equal(f.w.document.querySelectorAll('.exam-topic').length, missing === 'withoutAdapter' ? 0 : 9);
      assert.match(f.w.document.body.textContent, /Обновите страницу/);
      if (missing === 'withoutBridge') {
        await f.navigate('#lesson/trig-angle'); await f.navigate('#course');
        assert.equal(f.w.document.querySelector('#storage-warning').hidden, false, 'failure reason survives header navigation');
        assert.deepEqual(f.accesses, {local:0, session:0});
      }
    } finally { f.w.close(); }
  }
});
