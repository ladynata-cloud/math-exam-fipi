'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const math = require('./math.js');
const adapter = require('./board-session.js');
const readData = (name, property) => {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, name), 'utf8'), sandbox);
  return JSON.parse(JSON.stringify(sandbox.window[property]));
};
const lessons = readData('data.js', 'PetersonCourse').lessons;
const topics = readData('workshop-data.js', 'PetersonWorkshopData').topics;
const session = adapter.create({ lessons, topics, math });
const copy = value => JSON.parse(JSON.stringify(value));
const legacy = () => session.blankLegacy();
const workshop = () => session.blankWorkshop();
const pack = (route, old = legacy(), modern = workshop(), view = session.blankView()) => session.pack({ route, legacy: old, workshop: modern, view });
const topic = id => topics.find(item => item.id === id);

test('fixed identity and strict routes cover all actual course scenes', () => {
  assert.equal(adapter.id, 'peterson5');
  assert.equal(adapter.path, '/trainers/peterson5.html');
  assert.equal(adapter.marker, 'parts1-2');
  for (const route of ['#home', '#topics', '#skills', '#progress']) assert(session.validRoute(route));
  for (const lesson of lessons) {
    assert(session.validRoute('#lesson/' + lesson.id));
    lesson.tasks.forEach((_, i) => assert(session.validRoute('#lesson/' + lesson.id + '/' + i)));
    assert.equal(session.validRoute('#lesson/' + lesson.id + '/' + lesson.tasks.length), false);
    for (const stage of ['discover', 'practice', 'check']) assert(session.validRoute('#topic/' + lesson.id + '/' + stage));
    for (const i of [0, 1]) assert(session.validRoute('#topic/' + lesson.id + '/practice/' + i));
  }
  for (const skill of math.skills) for (const level of [1, 2, 3]) assert(session.validRoute('#practice/' + skill.id + '/' + level));
  for (const route of ['', '#topic/p00/discover', '#topic/p44/check', '#topic/p01/check/1', '#topic/p01/discover/0',
    '#topic/p01/practice/2', '#topic/p01/practice/01', '#lesson/p01/01', '#lesson/p01/-1', '#home/extra',
    '#practice/unknown/1', '#practice/natural-order/4', '#topic/p01/discover\n', '#lesson/p01/0\n', 'javascript:alert(1)'])
    assert.equal(session.validRoute(route), false, route);
});

test('all 131 legacy scenes project only their real current task', () => {
  let count = 0;
  for (const lesson of lessons) lesson.tasks.forEach((task, i) => {
    const value = pack('#lesson/' + lesson.id + '/' + i);
    assert.equal(session.validateState(value), true, task.id);
    assert.deepEqual(Object.keys(value.legacy.tasks), [task.id]);
    assert.equal(value.workshop, null);
    assert.equal(value.legacy.tasks[task.id].independent, false);
    count++;
  });
  assert.equal(count, 131);
});

test('all authored workshop scenes and real arithmetic seeds round trip', () => {
  for (const t of topics) for (const stage of ['discover', 'practice/0', 'practice/1', 'check']) {
    const value = pack('#topic/' + t.id + '/' + stage);
    assert.equal(session.validateState(value), true, t.id + ' ' + stage);
    assert.deepEqual(session.pack(session.unpack(value)), value);
    assert.equal(value.legacy, null);
  }
  for (const skill of math.skills) for (const level of [1, 2, 3]) {
    const old = legacy(), key = skill.id + ':' + level;
    old.practice[key] = { seed: 17 };
    const value = pack('#practice/' + skill.id + '/' + level, old);
    assert.equal(session.validateState(value), true, key);
    assert.deepEqual(Object.keys(value.legacy.tasks), ['practice:' + key + ':17']);
    assert.deepEqual(value.legacy.practice, { [key]: { seed: 17 } });
  }
});

test('unrelated work and personal checkpoint results never enter the shared scene', () => {
  const old = legacy(), modern = workshop(), current = topic('p01').discovery, hidden = topic('p02').discovery;
  old.tasks['p02-t01'] = { value: '99', note: 'UNRELATED_OLD_WORK' };
  modern.entries[current.id] = { value: current.choices[0], note: 'Общее рассуждение' };
  modern.entries[hidden.id] = { value: '123', note: 'UNRELATED_NEW_WORK' };
  modern.checks.p02 = { answers: { [topic('p02').check[0].id]: '777' }, drafts: {}, aided: false };
  modern.models.p02 = { trial: 42 };
  const before = copy({ old, modern }), value = pack('#topic/p01/discover', old, modern), wire = JSON.stringify(value);
  assert.equal(wire.includes('UNRELATED'), false);
  assert.equal(wire.includes('777'), false);
  assert.deepEqual(Object.keys(value.workshop.entries), [current.id]);
  assert.deepEqual(Object.keys(value.workshop.models), ['p01']);
  assert.deepEqual(value.workshop.checks, {});
  assert.deepEqual({ old, modern }, before, 'projection must not mutate personal runtime input');
  for (const route of ['#home', '#topics', '#skills', '#progress']) {
    const navigation = pack(route, old, modern);
    assert.equal(navigation.legacy, null); assert.equal(navigation.workshop, null);
    assert.equal(JSON.stringify(navigation).includes('UNRELATED'), false);
  }
});

test('completed work remains a shared explanation and never gives independent credit', () => {
  const old = legacy(), task = lessons.find(item => item.id === 'p02').tasks[0];
  old.tasks[task.id] = { value: task.answer, values: [], step: 0, attempts: 1, correct: true,
    independent: true, assisted: false, completion: { attempts: 1, assisted: false, independent: true } };
  const value = pack('#lesson/p02/0', old), restored = session.unpack(value).legacy.tasks[task.id];
  assert.equal(restored.correct, true);
  assert.equal(restored.independent, false);
  assert.equal(restored.assisted, true);
  assert.deepEqual(restored.completion, { attempts: 1, assisted: true, independent: false });
  const forged = copy(value); forged.legacy.tasks[task.id].independent = true;
  assert.equal(session.validateState(forged), false);
  const modern = workshop(), q = topic('p01').discovery;
  modern.entries[q.id] = { value: q.answer, first: q.answer, attempts: 1, accepted: true, aided: false,
    completion: { first: q.answer, attempts: 1, aided: false } };
  const result = pack('#topic/p01/discover', legacy(), modern).workshop.entries[q.id];
  assert.equal(result.accepted, true); assert.equal(result.aided, true); assert.equal(result.completion.aided, true);
});

test('only current checkpoint answers and its next draft travel, always aided', () => {
  const modern = workshop(), t = topic('p06');
  modern.checks[t.id] = { answers: { [t.check[0].id]: t.check[0].answer },
    drafts: { [t.check[1].id]: '20 25', [t.check[2].id]: 'PRIVATE_FUTURE_DRAFT' }, aided: false };
  const value = pack('#topic/p06/check', legacy(), modern);
  assert.equal(session.validateState(value), true);
  assert.deepEqual(value.workshop.checks.p06, { answers: { [t.check[0].id]: t.check[0].answer }, drafts: { [t.check[1].id]: '20 25' }, aided: true });
  assert.equal(JSON.stringify(value).includes('PRIVATE_FUTURE_DRAFT'), false);
  const skipped = workshop(); skipped.checks.p06 = { answers: { [t.check[1].id]: t.check[1].answer }, drafts: {}, aided: true };
  assert.throws(() => pack('#topic/p06/check', legacy(), skipped), /sequence/);
});

test('earned intermediate answers, first errors and model controls survive current scene projection', () => {
  const modern = workshop(), t = topic('p06'), q = t.discovery;
  modern.entries[q.id] = { value: '22 27', attempts: 1, first: '22 27', firstWrong: '22 27', step: 1,
    stepValues: [q.steps[0].answer, '2'], showSteps: true, modelOpen: true, note: 'Сначала фиксирую десятки' };
  modern.models.p06 = { shown: 2, open: true };
  const value = pack('#topic/p06/discover', legacy(), modern);
  assert.equal(session.validateState(value), true);
  assert.equal(value.workshop.entries[q.id].step, 1);
  assert.equal(value.workshop.entries[q.id].firstWrong, '22 27');
  assert.deepEqual(value.workshop.models.p06, { shown: 2, open: true });
  const forged = copy(value); forged.workshop.entries[q.id].stepValues[0] = '999';
  assert.equal(session.validateState(forged), false);
  const old = legacy(), task = lessons.find(item => item.id === 'p02').tasks[0];
  old.tasks[task.id] = { value: '8', firstErrors: { final: { value: '8', assisted: false }, steps: {} } };
  const legacyValue = pack('#lesson/p02/0', old);
  assert.deepEqual(legacyValue.legacy.tasks[task.id].firstErrors.final, { value: '8', assisted: true });
});

test('forged claims, out-of-scene records and unsupported structure fail closed', () => {
  const initial = pack('#topic/p01/discover'), q = topic('p01').discovery;
  const mutations = [
    s => { s.extra = 1; },
    s => { s.route = '#topic/p44/discover'; },
    s => { s.workshop.entries[q.id].accepted = true; },
    s => { s.workshop.entries[q.id].aided = false; },
    s => { s.workshop.entries[q.id].note = '<img src=x onerror=alert(1)>'; },
    s => { s.workshop.entries[q.id].step = 99; },
    s => { s.workshop.entries[topic('p02').discovery.id] = copy(s.workshop.entries[q.id]); },
    s => { s.workshop.models.p02 = { n: 12 }; },
    s => { s.view.media.gifPlaying = 'yes'; },
    s => { s.view.filter.query = 'x'.repeat(101); },
    s => { s.legacy = legacy(); },
    s => { s.protocolVersion = 1; }
  ];
  for (const mutate of mutations) { const value = copy(initial); mutate(value); assert.equal(session.validateState(value), false, mutate.toString()); }
});

test('hostile getters, inherited JSON hooks, sparse arrays and prototype keys are not executed', () => {
  const initial = pack('#home'); let calls = 0;
  const getter = copy(initial); Object.defineProperty(getter, 'route', { enumerable: true, get() { calls++; return '#home'; } });
  assert.equal(session.validateState(getter), false); assert.equal(calls, 0);
  const jsonHook = Object.create({ toJSON() { calls++; return initial; } });
  Object.assign(jsonHook, initial); assert.equal(session.validateState(jsonHook), false); assert.equal(calls, 0);
  const poisoned = JSON.parse(JSON.stringify(initial)); poisoned.view.media = JSON.parse('{"__proto__":{"polluted":true},"gifPlaying":false}');
  assert.equal(session.validateState(poisoned), false); assert.equal({}.polluted, undefined);
  const sparse = copy(initial); sparse.view.details = Array(3); assert.equal(session.validateState(sparse), false);
  const cycle = copy(initial); cycle.view.self = cycle; assert.equal(session.validateState(cycle), false);
});

test('current notes and feedback are bounded below the existing 64 KiB transport limit', () => {
  const modern = workshop(), q = topic('p01').discovery;
  modern.entries[q.id] = { value: q.answer, note: 'я'.repeat(8000) };
  const view = session.blankView(); view.status = 'я'.repeat(14000); view.media.gifPlaying = true;
  const value = pack('#topic/p01/discover', legacy(), modern, view);
  assert.equal(value.workshop.entries[q.id].note.length, 2000);
  assert.equal(value.view.status.length, 1200);
  assert.equal(value.view.media.gifPlaying, true);
  assert(Buffer.byteLength(JSON.stringify(value), 'utf8') < 64 * 1024);
  assert.equal(session.validateState(value), true);
});

test('shared model controls use the real model ranges and never silently clamp on the observer', () => {
  const modern = workshop(); modern.models.p06 = { shown: 3, open: true, n: 12, num: 2, den: 3, choice: '', iq_open: true, iq_draft: '1/' };
  const value = pack('#topic/p06/discover', legacy(), modern);
  assert.equal(session.validateState(value), true);
  for (const mutation of [model => { model.shown = 7; }, model => { model.n = 101; }, model => { model.den = 1; },
    model => { model.choice = 'sometimes'; }, model => { model.iq_open = 1; }, model => { model.unknown = 1; }]) {
    const bad = copy(value); mutation(bad.workshop.models.p06); assert.equal(session.validateState(bad), false);
  }
});

test('the adapter never uses personal storage or sends rendered HTML', () => {
  const source = fs.readFileSync(path.join(__dirname, 'board-session.js'), 'utf8');
  assert.doesNotMatch(source, /\blocalStorage\b|\bsessionStorage\b|\.innerHTML\s*=/);
});

const bridgePath = path.join(__dirname, '../../trainers/board-bridge.js');
test('the unchanged canonical bridge accepts each current-scene wire shape', { skip: !fs.existsSync(bridgePath) }, () => {
  const sandbox = { TextEncoder, URL, console, document: {}, window: null };
  sandbox.window = sandbox; vm.runInNewContext(fs.readFileSync(bridgePath, 'utf8'), sandbox);
  const samples = [pack('#home'), pack('#topic/p01/discover'), pack('#topic/p06/check'), pack('#lesson/p02/0'), pack('#practice/natural-order/1')];
  for (const value of samples) {
    sandbox.input = JSON.stringify(value);
    const result = vm.runInNewContext('MathExamBoard.validateState(JSON.parse(input))', sandbox);
    assert.equal(result.ok, true, result.code);
  }
});

