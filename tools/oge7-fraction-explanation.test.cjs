'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { restoreFractionExplanation, current, original } = require('./oge7-fraction-explanation-preservation.cjs');
const { restoreActiveLearningIncludes } = require('./oge-active-learning-preservation.cjs');
const file = 'trainers/oge-task7-number-line.html';
const source = fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
const digest = text => crypto.createHash('sha256').update(text).digest('hex');

function run(numerator, denominator) {
  const elements = { p3m: { value: String(numerator) }, p3n: { value: String(denominator) }, p3out: { innerHTML: '' } };
  const context = vm.createContext({ el: id => elements[id] });
  const parser = source.match(/function parseIntStrict\(s\)\{[\s\S]*?return parseInt\(s,10\); \}/)[0];
  const fraction = source.match(/function fracHtml\(num,den\)\{[^\n]+\}/)[0];
  const handler = source.slice(source.indexOf('function fracExplain(){'), source.indexOf('\nfunction p3Random(){'));
  vm.runInContext(parser + '\n' + fraction + '\n' + handler + '\nfracExplain();', context, { timeout: 1000 });
  const html = elements.p3out.innerHTML;
  const text = html.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/\s+/g, ' ').trim();
  assert.doesNotMatch(html, /NaN|Infinity|undefined/);
  return { html, text };
}

test('5/5 and 6/3 are exact integer points, never open intervals', () => {
  for (const [n, d, answer] of [[5, 5, 1], [6, 3, 2], [100, 100, 1], [9007199254740991, 9007199254740991, 1]]) {
    const { text } = run(n, d);
    assert.match(text, new RegExp('Точное целое:.*Число находится на делении ' + answer + '\\.'));
    assert.doesNotMatch(text, /между|Дробь правильная|≈|…/);
  }
});

test('finite decimals keep equality and all necessary decimal places', () => {
  for (const [n, d, decimal] of [[5, 4, '1,25'], [1, 200, '0,005'], [1, 8, '0,125'], [5, 2, '2,5'], [1, 4503599627370496, '0,0000000000000002220446049250313080847263336181640625']]) {
    const { text } = run(n, d);
    assert(text.includes(n + ' : ' + d + ' = ' + decimal + '. Деление закончено: это точное значение.'));
    assert.doesNotMatch(text, /≈|…|Цифры в скобках/);
  }
});

test('5/9 shows its exact periodic expansion and explains the parentheses', () => {
  const { text } = run(5, 9);
  assert.match(text, /5 < 9/);
  assert.match(text, /число между 0,5 и 0,6/);
  assert.match(text, /5 : 9 = 0,\(5\)\. Цифры в скобках повторяются без конца\./);
  assert.doesNotMatch(text, /≈|0,55…/);
});

test('non-repeating prefix and repeating suffix are kept distinct', () => {
  const { text } = run(1, 6);
  assert.match(text, /1 : 6 = 0,1\(6\)/);
  assert.doesNotMatch(text, /0,\(16\)/);
});

test('long period uses explicit rounding rather than an untrue finite equality', () => {
  const { text } = run(1, 97);
  assert.match(text, /1 : 97 ≈ 0,010309\. Округлено до шести знаков/);
  assert.doesNotMatch(text, /1 : 97 = 0,010309/);
});

test('large safe integer arithmetic remains exact above the old 10*m precision boundary', () => {
  const { text } = run('9007199254740991', '3');
  assert.match(text, /9007199254740991 = 3002399751580330·3 \+ 1/);
  assert.match(text, /90071992547409910 = 30023997515803303·3 \+ 1/);
  assert.match(text, /9007199254740991 : 3 = 3002399751580330,\(3\)/);
});

test('domain validation retains natural-number inputs and rejects zero denominator', () => {
  for (const [n, d] of [[5, 0], [0, 5], [-1, 3], [5, -2], ['−5', 9], ['1,5', 2], ['', 4]]) {
    const { text, html } = run(n, d);
    assert.match(text, /введи натуральные числитель и знаменатель/);
    assert.match(html, /class="msg bad"/);
    assert.doesNotMatch(text, /Дробь правильная|Деление в столбик/);
  }
});

test('unsafe and overflowing integer input is rejected without silently rounding', () => {
  for (const [n, d] of [['9007199254740993', '5'], ['5', '9007199254740993'], ['9'.repeat(400), '3']]) {
    const { text } = run(n, d);
    assert.match(text, /не больше 9007199254740991/);
    assert.match(text, /Само правило сравнения дробей от этого ограничения не зависит/);
    assert.doesNotMatch(text, /Деление в столбик|Точное целое/);
  }
});

test('strict normalization preserves the entire published page and original function bytes', () => {
  assert.equal(digest(original), '00ac7baa26fa9bd9cadd560852ed7149dee7e0111508808f50ae0b37a3920ec9');
  const restored = restoreFractionExplanation(restoreActiveLearningIncludes(file, source));
  assert.equal(digest(restored), '327b041bf929619f3ced888e576ce12c560def6fd918aa637fc967ee355504ca');
  assert.equal(restoreFractionExplanation(current), original);
});

test('normalization rejects mutated, missing and duplicated reviewed functions', () => {
  assert.throws(() => restoreFractionExplanation(current.replace('digits.length<64', 'digits.length<63')));
  assert.throws(() => restoreFractionExplanation(original));
  assert.throws(() => restoreFractionExplanation(current + '\n' + current));
  assert.throws(() => restoreFractionExplanation(current + '\nfunction fracExplain(){ return; }'));
});
