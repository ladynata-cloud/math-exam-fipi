'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {JSDOM} = require('jsdom');
const base = path.resolve(__dirname, '../trainers/oge-basics');
const sub = 'multiplication-division/';
const KEY = 'mathExamBasics.guidedDivision.v1';
const html = fs.readFileSync(path.join(base, sub, 'long-division-from-simple-to-decimals.html'), 'utf8');
function open(t, query = '?multiples=build#twoDigit', saved) {
  const dom = new JSDOM(html, {url:'https://mathexam.space/trainers/oge-basics/' + sub + 'long-division-from-simple-to-decimals.html' + query, runScripts:'outside-only', pretendToBeVisual:true});
  t.after(() => dom.window.close());
  const w = dom.window;
  w.structuredClone = structuredClone;
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  w.HTMLDialogElement.prototype.close = function () { this.open = false; };
  if (saved) w.localStorage.setItem(KEY, saved);
  for (const file of ['division-lab-core.js', 'division-guided-core.js', '../arithmetic-route.js', 'division-guided.js']) w.eval(fs.readFileSync(path.join(base, sub, file), 'utf8'));
  return {w, $:selector => w.document.querySelector(selector), state:() => w.__divisionGuidedDebug.state(), session(){const state=this.state(); return state.sessions[state.active];}, plan:() => w.__divisionGuidedDebug.plan(), saved:() => w.localStorage.getItem(KEY)};
}
function submit(f, value) {
  const a = f.plan().actions[f.session().step];
  if (a.options) f.$('[data-option="' + value + '"]').click();
  else { f.$('#answer').value = value; f.$('#answer').dispatchEvent(new f.w.Event('input', {bubbles:true})); }
  f.$('#answer-form').dispatchEvent(new f.w.Event('submit', {cancelable:true}));
}
function complete(f) {
  for (let guard = 0; guard < 180 && !f.session().done; guard++) submit(f, f.plan().actions[f.session().step].answer);
  assert(f.session().done);
}
function fill(f, n, value) {
  const input = f.$('[data-multiple-input="' + n + '"]');
  input.value = value;
  input.dispatchEvent(new f.w.Event('input', {bubbles:true}));
  f.$('[data-multiple-check="' + n + '"]').click();
}
test('the pupil builds the table, blank is not an error, wrong values stay unaccepted, and work resumes', t => {
  const f = open(t);
  assert.equal(f.session().multiples.divisor, 36);
  assert.equal(f.session().hints, 1, 'table mode is explicitly supported practice');
  assert.equal(f.$('#multiples-builder').hidden, false);
  fill(f, 1, '');
  assert.equal(f.session().errors, 0);
  fill(f, 1, '35');
  assert.equal(f.session().errors, 1);
  assert.equal(f.session().multiples.checked[0], false);
  fill(f, 1, '36');
  assert.equal(f.session().multiples.checked[0], true);
  assert.equal(f.$('[data-multiple-input="1"]').readOnly, true);
  f.$('[data-multiple-reveal]').click();
  assert.equal(f.session().reveals, 1);
  assert.equal(f.session().multiples.values[1], '72');
  const resumed = open(t, '?multiples=build#twoDigit', f.saved());
  assert.equal(resumed.session().hints, 1, 'reload does not count a second support use');
  assert.equal(resumed.session().reveals, 1);
  assert.deepEqual(resumed.session().multiples.checked.slice(0, 2), [true, true]);
  for (let n = 3; n <= 9; n++) fill(resumed, n, String(36 * n));
  assert.equal(resumed.$('#multiples-builder').open, false, 'completed table folds away');
  assert(resumed.session().multiples.checked.every(Boolean));
  complete(resumed);
  assert.equal(resumed.state().records[0].hints, 1);
  assert.match(resumed.$('#topic-progress').textContent, /без подсказок: 0/);
  assert.equal(resumed.$('#next-without-multiples').hidden, false);
  resumed.$('#next-without-multiples').click();
  assert.equal(resumed.session().hints, 0);
  assert.equal(resumed.session().multiples, undefined);
  assert(!resumed.w.location.search.includes('multiples'));
  assert.equal(resumed.$('#multiples-builder').hidden, true);
  assert.notEqual(resumed.session().task.dividend, '864');
});
test('three distinct unassisted guided examples recommend the next topic and harder repeat practice', t => {
  const f = open(t, '#oneDigit');
  for (let i = 0; i < 3; i++) { complete(f); if (i < 2) f.$('#next-example').click(); }
  assert.match(f.$('#division-recommendation').textContent, /Есть 3 разных/);
  assert.match(f.$('#topic-progress').textContent, /без подсказок: 3/);
  assert.equal(new Set(f.state().records.map(r => r.task.dividend + ':' + r.task.divisor)).size, 3);
  f.$('#next-example').click();
  assert.equal(f.plan().quotient.length, 3, 'next practice band is longer');
  f.w.document.dispatchEvent(new f.w.CustomEvent('mathexam:skill-support', {cancelable:true, detail:{skill:'subtract'}}));
  assert.equal(f.session().hints, 1);
  const resumed = open(t, '#oneDigit', f.saved());
  assert.equal(resumed.session().hints, 1);
  assert.equal(resumed.session().task.dividend, f.session().task.dividend);
  assert.equal(resumed.$('#division-learning-route a').getAttribute('href'), '/trainers/oge-basics/multiplication-division/division-path.html');
});
test('corrupt checked multiples never erase the original saved work', t => {
  const f = open(t), saved = f.state();
  saved.sessions.twoDigit.multiples.checked[0] = true;
  saved.sessions.twoDigit.multiples.values[0] = '999';
  const raw = JSON.stringify(saved), bad = open(t, '?multiples=build#twoDigit', raw);
  assert.equal(bad.saved(), raw);
  assert.equal(bad.$('#storage-notice').hidden, false);
});

for (const change of ['dialog', 'hash']) test('multiples mode is applied immediately to a saved topic through ' + change, t => {
  const initial = open(t, '#oneDigit');
  submit(initial, initial.plan().actions[0].answer);
  const original = initial.session();
  const f = open(t, '?multiples=build#twoDigit', initial.saved());
  if (change === 'dialog') {
    f.$('#topics-open').click();
    f.$('[data-topic="oneDigit"]').click();
  } else {
    f.w.history.replaceState(null, '', '?multiples=build#oneDigit');
    f.w.dispatchEvent(new f.w.HashChangeEvent('hashchange'));
  }
  assert.equal(f.state().active, 'oneDigit');
  assert.equal(f.$('#multiples-builder').hidden, false);
  assert.equal(f.session().hints, 1);
  assert.equal(f.session().step, original.step, 'switching mode keeps the current division step');
  assert.deepEqual(f.session().answers, original.answers);
  assert.deepEqual(f.session().task, original.task);
  const resumed = open(t, '?multiples=build#oneDigit', f.saved());
  assert.equal(resumed.$('#multiples-builder').hidden, false);
  assert.equal(resumed.session().hints, 1, 'reload does not alter the support accounting');
  assert.deepEqual(resumed.session().multiples, f.session().multiples);
});
