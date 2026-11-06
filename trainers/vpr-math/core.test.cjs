'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('./core.js');

const validNumbers = [
  ['0', 0], ['-0', 0], ['−3,5', -3.5], [' +12 ', 12], ['.25', .25],
  ['3/4', .75], ['-3 / 4', -.75], ['3/-4', -.75], ['1 1/2', 1.5],
  ['-1 1/2', -1.5], ['0,25/0,5', .5], ['2⁄4', .5],
];
for (const [input, expected] of validNumbers) {
  test('numeric input accepts ' + input, () => assert.equal(Core.number(input), expected));
}

const invalidNumbers = [
  '', null, undefined, [], {}, 'NaN', 'Infinity', '1e3', '2+2', 'alert(1)',
  '3/0', '0/0', '1 3/2', '3/4/5', '12 cm', '1;2', '1,2,3',
  '<img src=x onerror=alert(1)>', '1'.repeat(161),
];
for (const input of invalidNumbers) {
  test('numeric input rejects ' + String(input).slice(0, 22), () => {
    assert.equal(Core.number(input), null);
  });
}

test('equivalent fractions pass; a rounded approximation does not', () => {
  assert.equal(Core.judge({kind: 'number', value: 1 / 3}, '2/6').correct, true);
  assert.equal(Core.judge({kind: 'number', value: 1 / 3}, '0,33').correct, false);
});

test('relative tolerance cannot accept an incorrect large integer', () => {
  assert.equal(Core.judge({kind: 'number', value: 1000000000}, '1000000000,2').correct, false);
});

test('a root set is unordered, permits repeats, and requires every distinct root', () => {
  assert.equal(Core.judge({kind: 'set', values: [-2.5, 3]}, '3; −2,5').correct, true);
  assert.equal(Core.judge({kind: 'set', values: [-2, 3]}, '3;3;−2').correct, true);
  assert.equal(Core.judge({kind: 'set', values: [-2, 3]}, '3').correct, false);
  assert.equal(Core.judge({kind: 'set', values: [-2, 3]}, '-2,3').correct, false);
});

test('an ordered pair requires both components in the declared order', () => {
  const pair = {kind: 'tuple', values: [8, 15]};
  assert.equal(Core.judge(pair, '8;15').correct, true);
  assert.equal(Core.judge(pair, '15;8').correct, false);
  assert.equal(Core.judge(pair, '15').correct, false);
  assert.equal(Core.judge(pair, '8;15;15').correct, false);
  assert.equal(Core.judge({kind: 'tuple', values: [.5, -2]}, '1/2;−2').correct, true);
});

test('choice zero is a real answer; missing and string values are not choices', () => {
  assert.deepEqual(Core.judge({kind: 'choice', value: 0}, 0), {valid: true, correct: true});
  for (const input of [null, undefined, '0', -1, .5]) {
    assert.equal(Core.judge({kind: 'choice', value: 0}, input).valid, false);
  }
});

const task = {
  id: 'example-task',
  steps: [{answer: {kind: 'number', value: 1}}, {answer: {kind: 'number', value: 2}}],
};

test('restored learning state rejects skipped or falsely solved steps', () => {
  const state = Core.blank(task, 'learn');
  assert.equal(Core.validate(state, task, 'learn'), true);
  state.solved[1] = true;
  state.answers[1] = '2';
  assert.equal(Core.validate(state, task, 'learn'), false);
  state.solved[0] = true;
  state.answers[0] = '5';
  assert.equal(Core.validate(state, task, 'learn'), false);
  state.answers[0] = '1';
  assert.equal(Core.validate(state, task, 'learn'), true);
  state.mistakes[0] = -1;
  assert.equal(Core.validate(state, task, 'learn'), false);
});

test('restored state validates identity, array lengths, data types and size limits', () => {
  const mutations = [
    state => { state.taskId = 'unknown'; },
    state => { state.answers.pop(); },
    state => { state.answers[0] = {}; },
    state => { state.answers[0] = '1'.repeat(161); },
    state => { state.solved[0] = 1; },
    state => { state.notes = 'n'.repeat(10001); },
    state => { state.updated = Infinity; },
  ];
  for (const mutate of mutations) {
    const state = Core.blank(task, 'learn');
    mutate(state);
    assert.equal(Core.validate(state, task, 'learn'), false);
  }
});

test('ordinary independent practice uses only the final answer and never hints', () => {
  const state = Core.blank(task, 'solo');
  assert.equal(Core.stage(state, task), 1);
  state.solved[1] = true;
  state.answers[1] = '2';
  assert.equal(Core.done(state, task), true);
  assert.equal(Core.validate(state, task, 'solo'), true);
  state.hints[1] = true;
  assert.equal(Core.validate(state, task, 'solo'), false);
});

test('proof practice requires the complete ordered reasoning without assistance', () => {
  const proof = {...task, assessAllSteps: true};
  const state = Core.blank(proof, 'solo');
  assert.equal(Core.stage(state, proof), 0);
  state.solved[1] = true;
  state.answers[1] = '2';
  assert.equal(Core.done(state, proof), false);
  assert.equal(Core.validate(state, proof, 'solo'), false);
  state.solved[0] = true;
  state.answers[0] = '1';
  assert.equal(Core.validate(state, proof, 'solo'), true);
  assert.equal(Core.done(state, proof), true);
  state.shown[0] = true;
  assert.equal(Core.validate(state, proof, 'solo'), false);
});
