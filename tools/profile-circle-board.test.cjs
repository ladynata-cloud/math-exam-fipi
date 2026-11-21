'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const { JSDOM } = require('jsdom');
const ROOT = resolve(__dirname, '..');
const { LESSON_IDS } = require('../ege-profil/circle/board-session.js');
const clone = value => JSON.parse(JSON.stringify(value));

function fixture({ bridge = true } = {}) {
  const dom = new JSDOM(readFileSync(resolve(ROOT, 'trainers/ege-profile-circle.html'), 'utf8'), {
    url: 'https://local.example/trainers/ege-profile-circle.html#home', runScripts: 'outside-only', pretendToBeVisual: true
  });
  const w = dom.window, accesses = { local: 0, session: 0 };
  w.TextEncoder = TextEncoder;
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  Object.defineProperty(w, 'localStorage', { get() { accesses.local++; throw Error('No personal storage in Circle board'); } });
  Object.defineProperty(w, 'sessionStorage', { get() { accesses.session++; throw Error('No personal return in Circle board'); } });
  let registration;
  if (bridge) w.MathExamBoard = { register(config) { registration = config; return { destroy() {} }; } };
  for (const script of w.document.querySelectorAll('script[src]')) {
    const path = new URL(script.src).pathname;
    if (path === '/trainers/board-bridge.js') continue;
    w.eval(readFileSync(resolve(ROOT, '.' + path), 'utf8'));
  }
  const api = w.__profileCircleBoard;
  assert(api);
  if (bridge) {
    assert.equal(registration.id, 'ege-profile-circle');
    assert.equal(registration.parentOrigin, 'https://local.example');
  } else assert.equal(registration, undefined);
  const intoWindow = value => w.JSON.parse(JSON.stringify(value));
  const state = () => clone(api.getState());
  const apply = value => api.applyState(intoWindow(value));
  const valid = value => api.validateState(intoWindow(value));
  async function navigate(route) {
    w.location.hash = route;
    await new Promise(wait => w.setTimeout(wait, 1));
  }
  function visible() {
    const one = selector => w.document.querySelector(selector);
    return {
      text: one('#main').textContent,
      fields: [...w.document.querySelectorAll('#answer-form input')].map(input => [input.name, input.value, input.checked, input.disabled]),
      angle: one('[data-angle-input]')?.value,
      point: one('[data-current-point]') ? ['cx', 'cy'].map(key => one('[data-current-point]').getAttribute(key)) : null,
      error: one('[data-lab-error]')?.textContent,
      readings: one('[data-lab-readings]')?.textContent,
      hiddenHint: one('#hint-box')?.hidden,
      nextDisabled: one('#next')?.disabled,
      details: [...w.document.querySelectorAll('#main details')].map(element => element.open)
    };
  }
  function roundtrip(label) {
    const before = state(), shown = visible();
    assert.equal(valid(before), true, label + ': produced state is valid');
    apply(before);
    assert.deepEqual(state(), before, label + ': snapshot roundtrip');
    assert.deepEqual(visible(), shown, label + ': rendered controls and feedback roundtrip');
    assert.deepEqual(accesses, { local: 0, session: 0 }, label + ': isolated personal progress');
  }
  function input(selector, value, event = 'input') {
    const element = w.document.querySelector(selector);
    assert(element, selector);
    element.value = String(value);
    element.dispatchEvent(new w.Event(event, { bubbles: true }));
  }
  function answer(fields) {
    for (const field of fields) {
      if (field.kind === 'number') input('#field-' + field.id, field.expected);
      else if (field.kind === 'point') {
        input('[data-angle-input]', field.expected, 'change');
        w.document.querySelector('[data-capture="' + field.id + '"]').click();
      } else if (field.kind === 'choice' || field.kind === 'multi') {
        const wanted = field.kind === 'choice' ? [field.expected] : field.expected.length ? field.expected : ['__none'];
        for (const value of wanted) {
          const element = [...w.document.querySelectorAll('input[name="' + field.id + '"]')].find(input => input.value === value);
          assert(element, 'known choice ' + value);
          element.click();
        }
      } else for (const value of field.expected) {
        const element = [...w.document.querySelectorAll('[data-add="' + field.id + '"]')].find(button => button.dataset.value === value);
        assert(element, 'known ordering choice ' + value);
        element.click();
      }
    }
    w.document.querySelector('#answer-form').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
    assert.equal(state().view.feedback, 'right', 'canonical answer is accepted');
  }
  return { dom, w, api, registration, accesses, state, apply, valid, navigate, visible, roundtrip, input, answer };
}

test('fixed Circle board selection contains 7 lessons and 56 tasks; unrelated routes leave the room', async () => {
  const f = fixture();
  try {
    assert.equal(f.w.document.querySelectorAll('.lesson-card').length, 7);
    assert.equal(f.w.MordLessons.filter(l => LESSON_IDS.includes(l.id)).reduce((n, l) => n + l.tasks.length, 0), 56);
    f.roundtrip('home');
    for (const id of LESSON_IDS) {
      await f.navigate('#lesson/' + id);
      f.roundtrip(id + ': lesson');
      for (const link of f.w.document.querySelectorAll('#main a[href]')) {
        const url = new URL(link.href);
        if (url.pathname !== '/trainers/ege-profile-circle.html') assert.equal(link.target, '_blank', 'external course links cannot replace the wrapper');
      }
    }
    for (const route of ['#lesson/m4-arc-length', '#task/m4-1-am/guided', '#task/prep-radius/plan', '#task/prep-radius/guided/extra', '#lesson/before-circle/m6-1-a/independent', '#number/4.1']) {
      await f.navigate(route);
      assert.equal(f.w.location.hash, '#home', route);
      f.roundtrip('normalized route');
    }
  } finally { f.dom.window.close(); }
});

test('a missing bridge fails closed with the fixed selection and no personal storage access', () => {
  const f = fixture({ bridge: false });
  try {
    assert.equal(f.w.document.querySelectorAll('.lesson-card').length, 7);
    assert.equal(f.w.document.getElementById('main').inert, true);
    assert.equal(f.w.document.getElementById('storage-warning').hidden, false);
    assert.match(f.w.document.getElementById('storage-warning').textContent, /Не удалось подключить совместную доску/);
    assert.deepEqual(f.accesses, { local: 0, session: 0 });
    assert.equal(f.valid(f.state()), true);
  } finally { f.dom.window.close(); }
});

test('report, source and number navigation restore without adding private-save controls', async () => {
  const f = fixture();
  try {
    await f.navigate('#progress');
    f.roundtrip('empty shared report');
    assert.equal(f.w.document.querySelector('#raw-export'), null);
    assert.match(f.w.document.querySelector('#main').textContent, /совместная работа текущей комнаты/);
    await f.navigate('#home');
    f.input('#book-number', '4.1');
    f.w.document.querySelector('#jump-form').dispatchEvent(new f.w.Event('submit', { bubbles: true, cancelable: true }));
    f.roundtrip('out-of-selection number search');
    await f.navigate('#number/5.1');
    f.input('#book-number', '6.1');
    f.roundtrip('selected number page and search draft');
    await f.navigate('#sources');
    f.roundtrip('sources');
    await f.navigate('#lesson/before-circle/prep-radius/guided');
    assert.equal(f.w.location.hash, '#lesson/before-circle', 'unstarted return route does not manufacture an attempt');
    f.roundtrip('normalized missing return attempt');
  } finally { f.dom.window.close(); }
});

test('every selected task supports draft, accepted answer, completed solution and pure hydration', async () => {
  const f = fixture();
  try {
    const lessons = f.w.MordLessons.filter(l => LESSON_IDS.includes(l.id));
    for (const lesson of lessons) for (const task of lesson.tasks) {
      await f.navigate('#task/' + task.id + '/independent');
      f.roundtrip(task.id + ': initial independent');
      f.answer(task.fields);
      f.roundtrip(task.id + ': accepted independent');
      f.w.document.querySelector('#next').click();
      f.w.document.querySelector('.solution details').open = true;
      f.roundtrip(task.id + ': completed solution');
    }
    assert.equal(Object.keys(f.state().progress.records).length, 56);
    assert(Object.keys(f.state().progress.sessions).length <= 16);
    assert(new TextEncoder().encode(JSON.stringify(f.state())).length < 64 * 1024);
  } finally { f.dom.window.close(); }
});

test('guided steps, checked-answer history, hints and return-to-explanation survive reconstruction', async () => {
  const f = fixture();
  try {
    for (const lesson of f.w.MordLessons.filter(l => LESSON_IDS.includes(l.id))) {
      const task = lesson.tasks[0];
      await f.navigate('#task/' + task.id + '/guided');
      const questions = [...task.steps, { fields: task.fields }];
      for (let step = 0; step < questions.length; step++) {
        f.w.document.querySelector('#hint').click();
        f.roundtrip(task.id + ': hinted step ' + step);
        f.answer(questions[step].fields);
        f.roundtrip(task.id + ': accepted step ' + step);
        const s = f.state().progress.sessions[task.id + ':guided'];
        assert.equal(s.answers.length, step + 1);
        f.w.document.querySelector('#next').click();
      }
      f.roundtrip(task.id + ': guided complete');
    }
    await f.navigate('#task/prep-radius/independent');
    await f.navigate('#lesson/before-circle/prep-radius/independent');
    f.roundtrip('explanation with saved return');
    const prior = f.state().progress.sessions['prep-radius:independent'];
    assert.equal(prior.assisted, true);
    await f.navigate('#task/prep-radius/independent');
    assert.deepEqual(f.state().progress.sessions['prep-radius:independent'], prior);
  } finally { f.dom.window.close(); }
});

test('model angle, unsubmitted input, snap controls, hidden readings and error messages restore their closures', async () => {
  const f = fixture();
  try {
    await f.navigate('#lesson/m5-coordinates');
    f.input('[data-angle-input]', '-5*pi/3', 'change');
    f.input('[data-angle-snap]', '4', 'change');
    f.input('[data-angle-input]', 'unfinished angle');
    f.roundtrip('lesson model draft and snap');
    const prior = f.state().view.model.angle;
    f.w.document.querySelector('[data-delta]:nth-child(3)').click();
    assert(Math.abs(f.state().view.model.angle - prior - Math.PI / 4) < 1e-9, 'restored snap controls use restored increment');
    await f.navigate('#task/m5-1-a/independent');
    f.input('[data-angle-input]', 'not a number', 'change');
    f.roundtrip('model parse error');
    f.input('[data-angle-input]', 'pi/6', 'change');
    f.w.document.querySelector('[data-reveal-readings]').click();
    f.roundtrip('revealed model help');
    assert.equal(f.state().progress.sessions['m5-1-a:independent'].assisted, true);
    f.w.document.querySelector('[data-zero]').click();
    assert.equal(f.state().view.model.angle, 0);
    f.roundtrip('local model movement after hydration');
  } finally { f.dom.window.close(); }
});

test('empty, unreadable and wrong answer feedback remains visible after later draft edits', async () => {
  const f = fixture();
  try {
    await f.navigate('#task/m5-1-a/independent');
    const fields = f.w.MordLessons.find(l => l.id === 'm5-coordinates').tasks[0].fields;
    const submit = () => f.w.document.querySelector('#answer-form').dispatchEvent(new f.w.Event('submit', { bubbles: true, cancelable: true }));
    submit();
    assert.equal(f.state().view.feedback, 'empty');
    f.roundtrip('empty');
    for (const field of fields) f.input('#field-' + field.id, 'unreadable');
    submit();
    assert.equal(f.state().view.feedback, 'format');
    f.roundtrip('format');
    for (const field of fields) f.input('#field-' + field.id, '9999');
    submit();
    assert.equal(f.state().view.feedback, 'wrong');
    f.input('#field-' + fields[0].id, '0');
    f.roundtrip('wrong feedback with edited draft');
  } finally { f.dom.window.close(); }
});

test('invalid, forged and oversized states fail before route, memory, controls or personal storage change', async () => {
  const f = fixture();
  try {
    await f.navigate('#task/m5-1-a/independent');
    const key = 'm5-1-a:independent';
    const before = f.state(), shown = f.visible();
    const changes = [
      v => { v.route = '#task/m4-1-am/guided'; }, v => { v.route += '/extra'; }, v => { v.extra = 1; },
      v => { v.progress.seen.foreign = 1; }, v => { v.progress.records.foreign = { guided: false, independent: false, practised: false }; },
      v => { v.progress.sessions[key].step = 2; }, v => { v.progress.sessions[key].taskId = 'm4-1-am'; },
      v => { v.progress.sessions[key].mode = 'guided'; }, v => { v.progress.sessions[key].started = 'yesterday'; },
      v => { v.progress.sessions[key].answers = [{ x: '9999', y: '9999' }]; v.progress.sessions[key].solved = true; v.view.feedback = 'right'; },
      v => { v.progress.sessions[key].done = true; }, v => { v.progress.sessions[key].draft.foreign = 'x'; },
      v => { v.progress.sessions[key].draft.x = 'x'.repeat(201); }, v => { v.progress.sessions[key].draft.x = '<img src=x>'; },
      v => { v.view.hintOpen = true; }, v => { v.view.solutionOpen = true; }, v => { v.view.feedback = 'right'; },
      v => { v.view.feedbackField = 'foreign'; }, v => { v.view.model.angle = Math.PI; },
      v => { v.view.model.snapDenominator = 3; }, v => { v.view.model.revealed = true; }, v => { v.view.model.angleDraft = 'x'.repeat(201); },
      v => { v.view.model.error = '<script>'; }, v => { v.view.model = null; }, v => { v.view.jumpDraft = '4.1'; },
      v => { v.progress.sessions.foreign = clone(v.progress.sessions[key]); }
    ];
    for (const change of changes) {
      const value = clone(before); change(value);
      assert.equal(f.valid(value), false, change.toString());
      assert.throws(() => f.apply(value), /Invalid Circle board state/);
      assert.deepEqual(f.state(), before);
      assert.deepEqual(f.visible(), shown);
      assert.deepEqual(f.accesses, { local: 0, session: 0 });
    }
    const foreign = f.w.JSON.parse(JSON.stringify(before));
    Object.defineProperty(foreign, 'injected', { enumerable: true, get() { throw Error('Must not execute a supplied getter'); } });
    assert.equal(f.api.validateState(foreign), false);
  } finally { f.dom.window.close(); }
});

test('ordinary Circle keeps all lessons and its original personal state format', () => {
  const State = require('../ege-profil/circle/state.js');
  for (const file of ['preparation', 'chapter4', 'chapter5', 'chapter6a', 'chapter6b']) require('../ege-profil/circle/' + file + '.js');
  assert.equal(global.MordLessons.length, 33);
  const memory = new Map(), storage = { getItem: key => memory.get(key) || null, setItem: (key, value) => memory.set(key, value) };
  const state = State.create(global.MordLessons, storage), task = global.MordLessons[0].tasks[0];
  const attempt = state.start(task.id, 'independent');
  assert.equal(Object.hasOwn(attempt, 'answers'), false, 'shared proofs do not change personal attempts');
  attempt.draft = { answer: 'personal draft' }; state.save();
  const restored = State.create(global.MordLessons, storage);
  assert.equal(restored.data.sessions[task.id + ':independent'].draft.answer, 'personal draft');
  assert(memory.has(State.KEY));
});
