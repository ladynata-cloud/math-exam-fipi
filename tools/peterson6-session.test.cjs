'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const ROOT = resolve(__dirname, '..');
const math = require('../school/peterson6/math.js');
require('../school/peterson6/models.js');
const adapter = require('../school/peterson6/board-session.js');
const lessons = ['logic', 'arithmetic', 'percent'].flatMap(name => JSON.parse(readFileSync(resolve(ROOT, 'school/peterson6/' + name + '.json'))));
const session = adapter.create({ lessons, math, models: global.PetersonModels });
const copy = value => JSON.parse(JSON.stringify(value));
const fresh = () => ({ value: '', values: [], step: 0, guided: false, assisted: false, hint: false, stepHints: {}, reveals: {}, attempts: 0, correct: false, independent: false, note: '', feedback: '', signature: '', repeated: false, completion: null });
const blank = () => ({ version: 1, tasks: {}, practice: {}, last: null, origin: null });
const home = work => ({ route: '#home', work: work || session.pack(blank()), view: { model: null, details: [false], stepFeedback: '', number: { draft: '', submitted: null } } });
const fracTask = lessons.find(l => l.id === 'p08').tasks[0];
function entered(question) {
  if (question.kind === 'choice') return question.answer;
  if (question.answerFormat === 'decimal') return math.decimal(question.answer);
  if (question.answerFormat === 'mixed-number') {
    const q = math.parse(question.answer), whole = Math.floor(Math.abs(q.n) / q.d), rem = Math.abs(q.n) % q.d;
    return (q.n < 0 ? '-' : '') + (rem ? whole + ' ' + rem + '/' + q.d : whole);
  }
  return String(question.answer);
}
function complete(task) {
  return { ...fresh(), value: entered(task), values: task.steps.map(entered), step: task.steps.length,
    guided: !!task.steps.length, assisted: !!task.steps.length, attempts: 1, correct: true,
    completion: { attempts: 1, assisted: !!task.steps.length, independent: false } };
}
const fractionModel = () => ({ lessonId: 'p08', kind: 'fractions', a: 2, b: 3 });
function lessonSnapshot(state = blank()) {
  state.last = { hash: '#lesson/p08/0' };
  return { route: '#lesson/p08/0', work: session.pack(state), view: { model: fractionModel(), details: [false, true, false], stepFeedback: '', number: { draft: '', submitted: null } } };
}

test('fixed identity and all authored/practice routes are bounded by real course data', () => {
  assert.equal(adapter.id, 'peterson6');
  assert.equal(adapter.path, '/trainers/peterson6.html');
  assert.equal(adapter.marker, 'part1');
  for (const route of ['#home', '#skills', '#progress']) assert(session.validRoute(route));
  for (const lesson of lessons) {
    assert(session.validRoute('#lesson/' + lesson.id));
    lesson.tasks.forEach((_, i) => assert(session.validRoute('#lesson/' + lesson.id + '/' + i)));
    assert.equal(session.validRoute('#lesson/' + lesson.id + '/' + lesson.tasks.length), false);
  }
  for (const skill of math.skills) for (const level of [1, 2, 3]) assert(session.validRoute('#practice/' + skill.id + '/' + level));
  for (const route of ['', '#lesson/p00', '#lesson/p15', '#lesson/p08/01', '#lesson/p08/-1', '#lesson/p08/0/more',
    '#practice/unknown/1', '#practice/fraction-multiply/0', '#practice/fraction-multiply/4', '#practice/fraction-multiply/01',
    '#home/more', 'javascript:alert(1)', '#lesson/%7008/0', '#lesson/p08\n', '#practice/fraction-add/1\n']) assert.equal(session.validRoute(route), false, route);
});

test('224 untouched authored records disappear from the wire without changing runtime input', () => {
  const state = blank();
  for (const lesson of lessons) for (const task of lesson.tasks) state.tasks[task.id] = fresh();
  const before = copy(state), work = session.pack(state);
  assert.deepEqual(work.tasks, {});
  assert.deepEqual(state, before);
  assert(Buffer.byteLength(JSON.stringify(home(work))) < 250);
  assert.equal(session.validateState(home(work)), true);
});

test('all 224 genuine answers and earned steps validate against the actual checker', () => {
  for (const lesson of lessons) for (const task of lesson.tasks) {
    const state = blank(); state.tasks[task.id] = complete(task);
    const work = session.pack(state), restored = session.unpack(work);
    assert.equal(restored.tasks[task.id].correct, true, task.id);
    assert.equal(restored.tasks[task.id].independent, false);
    assert.equal(restored.tasks[task.id].step, task.steps.length);
    assert.deepEqual(session.pack(restored), work);
  }
});

test('transport roundtrip preserves drafts, notes, accepted steps, disclosures and detour source', () => {
  const state = blank();
  state.tasks[fracTask.id] = { ...fresh(), value: '0,86', values: ['0,5'], step: 1, guided: true, assisted: true,
    stepHints: { 0: false, 1: true }, reveals: { 1: true }, note: 'Сначала дробь в десятичную.\n0,36 + 0,5' };
  state.origin = { hash: '#lesson/p08/0', scroll: 321.5 };
  const value = lessonSnapshot(state);
  value.view.details = [true, false, true]; value.view.stepFeedback = 'wrong';
  assert.equal(session.validateState(value), true);
  const restored = session.unpack(value.work);
  assert.equal(restored.tasks[fracTask.id].note, state.tasks[fracTask.id].note);
  assert.deepEqual(restored.origin, state.origin);
  assert.deepEqual(restored.tasks[fracTask.id].values, ['0,5']);
  assert.deepEqual(session.pack(restored), value.work);
  // Invalid feedback does not invent a solved step; a visible stale wrong
  // message may legitimately remain while a learner edits the current draft.
  const done = copy(value); done.work.tasks[fracTask.id][2] = fracTask.steps.length;
  done.work.tasks[fracTask.id][1] = fracTask.steps.map(entered);
  assert.equal(session.validateState(done), false);
});

test('accepted work cannot spoof answer formats, completed steps, or independent credit', () => {
  const state = blank(); state.tasks[fracTask.id] = complete(fracTask);
  state.tasks[fracTask.id].independent = true;
  state.tasks[fracTask.id].completion.independent = true;
  const work = session.pack(state), restored = session.unpack(work);
  assert.equal(restored.tasks[fracTask.id].independent, false);
  assert.equal(restored.tasks[fracTask.id].completion.independent, false);
  for (const mutate of [
    w => { w.tasks[fracTask.id][0] = '9999'; },
    w => { w.tasks[fracTask.id][1][0] = '1/2'; }, // this step explicitly requires decimal notation
    w => { w.tasks[fracTask.id][6] = 0; },
    w => { w.tasks[fracTask.id][3] = 31; },
    w => { w.tasks[fracTask.id].push({ independent: true }); },
    w => { w.tasks[fracTask.id][8] = '<script>alert(1)</script>'; },
    w => { w.tasks[fracTask.id][8] = 'Invented assessment'; }
  ]) { const bad = copy(work); mutate(bad); assert.equal(session.validateWork(bad), false); assert.throws(() => session.unpack(bad)); }
  const changed = blank(); changed.tasks[fracTask.id] = { ...fresh(), hint: true, assisted: false };
  assert.throws(() => session.pack(changed), /Invalid/);
});

test('all 60 generated skill/level cases reconstruct source signatures and exact accepted steps', () => {
  for (const skill of math.skills) for (const level of [1, 2, 3]) {
    const id = 'practice:' + skill.id + ':' + level + ':1', task = session.resolveTask(id), state = blank();
    state.tasks[id] = complete(task); state.practice[skill.id + ':' + level] = { seed: 1 };
    state.last = { hash: '#practice/' + skill.id + '/' + level };
    const snapshot = { route: state.last.hash, work: session.pack(state), view: { model: null, details: [true], stepFeedback: '', number: { draft: '', submitted: null } } };
    assert.equal(session.validateState(snapshot), true, id);
    const restored = session.unpack(snapshot.work);
    assert.equal(restored.tasks[id].signature, task.prompt + '\u241f' + task.answer + '\u241f' + (task.answerFormat || ''));
    assert.equal(restored.tasks[id].correct, true);
    assert.equal(restored.tasks[id].independent, false);
    assert.deepEqual(session.pack(restored), snapshot.work);
  }
});

test('visited generated tasks remain in order and duplicate-condition accounting cannot be forged', () => {
  const state = blank(), seen = new Set();
  for (let seed = 1; seed <= 45; seed++) {
    const id = 'practice:fraction-to-decimal:1:' + seed, task = session.resolveTask(id);
    const sig = task.prompt + '\u241f' + task.answer + '\u241f' + (task.answerFormat || '');
    state.tasks[id] = { ...fresh(), repeated: seen.has(sig), signature: sig };
    seen.add(sig);
  }
  state.practice['fraction-to-decimal:1'] = { seed: 45 };
  const work = session.pack(state), restored = session.unpack(work);
  assert.equal(Object.keys(work.tasks).length, 45);
  assert.deepEqual(Object.keys(restored.tasks), Object.keys(state.tasks));
  assert.deepEqual(session.pack(restored), work);
  const bad = copy(work); bad.tasks['practice:fraction-to-decimal:1:1'][9] = true;
  assert.equal(session.validateWork(bad), false);
  bad.tasks['practice:fraction-to-decimal:1:1'][9] = false;
  bad.practice['fraction-to-decimal:1'] = 44;
  assert.equal(session.validateWork(bad), false);
});

test('practice routes require the precise seed record, and source/model state is lesson-bound', () => {
  const state = blank(), id = 'practice:fraction-multiply:2:7';
  state.practice['fraction-multiply:2'] = { seed: 7 }; state.tasks[id] = fresh();
  state.last = { hash: '#practice/fraction-multiply/2' };
  const value = home(session.pack(state)); value.route = '#practice/fraction-multiply/2'; value.view.details = [false];
  assert.equal(session.validateState(value), true);
  const bad = copy(value); bad.work.practice['fraction-multiply:2'] = 8;
  assert.equal(session.validateState(bad), false);
  const model = lessonSnapshot(); assert.equal(session.validateState(model), true);
  model.view.model.lessonId = 'p09'; assert.equal(session.validateState(model), false);
  model.view.model = fractionModel(); model.route = '#skills'; model.view.details = [];
  assert.equal(session.validateState(model), false);
  model.view.model = null; assert.equal(session.validateState(model), true);
});

test('number lookup and detail states remain exact and page-local', () => {
  const value = home(); value.view.number = { draft: '177', submitted: 177 };
  assert.equal(session.validateState(value), true);
  value.view.number.submitted = 'invalid'; assert.equal(session.validateState(value), true);
  value.view.number.draft = '498'; assert.equal(session.validateState(value), true);
  value.view.number.submitted = 498; assert.equal(session.validateState(value), false);
  value.view.number = { draft: '', submitted: null }; value.view.details.push(false);
  assert.equal(session.validateState(value), false);
  value.view.details = []; value.route = '#skills'; assert.equal(session.validateState(value), true);
  value.view.number.draft = '1'; assert.equal(session.validateState(value), false);
  value.view.number.draft = ''; value.view.stepFeedback = 'empty'; assert.equal(session.validateState(value), false);
  value.view.stepFeedback = ''; value.route = '#home'; value.view.details = [false];
  for (const draft of [1, '1\n', '1234', '<b>']) { value.view.number.draft = draft; assert.equal(session.validateState(value), false); }
});

test('incoming unknown keys, exotic objects, getters, sparse arrays and cycles fail before reads', () => {
  const good = home(); let getterCalls = 0;
  const getter = { ...good }; Object.defineProperty(getter, 'view', { enumerable: true, get() { getterCalls++; return good.view; } });
  assert.equal(session.validateState(getter), false); assert.equal(getterCalls, 0);
  for (const mutate of [
    v => { v.extra = false; }, v => { v.view.html = ''; },
    v => { v.work.tasks.unknown = ['', [], 0, 0, [], [], 0, '', '', false]; },
    v => { v.work.tasks = JSON.parse('{"__proto__":{}}'); },
    v => { v.work.practice = Object.create({ 'fraction-add:1': 1 }); },
    v => { v.view.details = new Array(1); }, v => { v.view.details[0] = undefined; },
    v => { v.work.last = Infinity; }, v => { v.view.number.draft = '<img>'; },
    v => { v.work.origin = { hash: 'javascript:alert(1)', scroll: 0 }; },
    v => { v.work.origin = { hash: '#lesson/p08/0', scroll: -1 }; },
    v => { v.view.model = v; }, v => { v.work.practice['fraction-add:1'] = 1000000; },
    v => { v.work.practice['unknown:1'] = 1; },
    v => { Object.defineProperty(v.view, 'secret', { value: false }); }
  ]) { const bad = copy(good); mutate(bad); assert.equal(session.validateState(bad), false); }
  assert.equal(getterCalls, 0);
});

test('size and field limits reject the whole edit rather than discarding task history', () => {
  const state = blank(); state.tasks[fracTask.id] = { ...fresh(), note: 'Я'.repeat(adapter.limits.note) };
  const good = session.pack(state); assert(session.validateWork(good));
  state.tasks[fracTask.id].note += 'Я'; assert.throws(() => session.pack(state));
  state.tasks[fracTask.id].note = ''; state.tasks[fracTask.id].value = '1'.repeat(adapter.limits.draft + 1);
  assert.throws(() => session.pack(state));
  const large = blank();
  for (const task of lessons.flatMap(l => l.tasks).slice(0, 20)) large.tasks[task.id] = { ...fresh(), note: 'Я'.repeat(adapter.limits.note) };
  const before = copy(large); assert.throws(() => session.pack(large), /oversized/);
  assert.deepEqual(large, before, 'overflow preserves input for caller-controlled rollback');
  const restored = session.unpack(good); restored.tasks[fracTask.id].note = 'changed';
  assert.equal(good.tasks[fracTask.id][7], 'Я'.repeat(adapter.limits.note), 'unpack does not leak mutable references');
});

test('details restore only to an exact set of existing controls', () => {
  const elements = [{ open: false }, { open: true }, { open: false }];
  const main = { querySelectorAll(selector) { assert.equal(selector, 'details'); return elements; } };
  assert.deepEqual(session.readDetails(main), [false, true, false]);
  session.applyDetails(main, [true, false, true]);
  assert.deepEqual(session.readDetails(main), [true, false, true]);
  assert.throws(() => session.applyDetails(main, [true]));
  assert.deepEqual(session.readDetails(main), [true, false, true]);
});
