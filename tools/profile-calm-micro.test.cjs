'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const bank = require('../ege-profil/start/applied-data.js');
const micro = require('../ege-profil/start/calm-micro.js');
const check = require('../ege-profil/start/checks.js');
const tasks = bank.flatMap(lesson => lesson.tasks);
const targetStep = { motion: 0, production: 0, 'two-mixtures': 4, 'loan-equal': 2 };
const close = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1e-7 * Math.max(1, Math.abs(expected)), `${label}: ${actual} != ${expected}`);
const numeric = value => Number(String(value).replace(/−/g, '-').replace(',', '.'));
function freeze(value) { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }

// Evaluate a deliberately tiny, trusted test-expression grammar. This is not
// application input handling. It lets the oracle compare expressions by their
// mathematical meaning at independent sample values, rather than copy keys.
function valueAt(expression, x) {
  const source = expression.replace(/−/g, '-').replace(/,/g, '.').replace(/·/g, '*').replace(/(\d|\))x/g, '$1*x').replace(/([\dx])\(/g, '$1*(');
  assert.match(source, /^[\d.x+*/()\s-]+$/);
  return vm.runInNewContext(source, { x }, { timeout: 100 });
}

for (const task of tasks.filter(task => Object.hasOwn(targetStep, task.meta.kind))) {
  test('independent micro-operation oracle: ' + task.id, () => {
    const m = task.meta;
    const questions = micro.steps(task, targetStep[m.kind]);
    assert.ok(questions.length > 0 && questions.length <= 4);
    for (const item of questions) {
      assert.ok(item.prompt && item.hint && item.why);
      assert.doesNotMatch(JSON.stringify(item), /undefined|NaN|Infinity|диагноз/i);
      if (item.choices) {
        assert.equal(new Set(item.choices).size, item.choices.length, 'distinct choices');
        assert.equal(item.choices.filter(choice => typeof item.answer === 'number' ? numeric(choice) === item.answer : choice === item.answer).length, 1, 'exactly one accepted choice');
      } else assert.ok(Number.isFinite(item.answer));
    }

    if (m.kind === 'motion' || m.kind === 'production') {
      assert.equal(questions.length, 4);
      const amount = m.kind === 'motion' ? m.distance : m.amount;
      assert.match(questions[0].answer, m.kind === 'motion' ? /Меньшая скорость/ : /второго мастера за час/);
      for (const speed of [3, 11, 29]) {
        const slowTime = amount / speed, fastTime = amount / (speed + m.difference);
        close(valueAt(questions[1].answer, speed), Math.max(slowTime, fastTime), 'selected larger time');
        const common = valueAt(questions[2].answer, speed);
        close(common / speed, speed + m.difference, 'first denominator multiplier');
        close(common / (speed + m.difference), speed, 'second denominator multiplier');
        close(questions[3].answer, (slowTime - fastTime) * common, 'numerator recovered from elapsed times');
      }
      // No quadratic root or final requested speed is consulted above.
    } else if (m.kind === 'two-mixtures') {
      assert.equal(questions.length, 4);
      const saltAdded = m.addedMass / 100 * m.replacement;
      const total = saltAdded / ((m.secondPercent - m.firstPercent) / 100);
      const original = total - m.addedMass;
      const saltAt = massLow => massLow / 100 * m.low + (original - massLow) / 100 * m.high;
      const [left, right] = questions[0].answer.split(' = ');
      for (const massLow of [0, original / 2, original]) close(valueAt(left, massLow) / 100, saltAt(massLow), 'salt equation conserves substance');
      close(numeric(right) / 100, total / 100 * m.firstPercent, 'right side is salt, not solution');
      close(questions[1].answer / 100, saltAt(0), 'constant from all-strong mixture');
      close(questions[2].answer / 100, saltAt(1) - saltAt(0), 'coefficient from replacing one kg');
      assert.ok(questions[2].answer * questions[3].answer > 0, 'sign change makes coefficient positive');
      close(7 * questions[3].answer, -7, 'sign change on positive term');
      close(-3 * questions[3].answer, 3, 'same sign change on negative term');
    } else {
      assert.equal(questions.length, 3);
      const withInterest = debt => debt + debt / 100 * m.rate;
      for (const payment of [100, m.amount / 4]) {
        const debtAfterFirst = withInterest(m.amount) - payment;
        close(valueAt(questions[0].answer, payment), debtAfterFirst, 'subtract first payment');
        close(valueAt(questions[1].answer, payment), withInterest(debtAfterFirst), 'charge on entire remaining debt');
      }
      const secondBeforePayment = payment => withInterest(withInterest(m.amount) - payment);
      close(questions[2].answer, secondBeforePayment(100) - secondBeforePayment(101), 'payment coefficient from debt sensitivity');
      assert.equal(typeof questions[0].answer, 'string', 'unknown debt remains an expression');
      assert.equal(typeof questions[1].answer, 'string', 'unknown second-year debt remains an expression');
    }
  });
}

test('targets all current variants without repeating separately authored operations', () => {
  assert.deepEqual(Object.keys(targetStep).map(kind => tasks.filter(task => task.meta.kind === kind).length), [6, 2, 2, 6]);
  for (const task of tasks) for (let index = 0; index < task.steps.length; index++) {
    const result = micro.steps(task, index);
    if (Object.hasOwn(targetStep, task.meta.kind) && index === targetStep[task.meta.kind]) assert.ok(result.length);
    else assert.deepEqual(result, [], task.id + ': no duplicate micro-operation at step ' + index);
  }
});

test('existing answer checker accepts exactly the intended choice and numeric answers', () => {
  for (const task of tasks.filter(task => Object.hasOwn(targetStep, task.meta.kind))) {
    for (const question of micro.steps(task, targetStep[task.meta.kind])) {
      if (question.choices) assert.equal(question.choices.filter(choice => check.check(question.answer, choice, question.choices)).length, 1, task.id);
      else {
        assert.equal(check.check(question.answer, String(question.answer).replace('.', ',')), true, task.id);
        assert.equal(check.check(question.answer, String(question.answer + 1)), false, task.id);
      }
      assert.equal(check.check(question.answer, '', question.choices), false);
    }
  }
});

test('pure, deterministic, fresh output; original IDs, steps and answers are unchanged', () => {
  const before = JSON.stringify(bank);
  for (const task of tasks) {
    freeze(task);
    const index = targetStep[task.meta.kind] ?? 0;
    const first = micro.steps(task, index), second = micro.steps(task, index);
    assert.deepEqual(first, second);
    assert.notEqual(first, second);
    if (first.length) { first[0].prompt = 'edited by caller'; assert.notEqual(micro.steps(task, index)[0].prompt, first[0].prompt); }
  }
  assert.equal(JSON.stringify(bank), before);
});

test('unsupported or incomplete requests return no extra questions', () => {
  for (const task of [undefined, null, {}, { meta: {} }, { meta: { kind: 'motion' } }, { meta: { kind: 'two-mixtures', low: 10, high: 50 } }]) assert.deepEqual(micro.steps(task, 0), []);
  const task = tasks.find(task => task.meta.kind === 'motion');
  for (const index of [-1, NaN, 0.5, '0', undefined, 99]) assert.deepEqual(micro.steps(task, index), []);
});

test('browser API matches Node API and does not access storage or alter lesson banks', () => {
  const context = {};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../ege-profil/start/calm-micro.js'), 'utf8'), context);
  assert.deepEqual(Object.keys(context), ['ProfileCalmMicro']);
  for (const task of tasks.filter(task => Object.hasOwn(targetStep, task.meta.kind))) assert.equal(JSON.stringify(context.ProfileCalmMicro.steps(task, targetStep[task.meta.kind])), JSON.stringify(micro.steps(task, targetStep[task.meta.kind])));
});
