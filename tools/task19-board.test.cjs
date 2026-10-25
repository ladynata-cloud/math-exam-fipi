'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = path.resolve(__dirname, '..');
const sources = ['task19-board-session', 'task19-visual-data', 'task19-models-triangles', 'task19-models-circles',
  'task19-models-lines-polygons', 'task19-visual-models', 'task19-reference', 'task19-textbook-data', 'task19-textbook-reference', 'task19-visual-app'];
const { cards } = require('../trainers/task19-visual-data.js');
const copy = value => JSON.parse(JSON.stringify(value));
const tick = () => new Promise(resolve => setTimeout(resolve, 15));
function boot(t, { card = 'prev-056', board = true, marker = false, parentPath = '/trainers/trainer-board.html', storage } = {}) {
  const errors = [], console = new VirtualConsole(); console.on('jsdomError', error => errors.push(error.message));
  const w = new JSDOM(fs.readFileSync(path.join(root, 'trainers/task19-trainer.html'), 'utf8'), {
    url: 'https://example.test/trainers/task19-trainer.html?card=' + card + (marker ? '&board=1' : ''), runScripts: 'outside-only', virtualConsole: console
  }).window;
  t.after(() => w.close());
  let accesses = 0, notifications = 0, registration;
  if (board) {
    Object.defineProperty(w, 'parent', { value: { location: { origin: w.location.origin, pathname: parentPath } } });
    Object.defineProperty(w, 'localStorage', { get() { accesses++; throw new Error('Room touched personal storage'); } });
    w.MathExamBoard = { register(config) { registration = config; config.subscribe(() => { notifications++; }); } };
  } else if (storage) w.localStorage.setItem('mathExam.task19.visualHints.v1', JSON.stringify(storage));
  for (const name of sources) w.eval(fs.readFileSync(path.join(root, 'trainers/' + name + '.js'), 'utf8'));
  const api = () => w.Task19Board;
  return { w, errors, $: selector => w.document.querySelector(selector), api, registration: () => registration,
    state: () => copy(api().getState()), apply: value => api().applyState(w.JSON.parse(JSON.stringify(value))),
    accesses: () => accesses, notifications: () => notifications,
    saved: () => JSON.parse(w.localStorage.getItem('mathExam.task19.visualHints.v1')),
    input(key, value) { const input = w.document.querySelector(`input[data-key="${key}"]`); input.value = String(value); input.dispatchEvent(new w.Event('input', { bubbles: true })); }
  };
}

test('actual board parent paths activate an isolated registered room without needing invented URL parameters', async t => {
  for (const parentPath of ['/trainers/trainer-board.html', '/trainers/group-board.html']) {
    const e = boot(t, { parentPath });
    assert.equal(e.registration().id, 'oge-task19'); assert.equal(e.registration().version, '1.0.0');
    assert.equal(e.registration().stateSchemaVersion, 1); assert.equal(e.registration().parentOrigin, 'https://example.test');
    e.$('#hintToggle').click(); e.$('#btnFalse').click(); await tick();
    assert.equal(e.accesses(), 0); assert(e.$('#download').hidden);
    assert.match(e.$('#storageNote').textContent, /Личные результаты.*не изменяются/);
    assert(e.notifications() > 0); assert.deepEqual(e.errors, []);
  }
  const standalone = boot(t, { board: false, marker: true });
  assert.equal(standalone.api(), undefined, 'a standalone URL never claims a shared lesson');
  assert(standalone.saved().current);
});

test('two participants and late join restore assertion, answer, model controls, measurements and all disclosures', async t => {
  const a = boot(t, { card: 'prev-102' }), b = boot(t);
  a.$('#hintToggle').click(); a.input('a', -4); a.input('b', 2); a.$('.t19-measure').click();
  a.$('#settings').open = true; a.$('#textbookHost details').open = true;
  a.$('#btnTrue').click(); await tick();
  const sent = a.state(); b.apply(sent); await tick();
  assert.deepEqual(b.state(), sent);
  assert.equal(b.$('#statement').textContent, a.$('#statement').textContent);
  assert.equal(b.$('#answerExplanation').textContent, a.$('#answerExplanation').textContent);
  assert.equal(b.$('#visualHost svg').outerHTML, a.$('#visualHost svg').outerHTML);
  assert.equal(b.$('.t19-model-readout').hidden, false);
  assert.equal(b.$('#textbookHost details').open, true); assert.equal(b.$('#settings').open, true);
  assert.equal(b.notifications(), 0, 'remote apply emits no echo, including delayed toggle events');
  b.input('b', 3); await tick(); assert(b.notifications() > 0);
  a.apply(b.state()); await tick(); assert.deepEqual(a.state(), b.state());
  const late = boot(t); late.apply(b.state()); await tick();
  assert.deepEqual(late.state(), b.state()); assert.equal(late.notifications(), 0);
  assert.equal(a.accesses() + b.accesses() + late.accesses(), 0);
});

test('an immediate snapshot after opening a native textbook disclosure already records assistance', t => {
  const a = boot(t), b = boot(t);
  a.$('#textbookHost details').open = true;
  const packet = a.state(); assert.equal(packet.current.helpUsed, true);
  b.apply(packet); assert.equal(b.$('#textbookHost details').open, true);
  assert.deepEqual(b.state(), packet);
});

test('reference sheets and hidden models survive applying and opening the same shared hint again', async t => {
  const a = boot(t, { card: 'prev-100' }), b = boot(t);
  a.$('#hintToggle').click(); a.$('#referenceHost details').open = true;
  a.$('#referenceHost details details').open = true;
  a.$('#hintToggle').click(); await tick();
  const snapshot = a.state(); assert.deepEqual(snapshot.view.reference, [true, true]);
  b.apply(snapshot); await tick(); assert.deepEqual(b.state(), snapshot);
  assert(b.$('#hintPanel').hidden); b.$('#hintToggle').click();
  assert(b.$('#referenceHost details').open); assert(b.$('#referenceHost details details').open);
  assert.equal(b.state().current.helpUsed, true);
});

test('all 234 existing card models round-trip without accepting their mathematical premises from the peer', async t => {
  const e = boot(t), seed = e.state();
  for (const card of cards) {
    const snapshot = copy(seed); snapshot.current.id = card.id; e.apply(snapshot);
    e.$('#hintToggle').click(); const first = e.state();
    assert.equal(first.current.helpUsed, true, card.id); assert(first.current.modelState, card.id);
    for (const input of e.w.document.querySelectorAll('#visualHost input[data-key]')) {
      input.value = input.max; input.dispatchEvent(new e.w.Event('input', { bubbles: true }));
    }
    e.$('.t19-measure').click(); const changed = e.state(); const svg = e.$('#visualHost svg').outerHTML;
    e.apply(changed); assert.deepEqual(e.state(), changed, card.id); assert.equal(e.$('#visualHost svg').outerHTML, svg, card.id);
  }
  await tick(); assert.equal(e.accesses(), 0); assert.deepEqual(e.errors, []);
});

test('malformed snapshots reject atomically without touching DOM, storage, notifications or getters', async t => {
  const e = boot(t); e.$('#hintToggle').click(); e.$('.t19-measure').click(); await tick();
  const good = e.state(), html = e.w.document.body.innerHTML, sent = e.notifications();
  const variants = [
    v => { v.current.id = 'unknown'; }, v => { v.current.answer = '<script>alert(1)</script>'; },
    v => { v.current.modelState.params.angle = Infinity; }, v => { v.current.modelState.params.angle = 99999; },
    v => { v.current.modelState.params.truth = 1; }, v => { v.current.helpUsed = false; },
    v => { v.answers = [['prev-056', false, true], ['prev-056', false, true]]; },
    v => { v.current.answer = true; }, v => { v.view.reference = [true]; },
    v => { v.records = { 'prev-056': { correct: 999 } }; }, v => { v.current = null; },
    v => { v.topic = 'not a topic'; }, v => { v.independent = true; }
  ];
  for (const change of variants) {
    const invalid = copy(good); change(invalid);
    assert.throws(() => e.apply(invalid)); assert.deepEqual(e.state(), good);
    assert.equal(e.w.document.body.innerHTML, html);
  }
  let read = false; const getter = e.w.JSON.parse(JSON.stringify(good));
  Object.defineProperty(getter.current, 'id', { get() { read = true; return 'prev-056'; }, enumerable: true });
  assert.throws(() => e.api().applyState(getter)); assert.equal(read, false);
  await tick(); assert.equal(e.notifications(), sent); assert.equal(e.accesses(), 0);
});

test('room mistake filtering uses only the room answers and never imports personal totals', async t => {
  const e = boot(t), next = boot(t);
  e.$('#btnTrue').click(); e.$('#reviewOnly').checked = true;
  e.$('#reviewOnly').dispatchEvent(new e.w.Event('change', { bubbles: true })); await tick();
  assert.equal(e.state().current.id, 'prev-056'); assert.equal(e.state().current.answer, null);
  next.apply(e.state()); next.$('#btnFalse').click(); next.$('#nextCard').click(); await tick();
  assert.equal(next.state().current, null); assert.match(next.$('#statement').textContent, /нет ошибок/);
  e.apply(next.state()); await tick(); assert.deepEqual(e.state(), next.state());
  assert.equal(e.state().answers.length, 1); assert.equal(e.state().answers[0][1], false);
});

test('help opened after a submitted answer does not retroactively change its label on either participant', async t => {
  const a = boot(t), b = boot(t);
  a.$('#btnFalse').click(); const label = a.$('#resultTitle').textContent;
  a.$('#hintToggle').click(); await tick(); b.apply(a.state()); await tick();
  assert.equal(a.$('#resultTitle').textContent, label); assert.equal(b.$('#resultTitle').textContent, label);
  assert.equal(a.state().current.helpUsed, true); assert.equal(a.state().answers[0][2], false);
  const standalone = boot(t, { board: false }); standalone.$('#btnFalse').click();
  standalone.$('#hintToggle').click(); const restored = boot(t, { board: false, storage: standalone.saved() });
  assert.equal(restored.$('#resultTitle').textContent, standalone.$('#resultTitle').textContent);
  assert.equal(restored.saved().current.answerHelpUsed, false);
});

test('assistance is sticky through hide/reload and textbook reading while old standalone record shapes survive', async t => {
  const a = boot(t, { board: false }); a.$('#hintToggle').click(); a.$('#hintToggle').click();
  const b = boot(t, { board: false, storage: a.saved() }); b.$('#btnFalse').click();
  assert.match(b.$('#resultTitle').textContent, /С подсказкой/);
  assert.deepEqual(b.saved().records['prev-056'], { attempts: 1, correct: 1, needsReview: false });
  const c = boot(t, { board: false }); c.$('#textbookHost details').open = true; c.$('#btnFalse').click();
  assert.equal(c.saved().current.helpUsed, true); assert.match(c.$('#resultTitle').textContent, /С подсказкой/);
  await tick(); assert.deepEqual(a.errors.concat(b.errors, c.errors), []);
});
