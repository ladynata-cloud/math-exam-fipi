'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const { JSDOM } = require('jsdom');
const { LESSON_IDS, validRoute } = require('../ege-profil/start/board-session.js');
const ROOT = resolve(__dirname, '..');
const copy = value => JSON.parse(JSON.stringify(value));

function fixture() {
  const html = readFileSync(resolve(ROOT, 'trainers/ege-profile-expressions.html'), 'utf8');
  const dom = new JSDOM(html, { url: 'https://local.example/trainers/ege-profile-expressions.html#exam/8', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window, accesses = { local: 0, session: 0 };
  w.TextEncoder = TextEncoder;
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  // Even an attempted read (including one hidden by a catch) is a failure.
  Object.defineProperty(w, 'localStorage', { get() { accesses.local++; throw new Error('Personal storage must not be read'); } });
  Object.defineProperty(w, 'sessionStorage', { get() { accesses.session++; throw new Error('Personal return must not be read'); } });
  let registration;
  w.MathExamBoard = { register(config) { registration = config; return { destroy() {} }; } };
  for (const script of w.document.querySelectorAll('script[src]')) {
    const path = new URL(script.src).pathname;
    if (path === '/trainers/board-bridge.js') continue;
    w.eval(readFileSync(resolve(ROOT, '.' + path), 'utf8'));
  }
  const api = w.__profileExpressionsBoard;
  assert(api, 'wrapper activates its adapter');
  assert.equal(registration.id, 'ege-profile-expressions');
  assert.equal(registration.parentOrigin, 'https://local.example');
  const intoWindow = value => w.JSON.parse(JSON.stringify(value));
  const state = () => copy(api.getState());
  function apply(value) { return api.applyState(intoWindow(value)); }
  function valid(value) { return api.validateState(intoWindow(value)); }
  async function navigate(hash) {
    w.location.hash = hash;
    await new Promise(resolveWait => w.setTimeout(resolveWait, 5));
  }
  function roundtrip(label) {
    const before = state(), text = w.document.querySelector('#main').textContent;
    assert.equal(valid(before), true, label + ': produced snapshot is valid');
    apply(before);
    assert.deepEqual(state(), before, label + ': pure roundtrip');
    assert.equal(w.document.querySelector('#main').textContent, text, label + ': visible copy restored');
    assert.deepEqual(accesses, { local: 0, session: 0 }, label + ': no personal storage access');
  }
  function submit(value) {
    const input = w.document.querySelector('#answer');
    input.value = String(value);
    input.dispatchEvent(new w.Event('input', { bubbles: true }));
    w.document.querySelector('#answer-form').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
  }
  return { dom, w, api, accesses, state, apply, valid, navigate, roundtrip, submit };
}

test('board routes stay inside the six №8 themes', () => {
  assert.equal(validRoute('#exam/8'), true);
  assert.equal(validRoute('#calm/8'), true);
  for (const id of LESSON_IDS) {
    for (const page of ['lesson', 'example']) assert.equal(validRoute('#' + page + '/' + id), true);
    for (const page of ['practice', 'repair', 'pause']) for (const mode of ['guided', 'plan', 'independent'])
      assert.equal(validRoute('#' + page + '/' + id + '/' + mode), true);
  }
  for (const route of ['', '#calm', '#exam/7', '#exam/08', '#exam/8/extra', '#lesson/expr-powers/independent',
    '#practice/expr-powers', '#practice/expr-powers/independent/extra', '#practice/%65xpr-powers/independent',
    '#lesson/stereo-box', '#checkpoint', '#progress', '#repair-task/expr-powers']) assert.equal(validRoute(route), false, route);
});

test('all six lesson, example, guided, plan and independent routes restore without personal state', async () => {
  const f = fixture();
  try {
    f.roundtrip('catalogue');
    for (const id of LESSON_IDS) {
      for (const route of ['#lesson/' + id, '#example/' + id, ...['guided', 'plan', 'independent'].map(mode => '#practice/' + id + '/' + mode)]) {
        await f.navigate(route);
        f.roundtrip(route);
      }
    }
    await f.navigate('#calm/8');
    for (const detail of f.w.document.querySelectorAll('#main > details')) detail.open = true;
    f.roundtrip('calm foundations');
    for (const link of f.w.document.querySelectorAll('#main a[href*="#lesson/foundation"]')) {
      assert.equal(link.target, '_blank');
      assert.equal(new URL(link.href).pathname, '/ege-profil/start/index.html');
    }
    await f.navigate('#exam/7');
    assert.equal(f.w.location.hash, '#exam/8', 'unsupported direct routes normalize to the registered catalogue');
    f.roundtrip('normalized catalogue');
  } finally { f.dom.window.close(); }
});

test('feedback, assistance, accepted steps, hidden solutions and completed examples retain their meaning', async () => {
  const f = fixture();
  try {
    await f.navigate('#practice/expr-powers/guided');
    for (const [draft, feedback] of [['', 'empty'], ['не число', 'format'], ['999999', 'wrong']]) {
      f.submit(draft);
      assert.equal(f.state().view.feedback, feedback);
      f.roundtrip(feedback);
    }
    f.w.document.querySelector('#hint').click();
    f.w.document.querySelector('[data-solution-open]').click();
    f.w.document.querySelector('[data-solution-next]').click();
    f.w.document.querySelector('[data-solution-open]').click();
    f.w.document.querySelector('#task-model button').click();
    f.w.document.querySelector('.task-foundation').open = true;
    f.roundtrip('hidden two-step solution and expression help');
    assert.deepEqual(f.state().view.solution, { open: false, count: 2 });
    f.w.document.querySelector('[data-solution-open]').click();
    f.w.document.querySelector('[data-solution-next]').click();
    assert.equal(f.state().view.solution.count, 3, 'next local reveal continues the restored closure');
    const taskId = f.state().progress.sessions['expr-powers:guided'].taskId;
    const task = f.w.ProfileLessons.find(l => l.id === 'expr-powers').tasks.find(t => t.id === taskId);
    for (const question of task.steps) {
      f.submit(question.answer);
      f.roundtrip('accepted guided step');
      f.w.document.querySelector('#next').click();
    }
    assert.equal(f.state().progress.sessions['expr-powers:guided'].registered, true);
    f.roundtrip('completed guided task');
    await f.navigate('#example/expr-roots');
    const total = f.w.ProfileSolutions.steps(f.w.ProfileLessons.find(l => l.id === 'expr-roots').tasks[0]).length;
    for (let i = 1; i < total; i++) f.w.document.querySelector('[data-solution-next]').click();
    f.roundtrip('completed example');
    assert.equal(f.w.document.querySelector('#example-complete').hidden, false);
    assert.equal(f.w.document.querySelector('#example-next'), null);
    f.w.document.querySelector('[data-solution-open]').click();
    f.roundtrip('collapsed completed example');
  } finally { f.dom.window.close(); }
});

test('malformed snapshots are rejected before memory, route, DOM or personal storage changes', async () => {
  const f = fixture();
  try {
    await f.navigate('#practice/expr-powers/independent');
    f.submit('12345');
    const before = f.state(), beforeDom = f.w.document.querySelector('#main').innerHTML;
    const changes = [
      v => { v.route = '#exam/7'; }, v => { v.route += '/extra'; }, v => { v.extra = 1; },
      v => { v.progress.records.foreign = {}; }, v => { v.progress.seen.foreign = 1; },
      v => { v.progress.sessions['expr-powers:independent'].step = 100; },
      v => { v.progress.sessions['expr-powers:independent'].taskId = 'expr-powers-1'; },
      v => { v.progress.sessions['expr-powers:independent'].answers = ['wrong']; },
      v => { v.progress.sessions['expr-powers:independent'].done = true; },
      v => { v.progress.sessions['expr-powers:independent'].draft = 'x'.repeat(201); },
      v => { v.progress.sessions['expr-powers:independent'].draft = '<img src=x>'; },
      v => { v.progress.sessions['expr-powers:independent'].started = 'yesterday'; },
      v => { v.preferences.examples.foreign = 0; }, v => { v.preferences.micro.extra = {}; },
      v => { v.view.solution = { open: true, count: 0 }; }, v => { v.view.solution.count = 999; },
      v => { v.view.model.partsOpen = 'yes'; }, v => { v.view.model.other = true; },
      v => { v.view.details.lab = true; }, v => { v.view.details.earned = [0]; },
      v => { v.view.feedback = 'right'; }, v => { v.view.feedback = '<b>correct</b>'; },
      v => { v.view.help = { kind: 'model', controlIndex: 999 }; }, v => { v.returnToTask = '#practice/expr-roots/guided'; }
    ];
    for (const change of changes) {
      const value = copy(before); change(value);
      assert.equal(f.valid(value), false, String(change));
      assert.throws(() => f.apply(value), /Invalid expressions board state/);
      assert.deepEqual(f.state(), before);
      assert.equal(f.w.document.querySelector('#main').innerHTML, beforeDom);
    }
    const getter = f.w.JSON.parse(JSON.stringify(before));
    Object.defineProperty(getter, 'route', { enumerable: true, get() { throw new Error('getter executed'); } });
    assert.equal(f.api.validateState(getter), false, 'accessors are not evaluated');
    for (const kind of ['earned', 'answers', 'record', 'extra-array-property']) {
      const value = f.w.JSON.parse(JSON.stringify(before));
      if (kind === 'earned') value.view.details.earned = new f.w.Array(1);
      if (kind === 'answers') { value.progress.sessions['expr-powers:independent'].answers = new f.w.Array(1); value.view.feedback = 'right'; }
      if (kind === 'record') value.progress.records['expr-powers'].guided = new f.w.Array(1);
      if (kind === 'extra-array-property') value.view.details.earned.extra = true;
      assert.equal(f.api.validateState(value), false, kind + ': lossy JSON array rejected');
      assert.throws(() => f.api.applyState(value), /Invalid expressions board state/);
      assert.deepEqual(f.state(), before);
      assert.equal(f.w.document.querySelector('#main').innerHTML, beforeDom);
    }
    assert.deepEqual(f.accesses, { local: 0, session: 0 });
  } finally { f.dom.window.close(); }
});

test('opening a prerequisite in another tab preserves a valid shared task and records assistance', async () => {
  const f = fixture();
  try {
    await f.navigate('#practice/expr-powers/independent');
    f.submit('99999');
    const link = f.w.document.querySelector('#difficulty-help .prerequisite-link[target="_blank"]');
    assert(link, 'outside-topic school help opens the canonical course separately');
    link.addEventListener('click', event => event.preventDefault());
    link.click();
    assert.equal(f.state().returnToTask, null, 'the room stays on the same task');
    assert.equal(f.state().progress.sessions['expr-powers:independent'].assisted, true);
    f.roundtrip('external prerequisite');
  } finally { f.dom.window.close(); }
});

test('labs restore their actual controls and continue after hydrate; invalid geometry is atomic', async () => {
  const f = fixture();
  try {
    for (const id of ['algebra-cosine', 'algebra-double-angle']) {
      await f.navigate('#lesson/' + id);
      const input = f.w.document.querySelector('#lab input[type="number"]');
      input.value = '135'; input.dispatchEvent(new f.w.Event('input', { bubbles: true }));
      f.w.document.querySelector('#explore-lab').open = true;
      f.roundtrip(id + ' lab');
      const before = f.state(), invalid = copy(before);
      invalid.view.model.degrees = 9000;
      assert.equal(f.valid(invalid), false);
      assert.throws(() => f.apply(invalid));
      assert.deepEqual(f.state(), before);
      f.w.document.querySelector('#lab [data-delta="15"]').click();
      assert.equal(f.state().view.model.degrees, 150);
    }
  } finally { f.dom.window.close(); }
});
