'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const State = require('../ege-profil/start/state.js');
const lessons = ['geometry', 'algebra', 'stereo', 'probability', 'equations', 'functions', 'applied']
  .flatMap(name => require('../ege-profil/start/' + name + '-data.js'));
const lesson = lessons.find(l => l.id === 'vec-coordinates');

function memory(initial) {
  const values = new Map([['legacy-other-course', 'untouched']]);
  if (initial !== undefined) values.set(State.KEY, typeof initial === 'string' ? initial : JSON.stringify(initial));
  return { values, getItem(key) { return values.get(key) || null; }, setItem(key, value) { values.set(key, value); } };
}
function snapshot(storage) { return JSON.parse(storage.getItem(State.KEY)); }

test('every lesson offers a supported plan without consuming unseen independent task conditions', () => {
  for (const l of lessons) {
    const storage = memory(), state = State.create(lessons, storage);
    const training = new Set(l.tasks.slice(0, -3).map(t => t.id));
    const reserved = new Set(l.tasks.slice(-3).map(t => t.id));
    for (let i = 0; i < training.size + 1; i++) {
      const plan = state.start(l.id, 'plan', true);
      assert.ok(training.has(plan.taskId), l.id + ': plans use training tasks');
      assert.equal(plan.assisted, true); state.finish(l.id, 'plan', plan);
      assert.equal(state.record(l.id).independent.length, 0, l.id + ': support is not independent mastery');
    }
    const independent = state.start(l.id, 'independent', true);
    assert.ok(reserved.has(independent.taskId)); assert.equal(independent.familiar, false);
    assert.equal(independent.assisted, false);
    assert.equal(storage.getItem('legacy-other-course'), 'untouched');
  }
});

test('direct persist and reload preserve the plan, draft, submitted steps and assistance flags', () => {
  const storage = memory(); let state = State.create(lessons, storage);
  const plan = state.start(lesson.id, 'plan');
  Object.assign(plan, { step: 1, answers: ['−3/5'], draft: '0,75', wrong: true, assisted: true });
  assert.equal(state.persist(), true);
  const stored = snapshot(storage).sessions[lesson.id + ':plan'];
  assert.deepEqual(stored, plan);
  state = State.create(lessons, storage);
  assert.deepEqual(state.start(lesson.id, 'plan'), stored);
  assert.equal(state.record(lesson.id).attempts, 0, 'saving partial work is not completion');
  const continued = state.start(lesson.id, 'plan');
  state.finish(lesson.id, 'plan', continued); state.finish(lesson.id, 'plan', continued);
  assert.equal(state.record(lesson.id).attempts, 1, 'a resumed completion is registered once');
  assert.equal(state.record(lesson.id).independent.length, 0);
});

test('remediation keeps the same difficult condition, records help and resumes the accumulated steps', () => {
  const storage = memory(); let state = State.create(lessons, storage);
  const original = state.start(lesson.id, 'independent');
  const plan = state.start(lesson.id, 'plan'); plan.draft = 'свой черновик';
  const supported = state.remediate(lesson.id, original.taskId);
  assert.equal(supported.taskId, original.taskId); assert.equal(supported.assisted, true);
  assert.equal(original.assisted, true, 'a retry after help cannot be credited as independent');
  Object.assign(supported, { step: 1, answers: ['8'], draft: '−6' }); state.persist();
  assert.equal(state.remediate(lesson.id, original.taskId), supported, 'reopening help does not erase prior steps');
  assert.equal(supported.step, 1); assert.deepEqual(supported.answers, ['8']); assert.equal(supported.draft, '−6');
  state = State.create(lessons, storage);
  const restored = state.start(lesson.id, 'guided');
  assert.equal(restored.taskId, original.taskId); assert.equal(restored.step, 1); assert.equal(restored.draft, '−6');
  assert.equal(state.start(lesson.id, 'plan').draft, 'свой черновик', 'plan and remediation have separate resumable sessions');
  state.finish(lesson.id, 'guided', restored);
  const originalRestored = state.start(lesson.id, 'independent'); state.finish(lesson.id, 'independent', originalRestored);
  assert.ok(state.record(lesson.id).guided.includes(original.taskId));
  assert.deepEqual(state.record(lesson.id).independent, []);
  const next = state.start(lesson.id, 'independent', true);
  assert.notEqual(next.taskId, original.taskId); assert.equal(next.familiar, false);
});

test('repeating a previously explained reserved task never becomes unseen independent credit', () => {
  const storage = memory(), state = State.create(lessons, storage);
  const explained = state.start(lesson.id, 'independent');
  state.finish(lesson.id, 'guided', state.remediate(lesson.id, explained.taskId));
  state.finish(lesson.id, 'independent', explained);
  for (let i = 0; i < 2; i++) state.finish(lesson.id, 'independent', state.start(lesson.id, 'independent', true));
  assert.equal(state.record(lesson.id).independent.length, 2);
  for (let i = 0; i < 6; i++) {
    const repeat = state.start(lesson.id, 'independent', true);
    assert.equal(repeat.familiar, true); state.finish(lesson.id, 'independent', repeat);
  }
  assert.equal(state.record(lesson.id).independent.length, 2);
  assert.ok(!state.record(lesson.id).independent.includes(explained.taskId));
});

test('a stale second tab preserves remediation successes from the last three reserved tasks', () => {
  const storage = memory(), tabA = State.create(lessons, storage), tabB = State.create(lessons, storage);
  const reserved = lesson.tasks.slice(-3);
  for (const task of reserved) tabA.finish(lesson.id, 'guided', tabA.remediate(lesson.id, task.id));
  const otherLesson = lessons.find(l => l.id !== lesson.id);
  tabB.start(otherLesson.id, 'plan'); tabB.persist();
  const saved = snapshot(storage).records[lesson.id];
  assert.deepEqual(new Set(saved.guided), new Set(reserved.map(t => t.id)), 'stale tab must preserve successful supported retries');
  assert.deepEqual(saved.independent, [], 'merging a supported retry must not promote it to independent mastery');
  assert.equal(saved.attempts, 3);
  const reloaded = State.create(lessons, storage);
  assert.deepEqual(new Set(reloaded.record(lesson.id).guided), new Set(reserved.map(t => t.id)));
});

test('old version-one progress remains readable and can coexist with new plan sessions', () => {
  const guidedTask = lesson.tasks[0], independentTask = lesson.tasks.at(-1);
  const oldSession = { taskId: guidedTask.id, step: 1, wrong: false, assisted: true, familiar: false, done: false,
    draft: '−2,5', answers: ['8'], started: '2026-10-01T08:00:00.000Z', registered: false };
  const storage = memory({ version: 1, records: { [lesson.id]: { guided: [guidedTask.id], independent: [independentTask.id], attempts: 5 } },
    seen: { [guidedTask.id]: 2, [independentTask.id]: 1 }, sessions: { [lesson.id + ':guided']: oldSession } });
  const state = State.create(lessons, storage);
  assert.equal(state.warning, ''); assert.deepEqual(state.start(lesson.id, 'guided'), oldSession);
  state.start(lesson.id, 'plan'); state.persist();
  const saved = snapshot(storage);
  assert.equal(saved.version, 1); assert.deepEqual(saved.sessions[lesson.id + ':guided'], oldSession);
  assert.deepEqual(saved.records[lesson.id], { guided: [guidedTask.id], independent: [independentTask.id], attempts: 5 });
  assert.ok(saved.sessions[lesson.id + ':plan']);
});

test('cross-tab merging accepts only known tasks and keeps independent credit confined to reserved tasks', () => {
  const storage = memory(), state = State.create(lessons, storage);
  const trainingId = lesson.tasks[0].id, reservedId = lesson.tasks.at(-1).id;
  storage.setItem(State.KEY, JSON.stringify({ version: 1, records: { [lesson.id]: {
    guided: [trainingId, reservedId, 'unknown-task'], independent: [trainingId, reservedId, 'unknown-task'], attempts: 2
  } }, seen: {}, sessions: {} }));
  assert.equal(state.persist(), true);
  assert.deepEqual(new Set(state.record(lesson.id).guided), new Set([trainingId, reservedId]));
  assert.deepEqual(state.record(lesson.id).independent, [reservedId]);
});

test('new plan work cannot overwrite corrupt or future-version progress', () => {
  for (const original of ['{broken', JSON.stringify({ version: 2, records: {}, seen: {}, sessions: {}, future: true })]) {
    const storage = memory(original), state = State.create(lessons, storage);
    const plan = state.start(lesson.id, 'plan'); plan.draft = '1/2'; state.persist(); state.finish(lesson.id, 'plan', plan);
    assert.ok(state.warning); assert.equal(storage.getItem(State.KEY), original);
    assert.equal(state.original, original); assert.equal(state.export().sessions[lesson.id + ':plan'].draft, '1/2');
  }
});

test('an idle tab preserves another tab’s partial sessions, answers and draft', () => {
  const storage = memory(), tabA = State.create(lessons, storage), idle = State.create(lessons, storage);
  const active = tabA.start(lesson.id, 'guided');
  Object.assign(active, { step: 1, answers: ['8'], draft: '−6' }); tabA.persist();
  idle.persist();
  const saved = snapshot(storage).sessions[lesson.id + ':guided'];
  assert.equal(saved.taskId, active.taskId); assert.equal(saved.started, active.started);
  assert.equal(saved.step, 1); assert.deepEqual(saved.answers, ['8']); assert.equal(saved.draft, '−6');
  assert.deepEqual(idle.start(lesson.id, 'guided'), saved);
});

test('help opened in another tab is merged before a stale tab awards independent credit', () => {
  const storage = memory(), tabA = State.create(lessons, storage);
  const active = tabA.start(lesson.id, 'independent'), tabB = State.create(lessons, storage);
  tabB.remediate(lesson.id, active.taskId);
  active.answers = ['2'];
  assert.equal(tabA.finish(lesson.id, 'independent', active), true);
  assert.equal(active.assisted, true, 'help flag reaches the object held by the caller');
  assert.deepEqual(tabA.record(lesson.id).independent, []);
  const saved = snapshot(storage).sessions[lesson.id + ':independent'];
  assert.equal(saved.assisted, true); assert.equal(saved.registered, true);
});

test('wrong answers and assistance are monotonic across same-attempt tab saves', () => {
  for (const flag of ['wrong', 'assisted']) {
    const storage = memory(), tabA = State.create(lessons, storage);
    const active = tabA.start(lesson.id, 'independent'), tabB = State.create(lessons, storage);
    const other = tabB.start(lesson.id, 'independent'); other[flag] = true; tabB.persist();
    active[flag] = false; tabA.persist();
    assert.equal(active[flag], true); assert.equal(snapshot(storage).sessions[lesson.id + ':independent'][flag], true);
    active.answers = ['2']; tabA.finish(lesson.id, 'independent', active);
    assert.deepEqual(tabA.record(lesson.id).independent, []);
  }
});

test('persist preserves remote progress without silently moving the active screen cursor', () => {
  const storage = memory(), tabA = State.create(lessons, storage);
  const active = tabA.start(lesson.id, 'guided'), tabB = State.create(lessons, storage);
  const other = tabB.start(lesson.id, 'guided');
  Object.assign(other, { step: 1, answers: ['8'], draft: '−6' }); tabB.persist();
  active.draft = 'old-screen input'; tabA.persist();
  assert.equal(active.step, 0, 'the currently displayed question must not change during typing');
  assert.deepEqual(active.answers, []); assert.equal(active.draft, 'old-screen input');
  const saved = snapshot(storage).sessions[lesson.id + ':guided'];
  assert.equal(saved.step, 1); assert.deepEqual(saved.answers, ['8']); assert.equal(saved.draft, '−6');
  const refreshed = tabA.start(lesson.id, 'guided');
  assert.equal(refreshed, active, 'an explicit render refresh preserves the same-attempt reference');
  assert.equal(refreshed.step, 1); assert.deepEqual(refreshed.answers, ['8']); assert.equal(refreshed.draft, '−6');
});

test('unchanged stale drafts cannot erase newer drafts; a genuine local edit wins a same-step conflict', () => {
  const storage = memory(), tabA = State.create(lessons, storage);
  const active = tabA.start(lesson.id, 'plan'), tabB = State.create(lessons, storage);
  const other = tabB.start(lesson.id, 'plan'); other.draft = '1/2'; tabB.persist(); tabA.persist();
  assert.equal(snapshot(storage).sessions[lesson.id + ':plan'].draft, '1/2');
  assert.equal(tabA.start(lesson.id, 'plan').draft, '1/2');
  other.draft = '3/4'; tabB.persist(); tabA.persist();
  assert.equal(snapshot(storage).sessions[lesson.id + ':plan'].draft, '3/4', 'refresh itself is not a local draft edit');
  active.draft = '5/8'; tabA.persist();
  assert.equal(snapshot(storage).sessions[lesson.id + ':plan'].draft, '5/8');
});

test('a newer attempt survives a stale finish, including when it repeats the same task ID', () => {
  const storage = memory(), tabA = State.create(lessons, storage);
  const old = tabA.start(lesson.id, 'independent'), oldIdentity = { taskId: old.taskId, started: old.started };
  const tabB = State.create(lessons, storage);
  let newer;
  for (let i = 0; i < 3; i++) newer = tabB.start(lesson.id, 'independent', true);
  assert.equal(newer.taskId, old.taskId); assert.notEqual(newer.started, old.started);
  newer.draft = 'new attempt'; tabB.persist();
  old.answers = ['2']; assert.equal(tabA.finish(lesson.id, 'independent', old), false);
  assert.deepEqual({ taskId: old.taskId, started: old.started }, oldIdentity, 'old held reference must not be retargeted');
  const saved = snapshot(storage).sessions[lesson.id + ':independent'];
  assert.equal(saved.started, newer.started); assert.equal(saved.draft, 'new attempt');
  assert.equal(saved.done, false); assert.equal(saved.registered, false);
  assert.equal(snapshot(storage).records[lesson.id]?.independent.length || 0, 0);
});

test('same-attempt completion from two tabs is registered once', () => {
  const storage = memory(), tabA = State.create(lessons, storage);
  const active = tabA.start(lesson.id, 'independent'), tabB = State.create(lessons, storage);
  const other = tabB.start(lesson.id, 'independent');
  active.answers = ['2']; tabA.finish(lesson.id, 'independent', active);
  other.answers = ['2']; assert.equal(tabB.finish(lesson.id, 'independent', other), false);
  assert.equal(tabB.record(lesson.id).attempts, 1); assert.deepEqual(tabB.record(lesson.id).independent, [active.taskId]);
});

test('remediation after an accepted answer preserves the already earned independent result', () => {
  const storage = memory(), tabA = State.create(lessons, storage);
  const accepted = tabA.start(lesson.id, 'independent'), tabB = State.create(lessons, storage);
  accepted.answers = ['2']; tabA.finish(lesson.id, 'independent', accepted);
  tabB.remediate(lesson.id, accepted.taskId); tabA.persist();
  assert.deepEqual(snapshot(storage).records[lesson.id].independent, [accepted.taskId]);
  assert.equal(snapshot(storage).sessions[lesson.id + ':independent'].assisted, false);
});

test('a failed write retains the unsaved attempt for export even if another tab advances', () => {
  const storage = memory(), originalSet = storage.setItem.bind(storage); let fail = false;
  storage.setItem = (key, value) => { if (fail) throw Error('quota exceeded'); originalSet(key, value); };
  const tabA = State.create(lessons, storage), active = tabA.start(lesson.id, 'independent');
  const tabB = State.create(lessons, storage);
  active.answers = ['2']; active.draft = 'my accepted work';
  fail = true; assert.equal(tabA.persist(), false); assert.ok(tabA.warning);
  fail = false;
  const newer = tabB.start(lesson.id, 'independent', true); newer.draft = 'other tab'; tabB.persist();
  const diskBefore = storage.getItem(State.KEY);
  assert.equal(tabA.persist(), false, 'failed-write state remains local until its work is backed up');
  assert.equal(storage.getItem(State.KEY), diskBefore, 'the blocked tab does not replace newer saved work');
  const exported = tabA.export().sessions[lesson.id + ':independent'];
  assert.equal(exported.taskId, active.taskId); assert.equal(exported.started, active.started);
  assert.deepEqual(exported.answers, ['2']); assert.equal(exported.draft, 'my accepted work');
  assert.notEqual(exported.started, newer.started);
});
