'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(
  path.join(__dirname, '../trainers/motion-grade6/river-lab.html'), 'utf8'
);
const mathScript = source.match(/<script\s+id="river-lab-math">([\s\S]*?)<\/script>/);
assert.ok(mathScript, 'The standalone river lesson must expose its pure calculation script.');
const context = vm.createContext({});
vm.runInContext(mathScript[1], context, { timeout: 1000 });
const math = context.RiverLabMath;
assert.ok(math, 'The calculation API must be available without a browser or storage.');

// These independently calculated examples also lock the intended exercise bank.
const expectedTasks = [
  { down: 15, up: 9, gap: 6, flow: 3, own: 12 },
  { down: 18, up: 10, gap: 8, flow: 4, own: 14 },
  { down: 14, up: 10, gap: 4, flow: 2, own: 12 },
  { down: 24, up: 16, gap: 8, flow: 4, own: 20 },
  { down: 13.5, up: 8.5, gap: 5, flow: 2.5, own: 11 },
  { down: 16, up: 13, gap: 3, flow: 1.5, own: 14.5 },
  { down: 8, up: 5, gap: 3, flow: 1.5, own: 6.5 },
  { down: 10.5, up: 7.5, gap: 3, flow: 1.5, own: 9 },
  { down: 19.5, up: 14.5, gap: 5, flow: 2.5, own: 17 },
  { down: 12, up: 11, gap: 1, flow: 0.5, own: 11.5 },
];

test('the introductory example has two distinct equal speed intervals', () => {
  const speeds = math.speeds(12, 3);
  assert.equal(speeds.up, 9);
  assert.equal(speeds.own, 12);
  assert.equal(speeds.down, 15);
  assert.equal(speeds.gap, 6);
  assert.equal(speeds.own - speeds.up, 3);
  assert.equal(speeds.down - speeds.own, 3);
  assert.equal(math.check(expectedTasks[0], 'flow', '6').kind, 'double');
  assert.equal(math.check(expectedTasks[0], 'flow', '3').ok, true);
});

test('all 250 slider settings have a positive upstream speed and recover the same boat and current', () => {
  let checked = 0;
  for (let own = 6; own <= 18; own += 0.5) {
    for (let flow = 0.5; flow <= 5; flow += 0.5) {
      const speeds = math.speeds(own, flow);
      const label = `own=${own}, current=${flow}`;
      assert.ok(speeds.up > 0, label);
      assert.ok(speeds.up < own && own < speeds.down, label);
      assert.equal((speeds.down + speeds.up) / 2, own, label);
      assert.equal((speeds.down - speeds.up) / 2, flow, label);
      assert.equal(own - speeds.up, speeds.down - own, label);
      assert.equal(speeds.gap, speeds.down - speeds.up, label);

      // After two hours, adding/removing the water's displacement must
      // recover the distance this same boat covers in still water.
      assert.equal(speeds.up * 2 + flow * 2, own * 2, label);
      assert.equal(speeds.down * 2 - flow * 2, own * 2, label);
      checked += 1;
    }
  }
  assert.equal(checked, 250);
});

test('changing only the boat speed leaves the two-current difference unchanged', () => {
  for (let flow = 0.5; flow <= 5; flow += 0.5) {
    const slow = math.speeds(6, flow);
    const fast = math.speeds(18, flow);
    assert.equal(fast.gap, slow.gap);
    assert.equal(fast.up - slow.up, 12);
    assert.equal(fast.down - slow.down, 12);
  }
});

test('increasing the current raises one bank-relative speed and lowers the other equally', () => {
  const before = math.speeds(12, 3);
  const after = math.speeds(12, 4);
  assert.equal(after.down - before.down, 1);
  assert.equal(before.up - after.up, 1);
  assert.equal(after.gap - before.gap, 2);
  assert.equal(after.own, before.own);
});

test('models outside the nonzero, traversable-current lesson are rejected', () => {
  for (const args of [[12, 0], [3, 3], [2, 3], [12, -1], [0, 1], [-12, 3], [Infinity, 2], [12, NaN]]) {
    assert.throws(() => math.speeds(...args), { name: 'RangeError' });
  }
});

test('every exercise accepts both correct steps and distinguishes the named misconceptions', async (t) => {
  assert.equal(math.tasks.length, expectedTasks.length);
  for (let index = 0; index < expectedTasks.length; index += 1) {
    const expected = expectedTasks[index];
    await t.test(`exercise ${index + 1}: ${expected.down} and ${expected.up}`, () => {
      const task = math.tasks[index];
      assert.equal(task.down, expected.down);
      assert.equal(task.up, expected.up);
      assert.equal(math.check(task, 'gap', String(expected.gap)).ok, true);
      assert.equal(math.check(task, 'flow', String(expected.flow)).ok, true);
      assert.equal(math.check(task, 'flow', String(expected.flow).replace('.', ',')).ok, true);
      assert.equal(math.check(task, 'flow', `${expected.gap}/2`).ok, true);

      assert.equal(math.check(task, 'flow', String(expected.gap)).kind, 'double');
      assert.equal(math.check(task, 'flow', String(expected.own)).kind, 'own');
      assert.equal(math.check(task, 'flow', String(expected.down + expected.up)).kind, 'sum');
      assert.equal(math.check(task, 'gap', String(expected.flow)).kind, 'half');
      assert.equal(math.check(task, 'gap', String(-expected.gap)).kind, 'negative');
      assert.equal(math.check(task, 'flow', '0').ok, false);
    });
  }
});

test('decimal commas, decimal points and elementary fractions represent the same values', () => {
  const examples = [
    ['2,5', 2.5], ['2.5', 2.5], [' 2,5 ', 2.5], ['5/2', 2.5],
    [' 1 / 2 ', 0.5], ['0,5', 0.5], ['.5', 0.5], ['1,5/3', 0.5],
    ['3', 3], ['+3', 3], ['-1,5', -1.5], ['0', 0],
  ];
  for (const [input, expected] of examples) assert.equal(math.parse(input), expected, input);
  assert.equal(math.check(math.tasks[4], 'flow', '5/2').ok, true);
  assert.equal(math.check(math.tasks[9], 'flow', '1 / 2').ok, true);
});

test('empty answers, text, expressions and undefined fractions cannot complete a step', () => {
  const invalid = ['', '   ', 'abc', '3 км/ч', '1/0', '0/0', '1/2/3', '2,5,0', '1+2', 'Infinity', 'NaN', '1e4', '<img src=x>'];
  for (const input of invalid) {
    assert.ok(Number.isNaN(math.parse(input)), input);
    for (const field of ['gap', 'flow']) {
      const result = math.check(math.tasks[0], field, input);
      assert.equal(result.ok, false, input);
      assert.equal(result.kind, 'format', input);
    }
  }
});
