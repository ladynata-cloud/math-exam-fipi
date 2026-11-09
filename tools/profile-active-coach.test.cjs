'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { JSDOM } = require('jsdom');
const source = fs.readFileSync(path.join(__dirname, '../ege-profil/start/practice-coach.js'), 'utf8');
const KEY = 'mathexam.profilePracticeCoach.v1', START = '2026-11-09T08:00:00.000Z';
function storage(seed) {
  let value = seed === undefined ? null : seed;
  const calls = [];
  return { calls, getItem(key) { calls.push(['read', key]); assert.equal(key, KEY); return value; },
    setItem(key, next) { calls.push(['write', key]); assert.equal(key, KEY); value = next; }, value() { return value; } };
}
function page(id = 'fn-line', options = {}) {
  const dom = new JSDOM('<!doctype html><body><div id="host"></div></body>', { url: 'https://mathexam.space', runScripts: 'outside-only' });
  const w = dom.window;
  if (options.board !== undefined) w.document.body.setAttribute('data-profile-board', options.board);
  Object.defineProperty(w, 'ProfileState', { get() { throw Error('Coach must not access course mastery'); } });
  w.eval(source);
  const store = options.storage || storage(), host = w.document.querySelector('#host');
  const task = { id: options.taskId || 'coach-task-1', answer: 91827 }, session = { started: options.started || START, assisted: false, answers: [] };
  const original = JSON.stringify({ task, session });
  const cleanup = w.ProfilePracticeCoach.mount(host, { lesson: { id }, task, session, mode: options.mode || 'guided', storage: store, isCurrent: options.isCurrent });
  return { dom, w, d: w.document, host, store, cleanup, task, session, original, close() { cleanup(); w.close(); } };
}
function choose(p, index) {
  const select = p.host.querySelector('[aria-label="Мой прогноз"]'); select.value = String(index);
  select.dispatchEvent(new p.w.Event('change', { bubbles: true }));
}
function reveal(p, index) { choose(p, index); p.host.querySelector('[data-coach-action="reveal"]').click(); }
function answer(p, value) {
  const input = p.host.querySelector('[data-coach-answer]'); input.value = value;
  input.dispatchEvent(new p.w.Event('input', { bubbles: true }));
  p.host.querySelector('[data-coach-transfer]').dispatchEvent(new p.w.Event('submit', { bubbles: true, cancelable: true }));
}
function rows(p) { return [...p.host.querySelectorAll('.coach-scene tbody tr')].map(row => [...row.children].map(cell => cell.textContent)); }
function stored(p) { return JSON.parse(p.store.value()).records.at(-1); }

test('all eight bindings name existing course lessons, while unrelated lessons do not get a coach', () => {
  const p = page();
  try {
    const realm = new JSDOM('', { runScripts: 'outside-only' });
    try {
      for (const file of ['functions-data.js', 'probability-data.js', 'equations-data.js', 'finance-data.js']) realm.window.eval(fs.readFileSync(path.join(__dirname, '../ege-profil/start/', file), 'utf8'));
      const actual = new Set(realm.window.ProfileLessons.map(x => x.id));
      for (const id of ['fn-line', 'fn-hyperbola', 'calc-sign', 'prob-count', 'prob-conditional', 'prob-distribution', 'eq-linear', 'finance-lesson-01-ledger']) {
        assert(actual.has(id), id); assert(p.w.ProfilePracticeCoach.supports({ id }), id);
      }
      assert.equal(p.w.ProfilePracticeCoach.supports({ id: 'geo-right' }), false);
      assert.equal(p.w.ProfilePracticeCoach.supports({ id: '__proto__' }), false);
    } finally { realm.window.close(); }
  } finally { p.close(); }
});

test('line experiment moves only the intercept and verifies transfer on a new intercept', () => {
  const p = page();
  try {
    assert.deepEqual(rows(p), [['0', '1'], ['1', '3'], ['2', '5']]);
    assert(p.host.querySelector('[data-coach-action="reveal"]').disabled);
    assert(p.host.querySelector('[data-coach-transfer]').hidden);
    reveal(p, 0);
    assert.deepEqual(rows(p), [['0', '4'], ['1', '6'], ['2', '8']]);
    const before = [1, 3, 5], after = rows(p).map(row => +row[1]);
    assert.deepEqual(after.map((y, i) => y - before[i]), [3, 3, 3]);
    assert.equal(after[1] - after[0], 2);
    assert.match(p.host.querySelector('svg').getAttribute('aria-label'), /2x \+ 4/);
    answer(p, '0'); assert.equal(p.host.querySelector('.coach-transfer .coach-feedback').dataset.correct, 'true');
    assert.equal(JSON.stringify({ task: p.task, session: p.session }), p.original, 'no changes to course task or session');
  } finally { p.close(); }
});

test('stationary point is not promoted to extremum without a sign change', () => {
  const p = page('calc-sign');
  try {
    reveal(p, 2);
    assert.deepEqual(rows(p), [['0', '1'], ['1', '0'], ['2', '1']]);
    for (const [x, y] of rows(p)) assert.equal(+y, (+x - 1) ** 2);
    assert.match(p.host.querySelector('.coach-feedback').textContent, /продолжает возрастать/);
    answer(p, 'Минимум'); assert.equal(p.host.querySelector('.coach-transfer .coach-feedback').dataset.correct, 'false');
    answer(p, 'Максимум'); assert.equal(p.host.querySelector('.coach-transfer .coach-feedback').dataset.correct, 'true');
  } finally { p.close(); }
});

test('zero numerator preserves the excluded argument and replaces the asymptote with a hole', () => {
  const p = page('fn-hyperbola');
  try {
    assert.deepEqual(rows(p), [['0', '0'], ['1', 'Не определено'], ['2', '4']]);
    assert.equal(p.host.querySelectorAll('[data-graph-role="vertical-asymptote"]').length, 1);
    const branches = [...p.host.querySelectorAll('[data-graph-role="function"]')];
    assert.equal(branches.length, 2);
    // Compare every drawn point to the original equation, recovering graph
    // coordinates from the labelled axis scale. Neither branch crosses x = 1.
    branches.forEach((branch, index) => {
      const points = [...branch.getAttribute('d').matchAll(/[ML]([\d.e+-]+) ([\d.e+-]+)/g)];
      assert(points.length > 2);
      for (const [, px, py] of points) {
        const x = (+px - 40) / 38 - 2, y = (160 - +py) / 12 - 4;
        assert(index === 0 ? x < 1 : x > 1);
        assert(Math.abs(y - (2 / (x - 1) + 2)) < 1e-10);
        assert(y >= -4 - 1e-10 && y <= 8 + 1e-10);
      }
    });
    assert(p.host.querySelector('[data-coach-transfer]').hidden);
    reveal(p, 1);
    assert.deepEqual(rows(p), [['0', '2'], ['1', 'Не определено'], ['2', '2']]);
    assert.equal(p.host.querySelectorAll('[data-graph-role="vertical-asymptote"]').length, 0);
    assert.equal(p.host.querySelectorAll('[data-graph-role="horizontal-asymptote"]').length, 0);
    const hole = p.host.querySelector('[data-graph-role="excluded-point"]');
    assert(hole); assert.equal(+hole.getAttribute('cx'), 154); assert.equal(+hole.getAttribute('cy'), 88);
    assert.equal(hole.getAttribute('fill'), '#fff');
    assert.match(p.host.querySelector('svg').getAttribute('aria-label'), /Вертикальной асимптоты нет/);
    assert.match(p.host.querySelector('.coach-formula').textContent, /x ≠ 1/);
    answer(p, 'Никакую'); assert.equal(p.host.querySelector('.coach-transfer .coach-feedback').dataset.correct, 'false');
    answer(p, '(2; −1)'); assert.equal(p.host.querySelector('.coach-transfer .coach-feedback').dataset.correct, 'false');
    answer(p, '(−2; −1)'); assert.equal(p.host.querySelector('.coach-transfer .coach-feedback').dataset.correct, 'true');
    assert.equal(JSON.stringify({ task: p.task, session: p.session }), p.original);
  } finally { p.close(); }
});

test('hyperbola first forecast, correction and new-domain answer survive remount without mastery credit', () => {
  const store = storage(); let p = page('fn-hyperbola', { storage: store });
  try {
    reveal(p, 1); choose(p, 0); answer(p, '(2; −1)'); answer(p, '(−2; −1)');
    p.close(); p = page('fn-hyperbola', { storage: store });
    assert.equal(stored(p).firstPrediction, 1); assert.equal(stored(p).choice, 0);
    assert.equal(stored(p).transferFirst, '(2; −1)'); assert.equal(stored(p).transferLast, '(−2; −1)');
    assert.match(p.host.querySelector('.coach-first').textContent, /вся прямая/);
    assert.equal(p.host.querySelectorAll('[data-graph-role="excluded-point"]').length, 1);
    assert.equal(p.host.querySelectorAll('[data-graph-role="vertical-asymptote"]').length, 0);
    assert.equal(p.host.querySelector('[data-coach-answer]').value, '(−2; −1)');
    assert.equal(p.host.querySelector('.coach-transfer .coach-feedback').dataset.correct, 'true');
    assert.equal(JSON.stringify({ task: p.task, session: p.session }), p.original);
  } finally { p.close(); }
});

test('known red removal changes numerator and denominator, without a random simulation', () => {
  for (const id of ['prob-count', 'prob-conditional']) {
    const p = page(id);
    try {
      assert.equal(p.host.querySelectorAll('.coach-token.red').length, 3);
      assert.equal(p.host.querySelectorAll('.coach-token.blue').length, 3);
      reveal(p, 1);
      assert.equal(p.host.querySelectorAll('.coach-token.red').length, 2);
      assert.equal(p.host.querySelectorAll('.coach-token.blue').length, 3);
      assert.deepEqual(rows(p), [['Осталось', '2', '5']]);
      assert(2 / 5 < 3 / 6);
      answer(p, '2/6'); assert.equal(p.host.querySelector('.coach-transfer .coach-feedback').dataset.correct, 'true');
      answer(p, '2/5'); assert.equal(p.host.querySelector('.coach-transfer .coach-feedback').dataset.correct, 'false');
    } finally { p.close(); }
  }
});

test('one changed distribution value changes only its weighted contribution', () => {
  const p = page('prob-distribution');
  try {
    const initial = rows(p); assert.deepEqual(initial, [['0', '0,5'], ['2', '0,3'], ['5', '0,2']]);
    reveal(p, 1);
    assert.deepEqual(rows(p), [['0', '0,5'], ['2', '0,3'], ['10', '0,2']]);
    const expected = 0 * .5 + 2 * .3 + 10 * .2;
    assert.equal(expected, 2.6); assert.equal(expected - (0 * .5 + 2 * .3 + 5 * .2), 1);
    assert.deepEqual([...p.host.querySelectorAll('.coach-bar-row strong')].map(x => x.textContent), ['0', '0,6', '2']);
    answer(p, '0,6'); assert.equal(p.host.querySelector('.coach-transfer .coach-feedback').dataset.correct, 'true');
  } finally { p.close(); }
});

test('equation applies the same operation on both sides and checks the next operation', () => {
  const p = page('eq-linear');
  try {
    reveal(p, 2);
    assert.deepEqual(rows(p), [['5x + 2 − 2x', '2x + 14 − 2x'], ['3x + 2', '14']]);
    for (const x of [-3, 0, 4, 7]) assert.equal((5 * x + 2) - (2 * x + 14), (3 * x + 2) - 14);
    answer(p, '12'); assert.equal(p.host.querySelector('.coach-transfer .coach-feedback').dataset.correct, 'true');
    answer(p, '16'); assert.equal(p.host.querySelector('.coach-transfer .coach-feedback').dataset.correct, 'false');
  } finally { p.close(); }
});

test('finance distinguishes the first remaining debt from the next interest accrual', () => {
  const p = page('finance-lesson-01-ledger');
  try {
    assert.deepEqual(rows(p).map(r => r[1]), ['100', '110', '30', '80', '8', '88']);
    reveal(p, 1);
    assert.deepEqual(rows(p).map(r => r[1]), ['100', '110', '40', '70', '7', '77']);
    assert.equal(rows(p).at(-1)[0], 'Долг до второго платежа');
    assert.equal(88 - 77, 11); assert.equal(80 - 70, 10);
    answer(p, '66'); assert.equal(p.host.querySelector('.coach-transfer .coach-feedback').dataset.correct, 'true');
    answer(p, '60'); assert.equal(p.host.querySelector('.coach-transfer .coach-feedback').dataset.correct, 'false');
  } finally { p.close(); }
});

test('first forecast and first transfer remain separate from corrections and survive remount', () => {
  const store = storage(); let p = page('fn-line', { storage: store });
  try {
    const details = p.host.querySelector('details'); details.open = true; details.dispatchEvent(new p.w.Event('toggle'));
    reveal(p, 1); choose(p, 0); answer(p, '7'); answer(p, '0');
    assert.equal(stored(p).firstPrediction, 1); assert.equal(stored(p).choice, 0);
    assert.equal(stored(p).transferFirst, '7'); assert.equal(stored(p).transferLast, '0');
    p.close(); p = page('fn-line', { storage: store });
    assert(p.host.querySelector('details').open); assert.equal(p.host.querySelector('[aria-label="Мой прогноз"]').value, '0');
    assert.match(p.host.querySelector('.coach-first').textContent, /на 6/);
    assert.equal(p.host.querySelector('.coach-scene').dataset.stage, 'after');
    assert.equal(p.host.querySelector('[data-coach-answer]').value, '0');
    assert.equal(p.host.querySelector('.coach-transfer .coach-feedback').dataset.correct, 'true');
    const another = page('fn-line', { storage: store, started: '2026-11-09T08:01:00.000Z' });
    try { assert.equal(another.host.querySelector('.coach-scene').dataset.stage, 'before'); } finally { another.close(); }
  } finally { p.close(); }
});

test('a stale second tab preserves the first prediction and transfer from the first tab', () => {
  const store = storage(), first = page('fn-line', { storage: store }), second = page('fn-line', { storage: store });
  try {
    reveal(first, 1); answer(first, '7');
    choose(second, 0);
    assert.equal(stored(second).firstPrediction, 1);
    assert.equal(stored(second).choice, 0);
    assert.equal(stored(second).revealed, true);
    assert.equal(stored(second).transferFirst, '7');
    assert.equal(second.host.querySelector('.coach-scene').dataset.stage, 'after');
    answer(second, '0');
    assert.equal(stored(second).transferFirst, '7'); assert.equal(stored(second).transferLast, '0');
    choose(first, 2);
    assert.equal(stored(first).firstPrediction, 1); assert.equal(stored(first).transferFirst, '7');
    assert.equal(stored(first).transferLast, '0', 'changing a forecast does not roll back a newer transfer answer');
  } finally { first.close(); second.close(); }
});

test('a failed transfer leaves the final result for the learner to compute', () => {
  const p = page('finance-lesson-01-ledger');
  try {
    reveal(p, 1); answer(p, '60');
    const feedback = p.host.querySelector('.coach-transfer .coach-feedback');
    assert.match(feedback.textContent, /оставшийся долг/);
    assert.doesNotMatch(feedback.textContent, /66/);
    assert.equal(stored(p).transferFirst, '60');
    answer(p, '66'); assert.match(feedback.textContent, /66/);
  } finally { p.close(); }
});

test('independent, checkpoint-like mode, and all board flags prevent UI and storage access', () => {
  for (const id of ['fn-line', 'fn-hyperbola']) for (const options of [{ mode: 'independent' }, { mode: 'checkpoint' }, { board: 'true' }, { board: '' }]) {
    const store = storage(), p = page(id, { ...options, storage: store });
    try { assert.equal(p.host.childElementCount, 0); assert.deepEqual(store.calls, []); } finally { p.close(); }
  }
});

test('corrupt, unsupported, and denied storage never overwrite the original bytes', () => {
  for (const raw of ['not-json', '{"version":2,"records":[]}', '{"version":1,"records":[{}]}', 'x'.repeat(100001)]) {
    const store = storage(raw), p = page('fn-line', { storage: store });
    try {
      reveal(p, 0); answer(p, '0');
      assert.equal(store.value(), raw); assert.equal(store.calls.filter(x => x[0] === 'write').length, 0);
      assert.match(p.host.querySelector('.coach-unsaved').textContent, /не сохраняется/);
    } finally { p.close(); }
  }
  let writes = 0;
  const p = page('fn-line', { storage: { getItem() { throw Error('Denied'); }, setItem() { writes++; } } });
  try { reveal(p, 0); assert.equal(writes, 0); assert.match(p.host.querySelector('.coach-unsaved').textContent, /не сохраняется/); } finally { p.close(); }
});

test('stale and disposed callbacks cannot mutate view or persisted records', () => {
  let active = true; const p = page('fn-line', { isCurrent: () => active });
  try {
    choose(p, 0); const original = p.store.value(), action = p.host.querySelector('[data-coach-action="reveal"]'), callback = action.onclick;
    active = false; callback(); assert.equal(p.store.value(), original); assert.equal(p.host.querySelector('.coach-scene').dataset.stage, 'before');
    active = true; p.cleanup(); callback(); assert.equal(p.store.value(), original); assert.equal(p.host.querySelector('.coach-scene').dataset.stage, 'before');
  } finally { p.close(); }
});

test('storage remains bounded and rejects expression execution or zero division as numeric answers', () => {
  const store = storage();
  for (let i = 0; i < 83; i++) {
    const p = page('fn-line', { storage: store, taskId: 'bounded-' + i });
    try { choose(p, 0); } finally { p.close(); }
  }
  assert.equal(JSON.parse(store.value()).records.length, 80);
  assert.equal(JSON.parse(store.value()).records[0].taskId, 'bounded-3');
  const p = page('fn-line');
  try {
    reveal(p, 0);
    for (const value of ['1/0', '0/0', 'window.hacked=1', '0;alert(1)', '']) {
      answer(p, value); assert.notEqual(p.host.querySelector('.coach-transfer .coach-feedback').dataset.correct, 'true');
    }
    assert.equal(p.w.hacked, undefined);
  } finally { p.close(); }
});
