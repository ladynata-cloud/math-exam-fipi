'use strict';
// Existing canonical tasks in, explanatory HTML out. No browser or account changes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const contracts = require('../trainers/oge-basics/learning-contracts.js');
const D = require('../trainers/oge-basics/multiplication-division/division-lab-core.js');
const ui = require('../trainers/oge-basics/learning-scaffolds.js');
const make = (id, seed = 1) => contracts.create(id, seed).taskSpec;
const render = (spec, level = 2, step = 0) => ui.render(spec, spec.steps[step] || spec.task, {level, step, scope:spec.steps.length ? 'step' : 'practice'});
function freeze(value) { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
function question(prompt, answer) { return {kind:'input', prompt, answer}; }

test('the first OGE example gets repeated addition without an automatic final answer', () => {
  const spec = freeze(make('order-of-operations')), before = JSON.stringify(spec);
  const hint = render(spec), solution = render(spec, 3);
  assert.match(hint, /4 \+ 5 = 9/);
  assert.match(hint, /6 \+ 6 \+ 6 \+ 6 \+ 6 \+ 6 \+ 6 \+ 6 \+ 6 = \?/);
  assert.doesNotMatch(hint, /54|data-scaffold-result/);
  assert.match(solution, /48 \+ 6 = 54/);
  assert.match(solution, /\(4 \+ 5\) · 6 = 54/);
  assert.equal(JSON.stringify(spec), before);
  assert.equal(render(spec, 1), '');
});

test('all five existing order-of-operations forms get valid support', () => {
  const skills = new Set();
  for (const seed of [1, 500, 1000, 2000, 5000, 99999]) {
    const spec = make('order-of-operations', seed), html = render(spec, 3);
    skills.add(spec.task.label);
    assert.match(html, /data-scaffold-result/);
    const expression = spec.task.prompt.replace(/<[^>]*>/g, '').replace('Вычислите: ', '');
    assert(html.includes(expression + ' = ' + spec.task.answer));
  }
  assert(skills.size >= 4);
});

test('missing factors and tabular division are recoverable by addition, not memorization', () => {
  for (const id of ['multiplication-division/multiplication-mixed', 'multiplication-division/tabular-division', 'multiplication-division']) {
    const spec = make(id), hint = render(spec), solution = render(spec, 3);
    const base = id.endsWith('/tabular-division') ? 4 : 3;
    assert(hint.includes('каждый раз прибавляй ' + base));
    assert(hint.includes('<td>' + (12 - base) + ' + ' + base + '</td><td>12</td>'));
    assert.doesNotMatch(hint, /lm-scaffold-selected|data-scaffold-result/);
    assert.match(solution, /12 : (3|4) = (4|3)/);
  }
  const spec = {contentId:'multiplication-division'};
  assert.match(ui.render(spec, question('Вычислите: <strong>30 : 3</strong>', 10)), /<th scope="row">10<\/th>/);
});

test('multiplication meaning, direct facts and a ladder show an arithmetic path', () => {
  assert.match(render(make('multiplication-division', 2)), /5 \+ 5 \+ 5 = \?/);
  assert.match(render(make('multiplication-division/multiplication-meaning', 1)), /4 \+ 4 \+ 4 = \?/);
  assert.match(render(make('multiplication-division/multiplication-meaning', 2)), /5 \+ 5 \+ 5 = \?/);
  assert.match(render(make('multiplication-division/multiplication-ladder', 1)), /12 \+ 3 = \?/);
  assert.match(render(make('multiplication-division/multiplication-ladder', 3), 3), /15 − 3 = 12/);
});

test('decimal addition aligns places and explains the real carry', () => {
  const spec = freeze(make('decimal-add-subtract')), hint = render(spec), solution = render(spec, 3);
  assert.match(hint, /десятые/); assert.match(hint, /сотые/);
  assert.match(hint, /8,01 \+ 4,73/);
  assert.doesNotMatch(hint, /12,74|data-scaffold-result/);
  assert.match(solution, /единицы: 8 \+ 4 = 12\. Пишем 2, переносим 1/);
  assert.match(solution, /десятки: 0 \+ 0 \+ 1 \(перенос\) = 1/);
  assert.match(solution, /8,01 \+ 4,73 = 12,74/);
  const q = question('Вычислите: <strong>9,99 + 0,01</strong>', 10);
  const carry = ui.render(spec, q, {level:3});
  assert.match(carry, /сотые: 9 \+ 1 = 10/);
  assert.match(carry, /десятые: 9 \+ 0 \+ 1 \(перенос\) = 10/);
  assert.match(carry, /9,99 \+ 0,01 = 10,00/);
});

test('decimal subtraction explains borrowing, including a chain through zeroes', () => {
  const spec = freeze(make('decimal-add-subtract', 1000)), solution = render(spec, 3);
  assert.match(solution, /Размениваем 1 единицу на 10 десятых/);
  assert.match(solution, /десятые: 16 − 9 = 7/);
  assert.match(solution, /19,66 − 4,95 = 14,71/);
  const zeros = ui.render(spec, question('Вычислите: <strong>10,00 − 0,05</strong>', 9.95), {level:3});
  assert.match(zeros, /Размениваем 1 десяток на 10 единиц/);
  assert.match(zeros, /Размениваем 1 единицу на 10 десятых/);
  assert.match(zeros, /Размениваем 1 десятую на 10 сотых/);
  assert.match(zeros, /сотые: 10 − 5 = 5/);
  assert.match(zeros, /10,00 − 0,05 = 9,95/);
});

test('quotient-digit 91:16 shows all exact multiples and explains the upper boundary', () => {
  const spec = freeze(make('multiplication-division/long-division-quotient-digit')), hint = render(spec), solution = render(spec, 3);
  for (let n = 1; n <= 9; n++) assert(hint.includes('<td>' + (n - 1) * 16 + ' + 16</td><td>' + n * 16 + '</td>'));
  assert.doesNotMatch(hint, /Цифра частного:|lm-scaffold-selected|data-scaffold-result/);
  assert.match(solution, /16 · 5 = 80 ≤ 91, а 16 · 6 = 96 &gt; 91\. Цифра частного: 5/);
});

test('the first incomplete dividend is explained without exposing the entire quotient', () => {
  const spec = freeze(make('multiplication-division/long-division-one-digit')), hint = render(spec), solution = render(spec, 3);
  assert.match(hint, /2 меньше 4/);
  assert.match(hint, /следующую цифру справа: 0/);
  assert.doesNotMatch(hint, /510|data-scaffold-result/);
  assert.match(solution, /Первое неполное делимое: 20/);
  assert.doesNotMatch(solution, /Частное: 510/);
});

test('current steps, decimal shifts and checkpoint segments remain pure and supported', () => {
  for (const name of ['long-division-one-digit','long-division-two-digit','long-division-zero-in-quotient','long-division-with-remainder','decimal-division-natural','decimal-divisor-shift','division-append-zeros','long-division-mixed-checkpoint']) {
    const spec = freeze(make('multiplication-division/' + name)), before = JSON.stringify(spec);
    spec.steps.forEach((q, step) => {
      const hint = render(spec, 2, step), solution = render(spec, 3, step);
      assert.match(hint, /data-scaffold="division"/, name + ':' + q.kind);
      assert.match(solution, /data-scaffold="division"/, name + ':' + q.kind);
      assert.doesNotMatch(hint, /data-scaffold-result/);
    });
    assert.equal(JSON.stringify(spec), before);
  }
  const decimal = make('multiplication-division/decimal-divisor-shift');
  assert.match(render(decimal, 3, 3), /7,65 : 5,1 = 76,5 : 51/);
});

test('unsupported, inconsistent, negative and HTML-bearing inputs fail closed', () => {
  const spec = make('decimal-add-subtract');
  for (const q of [question('Вычислите: -1,2 + 3,4', 2.2), question('Вычислите: 1,2 − 3,4', -2.2), question('Вычислите: 1,2 + 3,4', 99), question('<img src=x onerror=alert(1)>Вычислите: 1,2 + 3,4', 4.6), question('Вычислите: 999999999999999999999 + 1', 1), question('Вычислите: 1,23456 + 1', 2.23456)]) assert.equal(ui.render(spec, q), '');
  assert.equal(ui.render({contentId:'unknown'}, question('Вычислите: 1,2 + 3,4', 4.6)), '');
  assert.equal(ui.render(spec, spec.task, {scope:'untrusted'}), '');
  assert.equal(ui.render(spec, spec.task, {step:-1}), '');
  const division = make('multiplication-division/long-division-one-digit');
  assert.equal(ui.render(division, {...division.steps[0], answer:'999'}, {scope:'step'}), '');
  assert.equal(ui.render(division, division.steps[0], {scope:'step', step:999}), '');
});

test('browser and CommonJS modules render the same canonical task without a DOM', () => {
  const context = vm.createContext({DivisionLab:D});
  vm.runInContext(fs.readFileSync(require.resolve('../trainers/oge-basics/learning-scaffolds.js'), 'utf8'), context);
  const spec = freeze(make('multiplication-division/long-division-one-digit'));
  assert.equal(context.LearningScaffolds.render(spec, spec.steps[1], {scope:'step',step:1,level:3}), render(spec, 3, 1));
  assert.equal(Object.isFrozen(context.LearningScaffolds), true);
});
