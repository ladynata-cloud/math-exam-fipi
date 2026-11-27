'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const math = require('../../courses/vilenkin-6-part-1/textbook-math');
const units = require('../../courses/vilenkin-6-part-1/textbook-data/units-D.json').filter(u => u.id >= 18 && u.id <= 21);
const makeCore = require('./core');
const workshop = require('./corridor');
const core = makeCore(units, math, workshop);
const submit = (state, answer) => core.change(core.change(state, 'input', answer), 'check');

test('guided ratio workshop and independent transfer accept independently worked keys', () => {
  const answers = [
    ['2', '144'],
    ['2', '1', '12', '4', '72'],
    ['2', '3', '6;9', '2', ',', '12', '2.4', '7,2'],
    ['20;30', '6;9', '10', '72;3', '24', '7.2'],
    ['14;5.6'],
    ['80:4=x:7', '140', '20;20']
  ];
  let state = core.initial();
  workshop.tasks.forEach((task, index) => {
    state = core.change(state, 'task', task.id);
    if (task.role === 'transfer') assert.throws(() => core.change(state, 'mode', 'guided'));
    for (const answer of answers[index]) {
      const previousStep = core.current(state).work.step;
      state = submit(state, 'не число');
      assert.equal(core.current(state).work.step, previousStep);
      state = submit(state, answer);
      assert.equal(core.current(state).work.feedback, 'correct', task.id);
    }
    assert.equal(core.current(state).work.complete, true, task.id);
  });
});

test('a pupil can revise a bound, observe a contradiction and correct a misplaced comma', () => {
  let state = core.initial('ratio-division-tenths');
  state = submit(submit(state, '2'), '3');
  state = core.change(state, 'back');
  state = submit(state, '4');
  assert.equal(core.current(state).work.feedback, 'wrong');
  for (const answer of ['3','6;9','2',',','12']) state = submit(state, answer);
  state = submit(state, '24,0');
  assert.equal(core.current(state).work.feedback, 'wrong');
  state = submit(state, '2,4');
  assert.equal(core.current(state).work.feedback, 'correct');
  assert.deepEqual(core.normalize(JSON.parse(JSON.stringify(state))), state);
});

test('historical snapshots, navigation into workshop cards and the 64 KiB board budget', () => {
  const legacy = makeCore(units, math);
  const old = legacy.change(legacy.initial(), 'notes', 'Работаем вместе');
  assert.deepEqual(core.normalize(old), old);
  let state = old;
  for (const task of workshop.tasks) state = core.change(state,'task',task.id);
  state = core.change(state, 'task', old.taskId);
  assert.equal(core.current(state).work.notes, 'Работаем вместе');
  for(const work of Object.values(state.works)) {
    work.answers.fill('界'.repeat(90));
    work.final = '界'.repeat(90);
    work.notes = '界'.repeat(120);
    work.wrong.fill(10000);
    work.hints.fill(true);
  }
  assert.ok(Buffer.byteLength(JSON.stringify(core.normalize(state))) <= 65536);
});

test('an equation must model the two purchases and can use either orientation or equivalent ratios', () => {
  const start = core.initial('ratio-equation-build');
  for(const equation of [
    '80 : 4 = х : 7', 'x/7=80/4', '4/80=7/x', '7/x=4/80',
    '80/x=4/7', '4/7=80/x', 'x/80=7/4', '7/4=x/80',
    '20:1 = x:7', '1,75:1 = x:80', '7∶Х=1∶20'
  ]) {
    const checked = submit(start, equation);
    assert.equal(core.current(checked).work.step, 1, equation);
    assert.deepEqual(core.normalize(checked), checked);
  }
  for(const bad of ['80:4=7:x','x:4=80:7','80:0=x:7','80:4=7:0','x=140','140','4*x=560','x:x=7:7','1:1=x:140','x:7=20:1=80:4']) {
    assert.equal(core.current(submit(start,bad)).work.step, 0, bad);
  }
  assert.throws(() => core.change(start,'mode','independent'));
  const wrong = core.clone(submit(start, '80:4=x:7'));
  wrong.works[start.taskId].answers[0]='80:4=7:x';
  assert.throws(() => core.normalize(wrong));
});
