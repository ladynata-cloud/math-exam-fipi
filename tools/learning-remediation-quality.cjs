'use strict';

const assert = require('node:assert/strict');
const bank = require('../trainers/oge-basics/learning-bank.js');
const C = require('../trainers/oge-basics/learning-contracts.js');
const clone = value => JSON.parse(JSON.stringify(value));

// Read decimal strings as exact integers with a scale; do not recalculate
// division with the production algorithm or floating point arithmetic.
function rational(value) {
  const text = String(value).replace(',', '.');
  assert(/^\d+(?:\.\d+)?$/.test(text), 'Unexpected decimal: ' + text);
  const [whole, fractional = ''] = text.split('.');
  return [BigInt(whole + fractional), 10n ** BigInt(fractional.length)];
}
let divisionTasks = 0, divisionSteps = 0;
for (const [id, make] of Object.entries(bank)) {
  if (make(1).family !== 'division') continue;
  for (let n = 0; n < 200; n++) {
    const seed = (n * 2654435761) >>> 0, task = make(seed).task;
    for (const step of task.steps) {
      assert.equal(step.partial, step.qd * task.d + step.rem, id + ': division identity');
      assert(step.rem >= 0 && step.rem < task.d, id + ': remainder bound');
      assert(Number.isInteger(step.qd) && step.qd >= 0 && step.qd <= 9, id + ': quotient digit');
      divisionSteps++;
    }
    if (task.mode === 'quotientDigit') {
      assert.equal(Number(task.expected), Math.floor(task.partial / task.d));
    } else {
      const [a, b] = task.original.split(' : ').map(rational);
      const q = rational(task.expected.split(' (')[0]);
      if (task.mode === 'remainder') {
        assert.equal(a[1], 1n); assert.equal(b[1], 1n); assert.equal(q[1], 1n);
        assert.equal(a[0], b[0] * q[0] + BigInt(task.remainder));
      } else {
        assert.equal(a[0] * b[1] * q[1], a[1] * b[0] * q[0], id + ': exact whole quotient');
      }
    }
    divisionTasks++;
  }
}

// A learner practising fraction reduction must actually provide the reduced
// form; an equivalent unreduced fraction or decimal does not show that skill.
assert(C.equal('1/2', { n: 4, d: 8 }, true));
assert(!C.equal('4/8', { n: 1, d: 2 }, true));
assert(!C.equal('0,5', { n: 1, d: 2 }, true));
assert(C.equal('2', { n: 8, d: 4 }, true));
assert(C.equal('-1/2', { n: 1, d: -2 }, true));
assert(!C.equal('1/0', { n: 1, d: 2 }, true));
for (const bad of ['0x10', '0b10000', '1.6e1', 'Infinity', 'NaN', '16abc', '', '<script>16</script>']) {
  assert(!C.equal(bad, 16), 'Nonmathematical answer grammar accepted: ' + bad);
}
assert(C.equal('16,25', 16.25));
assert(C.equal('65/4', 16.25));

const decimals = C.create('decimal-add-subtract', 1).taskSpec;
const places = decimals.lessons.find(l => l.question?.prompt.includes('двумя знаками'))?.question;
assert(places, 'Decimal place-value lesson must remain available');
assert(C.checked('8,30', places));
assert(!C.checked('8,3', places), 'A place-value exercise must check the requested two decimal places');

const down = bank['percentages/percent-change'](12345).task;
const barePercentTrap = down.traps.find(t => Number(t.v) === 170);
assert(barePercentTrap && /выч/.test(barePercentTrap.msg), 'A decrease hint must tell the learner to subtract');
const proportion = bank['percentages/proportion'](12345).task;
assert(/\bx\b/.test(proportion.hint2.split('и выразите')[0].replace(/<[^>]+>/g, '')),
  'The explanatory equation must retain x instead of disclosing and substituting its answer');

// Restoring a state may not advance through unchecked long-division actions.
for (const id of ['multiplication-division/long-division-one-digit', 'multiplication-division/division-lab']) {
  const { taskSpec, state } = C.create(id, 12345);
  assert.deepEqual(C.normalize(taskSpec, clone(state)), state);
  const skipped = { ...clone(state), step: 1 };
  assert.throws(() => C.normalize(taskSpec, skipped));
  const incorrect = { ...clone(state), step: 1, answers: ['999999'] };
  assert.throws(() => C.normalize(taskSpec, incorrect));
  if (taskSpec.steps.length > 1) {
    assert.throws(() => C.evaluate(taskSpec, { scope: 'step', step: 1, answer: '1', answers: [] }));
  }
}
console.log(JSON.stringify({ result: 'LEARNING_REMEDIATION_QUALITY_OK', divisionTasks, divisionSteps,
  checks: ['exact integer oracles', 'requested answer form', 'hint direction', 'unknown retained in equation', 'unchecked steps rejected'] }));
