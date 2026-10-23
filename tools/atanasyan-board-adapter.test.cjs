'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { JSDOM } = require('jsdom');
const ROOT = resolve(__dirname, '..');
const bundle = JSON.parse(readFileSync(resolve(ROOT, 'geometry-course/textbook/data/course.json')));
const copy = value => JSON.parse(JSON.stringify(value));
const lessonId = 'atanasyan-7-9-main-92-part-1';
const theoryId = n => `atanasyan-7-9-theory-${n}-part-1`;

async function fixture(options = {}) {
  const html = readFileSync(resolve(ROOT, 'trainers/atanasyan-7-9.html'), 'utf8');
  const dom = new JSDOM(html, { url: 'https://local.example' + (options.path || '/trainers/atanasyan-7-9.html') + (options.search || ''), runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window, accesses = { local: 0, session: 0 }, registrations = { board: [], learning: [] };
  w.TextEncoder = TextEncoder; w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  if (options.marker !== undefined) w.document.body.dataset.atanasyanBoard = options.marker;
  Object.defineProperty(w, 'localStorage', { get() { accesses.local++; throw new Error('Personal storage accessed'); } });
  Object.defineProperty(w, 'sessionStorage', { get() { accesses.session++; throw new Error('Personal storage accessed'); } });
  w.fetch = async () => ({ ok: true, json: async () => w.JSON.parse(JSON.stringify(bundle)) });
  w.MathExamBoard = { register(config) { registrations.board.push(config); return { destroy() {} }; } };
  w.MathExamLearning = { register(config) { registrations.learning.push(config); return () => {}; } };
  for (const script of w.document.querySelectorAll('script[src]')) {
    const path = new URL(script.src).pathname;
    if (!['/trainers/board-bridge.js', '/trainers/learning-bridge.js'].includes(path)) w.eval(readFileSync(resolve(ROOT, '.' + path), 'utf8'));
  }
  const api = await w.__atanasyanReady;
  const into = value => w.JSON.parse(JSON.stringify(value));
  const tick = () => new Promise(resolveWait => w.setTimeout(resolveWait, 20));
  const query = selector => w.document.querySelector(selector);
  const state = () => copy(api.getState());
  const changes = []; api?.subscribe(change => changes.push(copy(change)));
  return { w, dom, api, accesses, registrations, tick, query, state, changes, into,
    apply: value => api.applyState(into(value)),
    clickText(text, root = w.document) { const button = [...root.querySelectorAll('button')].find(node => node.textContent === text); assert(button, text); button.click(); },
    close() { api?.destroy(); dom.window.close(); }
  };
}

test('the fixed wrapper registers only board v1 and never reads personal storage', async () => {
  const f = await fixture();
  try {
    assert.equal(f.registrations.board.length, 1); assert.equal(f.registrations.learning.length, 0);
    const config = f.registrations.board[0];
    assert.equal(config.id, 'atanasyan-7-9'); assert.equal(config.version, '1.0.0');
    assert.equal(config.stateSchemaVersion, 1); assert.equal(config.parentOrigin, 'https://local.example');
    assert.equal(f.query('h1').textContent, 'Задача 92 · а');
    assert.equal(f.query('#catalog-search'), null);
    assert.equal(f.query('.lesson-permalink').href, 'https://mathexam.space/geometry-course/textbook/#' + lessonId);
    assert.equal(f.query('main > header > button'), null);
    assert.equal(f.api.validateState(f.into(f.state())), true);
    assert.deepEqual(f.state().mainView, { viewId: 'neutral', zoom: 1, maxStep: 0 });
    assert.deepEqual(f.accesses, { local: 0, session: 0 });
    await f.tick(); assert.equal(f.changes.length, 0);
  } finally { f.close(); }
});

test('ordinary course and mismatching body marker cannot activate the adapter', async () => {
  for (const options of [{ path: '/geometry-course/textbook/' }, { marker: 'wrong' }]) {
    const f = await fixture(options);
    try { assert.equal(f.api, undefined); assert.equal(f.registrations.board.length, 0); assert.equal(f.registrations.learning.length, 0); }
    finally { f.close(); }
  }
});

test('draft, manual save, revealed steps and view restore silently without event replay', async () => {
  const f = await fixture();
  try {
    const input = f.query('#final-answer'); input.value = 'Стороны MN, NP, PM; углы NMP, MNP, MPN.';
    input.dispatchEvent(new f.w.Event('input', { bubbles: true }));
    f.query('[data-final-form]').dispatchEvent(new f.w.Event('submit', { bubbles: true, cancelable: true }));
    f.query('[data-main-help] > summary').click(); await f.tick();
    f.clickText('Разобрать по шагам'); await f.tick();
    f.query('[data-step="step-1"] details > summary').click();
    f.query('[data-main-model] [aria-label="Увеличить чертёж"]').click(); await f.tick();
    const state = f.state();
    assert.equal(state.draft, input.value); assert.equal(state.submitted, true); assert.equal(state.checked, false);
    assert.equal(state.revealed, 1); assert.equal(state.assisted, true);
    assert.deepEqual(state.mainView, { viewId: 'step-1', zoom: 1.25, maxStep: 1 });
    assert.deepEqual(state.openDetails, [1, 4]);
    assert(f.changes.every(change => change.kind !== 'check'));
    const before = f.changes.length;
    let replay = 0;
    for (const type of ['click', 'input', 'submit', 'change']) f.w.document.addEventListener(type, () => replay++, true);
    f.apply(state); await f.tick();
    assert.equal(replay, 0); assert.equal(f.changes.length, before); assert.deepEqual(f.state(), state);
    assert.match(f.query('[data-final-feedback]').textContent, /обсудить с учителем/);
    assert.equal(f.query('.course-conflict'), null);
    f.query('#final-answer').value = 'Дополнено'; f.query('#final-answer').dispatchEvent(new f.w.Event('input', { bubbles: true }));
    await f.tick(); assert.equal(f.state().submitted, false); assert.equal(f.state().draft, 'Дополнено');
    assert.equal(f.query('.course-conflict'), null); assert.deepEqual(f.accesses, { local: 0, session: 0 });
  } finally { f.close(); }
});

test('the exact four theory cards retain nested dialogs, disclosures, view and zoom on restore/back', async () => {
  const f = await fixture();
  try {
    f.query('[data-main-help] > summary').click(); await f.tick();
    f.query('[data-help="recall-theory"] > summary').click(); await f.tick();
    f.query(`[data-theory-link="${theoryId(14)}"]`).click(); await f.tick();
    assert.equal(f.query('dialog').dataset.theory, theoryId(14));
    f.query('[data-theory-step="step-3"] > summary').click(); await f.tick();
    f.query('dialog [aria-label="Увеличить чертёж"]').click();
    f.query('dialog [data-help="recall-theory"] > summary').click(); await f.tick();
    f.query(`dialog [data-theory-link="${theoryId(1)}"]`).click(); await f.tick();
    f.query('[data-theory-step="step-6"] > summary').click(); await f.tick();
    f.query('dialog [aria-label="Увеличить чертёж"]').click(); await f.tick();
    const state = f.state(), before = f.changes.length;
    assert.equal(state.theory.length, 2); assert.equal(state.theory[1].id, theoryId(1));
    assert.deepEqual(state.theory[1].view, { viewId: 'step-6', zoom: 1.25, maxStep: 6 });
    assert(f.api.validateState(f.into(state)));
    f.apply(state); await f.tick();
    assert.deepEqual(f.state(), state); assert.equal(f.changes.length, before);
    f.query('[data-theory-back]').click(); await f.tick();
    assert.equal(f.state().theory.length, 1); assert.deepEqual(f.state().theory[0], state.theory[0]);
    f.query(`dialog [data-theory-link="${theoryId(5)}"]`).click(); await f.tick();
    assert.equal(f.state().theory[1].id, theoryId(5));
    f.query('[data-theory-close]').click(); await f.tick();
    assert.equal(f.state().theory.length, 0); assert.equal(f.state().assisted, true);
    f.query(`[data-theory-link="${theoryId(4)}"]`).click(); await f.tick();
    assert.equal(f.state().theory[0].id, theoryId(4));
    const text = f.query('dialog').textContent;
    assert.match(text, /Два луча с общим началом/);
    assert.deepEqual(f.accesses, { local: 0, session: 0 });
  } finally { f.close(); }
});

test('malformed snapshots are rejected before DOM, work, hash or notifications mutate', async () => {
  const f = await fixture();
  try {
    const before = f.state(), dom = f.query('#textbook-app').innerHTML, hash = f.w.location.hash;
    const mutations = [s => { s.lessonId = 'atanasyan-7-9-main-93-part-1'; }, s => { s.hidden = true; },
      s => { s.draft = 'x'.repeat(8001); }, s => { s.checked = true; }, s => { s.stepDrafts['step-1'] = 'injected'; },
      s => { s.revealed = 3; }, s => { s.openDetails = [4]; }, s => { s.openDetails = [0, 0]; },
      s => { s.mainView.viewId = 'step-1'; }, s => { s.mainView.zoom = Infinity; }, s => { s.mainView.maxStep = 1; },
      s => { s.assisted = true; s.theory = [{ id: theoryId(15), view: copy(s.mainView), openDetails: [] }]; },
      s => { s.assisted = true; s.theory = [{ id: theoryId(14), view: copy(s.mainView), openDetails: [13] }]; },
      s => { s.assisted = true; s.theory = [{ id: theoryId(4), view: copy(s.mainView), openDetails: [] }, { id: theoryId(1), view: copy(s.mainView), openDetails: [] }]; }
    ];
    for (const mutate of mutations) {
      const state = f.into(before); mutate(state);
      assert.equal(f.api.validateState(state), false); assert.throws(() => f.api.applyState(state));
      assert.deepEqual(f.state(), before); assert.equal(f.query('#textbook-app').innerHTML, dom); assert.equal(f.w.location.hash, hash);
    }
    const accessor = f.into(before); let accessed = false;
    Object.defineProperty(accessor, 'draft', { enumerable: true, get() { accessed = true; return ''; } });
    assert.equal(f.api.validateState(accessor), false); assert.equal(accessed, false);
    const hidden = f.into(before); Object.defineProperty(hidden, 'extra', { value: true });
    assert.equal(f.api.validateState(hidden), false);
    const symbol = f.into(before); symbol[Symbol('extra')] = true; assert.equal(f.api.validateState(symbol), false);
    await f.tick(); assert.equal(f.changes.length, 0); assert.deepEqual(f.accesses, { local: 0, session: 0 });
  } finally { f.close(); }
});

test('queued native toggles never replace the saved view with DOM-order views', async () => {
  const f = await fixture();
  try {
    const state = f.state();
    Object.assign(state, { revealed: 2, assisted: true, mainView: { viewId: 'step-1', zoom: 1.75, maxStep: 2 },
      openDetails: [0, 1, 2, 3, 4, 5, 6, 7],
      theory: [{ id: theoryId(14), view: { viewId: 'step-2', zoom: 1.5, maxStep: 5 }, openDetails: [0, 1, 2, 3, 4, 11, 12] }] });
    f.apply(state); await f.tick();
    assert.deepEqual(f.state(), state); assert.equal(f.changes.length, 0);
    // Revealed work can also have its outer help deliberately closed.
    state.openDetails = [4, 5]; state.theory = [];
    f.apply(state); await f.tick();
    assert.equal(f.query('[data-main-help]').open, false);
    assert.deepEqual(f.state(), state); assert.equal(f.changes.length, 0);
  } finally { f.close(); }
});

test('unsupported markup stays visibly unsaved while the previous valid work remains intact', async () => {
  const f = await fixture();
  try {
    const input = f.query('#final-answer'); input.value = 'MN < NP';
    input.dispatchEvent(new f.w.Event('input', { bubbles: true })); await f.tick();
    const saved = f.state(), count = f.changes.length;
    input.value = '<b>MN</b>'; input.dispatchEvent(new f.w.Event('input', { bubbles: true }));
    f.query('[data-final-form]').dispatchEvent(new f.w.Event('submit', { bubbles: true, cancelable: true })); await f.tick();
    assert.deepEqual(f.state(), saved); assert.equal(f.changes.length, count);
    assert.match(f.query('[data-final-feedback]').textContent, /пока не сохранена/);
    input.value = 'Сторона MN'; input.dispatchEvent(new f.w.Event('input', { bubbles: true }));
    f.query('[data-final-form]').dispatchEvent(new f.w.Event('submit', { bubbles: true, cancelable: true })); await f.tick();
    assert.equal(f.state().draft, 'Сторона MN'); assert.equal(f.state().submitted, true);
    assert.equal(f.state().checked, false); assert(f.changes.every(change => change.kind !== 'check'));
  } finally { f.close(); }
});

test('managed mode registers only learning, restores pinned work, and readonly guards theory and main', async () => {
  const f = await fixture({ search: '?learning=1' });
  try {
    assert.equal(f.registrations.board.length, 0); assert.equal(f.registrations.learning.length, 1);
    const config = f.registrations.learning[0];
    const managedChanges = []; config.subscribe(change => managedChanges.push(copy(change)));
    assert.equal(config.trainerId, 'atanasyan-7-9'); assert.equal(config.contentVersion, 1);
    const prepared = f.w.AtanasyanLearningContracts.create(lessonId, 17);
    prepared.state.draft = 'Совместная запись'; prepared.state.assisted = true;
    prepared.state.theory = [{ id: theoryId(14), view: { viewId: 'step-2', zoom: 1.5, maxStep: 2 }, openDetails: [5] }];
    config.applyState({ taskSpec: prepared.taskSpec, state: f.into(prepared.state), readOnly: true }); await f.tick();
    const before = f.state();
    assert.equal(f.query('#final-answer').readOnly, true);
    f.query('[data-theory-close]').click(); f.query('dialog [aria-label="Увеличить чертёж"]').click(); await f.tick();
    assert.deepEqual(f.state(), before); assert.equal(f.changes.length, 0);
    const invalidTask = copy(prepared.taskSpec); invalidTask.contentId = 'wrong';
    assert.throws(() => config.applyState({ taskSpec: f.into(invalidTask), state: prepared.state })); assert.deepEqual(f.state(), before);
    config.setReadOnly(false); f.query('[data-theory-close]').click(); await f.tick();
    assert.equal(f.state().theory.length, 0); assert.equal(f.query('#final-answer').readOnly, false);
    assert.equal(managedChanges.at(-1).kind, 'input', 'cabinet references must use its state-persisting action');
    const save = f.query('[data-manual-save]'); assert.equal(save.type, 'button');
    let submits = 0; f.w.document.addEventListener('submit', () => submits++, true);
    save.click(); await f.tick();
    assert.equal(submits, 0, 'managed save works without allow-forms or synthetic form events');
    assert.equal(f.state().submitted, true); assert.equal(f.state().checked, false);
    assert.equal(managedChanges.at(-1).kind, 'input');
    f.w.location.hash = '#atanasyan-7-9-main-93-part-1'; await f.tick();
    assert.equal(f.w.location.hash, '#' + lessonId); assert.equal(f.query('h1').textContent, 'Задача 92 · а');
    assert.equal(f.query('#catalog-search'), null);
    assert.deepEqual(f.accesses, { local: 0, session: 0 });
  } finally { f.close(); }
});
