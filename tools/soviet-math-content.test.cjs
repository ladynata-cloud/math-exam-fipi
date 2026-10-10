'use strict';

// Independently read the public problem statements, then verify their answers
// with rational arithmetic. Do not reuse the course's generators or checker as
// the mathematical oracle.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const C = require('../soviet-math/course.js');
const legacyModules = [require('../soviet-math/primary.js'), require('../soviet-math/advanced.js')];
const primaryIds = new Set(legacyModules[0].topics.map(topic => topic.id));
const legacyTopics = legacyModules.flatMap(part => part.topics);
const legacyMake = (id, index = 0) => legacyModules.find(part => part.topics.some(topic => topic.id === id)).make(id, index);
const revisedModules = ['revised-primary', 'revised-division', 'revised-advanced'];
const extensionModules = ['extension-primary', 'extension-fractions', 'extension-applications'];
const extensionTopics = extensionModules.flatMap(name => require('../soviet-math/' + name + '.js').topics);
const sources = require('../soviet-math/sources.js');
const root = path.resolve(__dirname, '..');

function rat(value) {
  const parts = String(value).replace(',', '.').split('/');
  if (parts.length === 2) {
    const a = rat(parts[0]), b = rat(parts[1]);
    assert.notEqual(b[0], 0n);
    return [a[0] * b[1], a[1] * b[0]];
  }
  const match = parts[0].match(/^(-?)(\d+)(?:\.(\d+))?$/);
  assert.ok(match, 'Expected a numeric answer: ' + value);
  return [BigInt((match[1] || '') + match[2] + (match[3] || '')), 10n ** BigInt((match[3] || '').length)];
}
const add = (a, b) => [a[0] * b[1] + b[0] * a[1], a[1] * b[1]];
const multiply = (a, b) => [a[0] * b[0], a[1] * b[1]];
const divide = (a, b) => [a[0] * b[1], a[1] * b[0]];
const equal = (actual, expected, message) => {
  const a = Array.isArray(actual) ? actual : rat(actual);
  const b = Array.isArray(expected) ? expected : rat(expected);
  assert.equal(a[0] * b[1], b[0] * a[1], message);
};
const gcd = (a, b) => b ? gcd(b, a % b) : a;
const numbers = prompt => (prompt.match(/\d+(?:,\d+)?/g) || []).map(value => Number(value.replace(',', '.')));

function primaryAnswer(example) {
  const [a, b, c, d] = numbers(example.prompt);
  switch (example.topicId) {
    case 'bonds': return a - b;
    case 'compare': return Math.max(a, b);
    case 'add-ten': case 'add-twenty': case 'column-add': return a + b;
    case 'subtract-ten': case 'subtract-twenty': case 'column-subtract': return a - b;
    case 'place-value': return a * 100 + b * 10 + c;
    case 'stories': return a + (a + b) - c;
    case 'groups': case 'times-table': case 'column-multiply': return a * b;
    case 'sharing': return a / b;
    case 'order': return (a + b) * c - d;
    default: throw Error('Missing reference calculation: ' + example.topicId);
  }
}

function advancedAnswers(example) {
  const [a, b, c, d] = numbers(example.prompt);
  switch (example.topicId) {
    case 'fraction-meaning': {
      const { n, d: denominator } = example.visual;
      return { final: [BigInt(n), BigInt(denominator)], steps: [denominator, n, [BigInt(n), BigInt(denominator)]] };
    }
    case 'fraction-reduce': {
      const divisor = gcd(a, b), final = rat(a + '/' + b);
      return { final, steps: [divisor, a / divisor, b / divisor, final] };
    }
    case 'fraction-add': {
      const common = b * d / gcd(b, d), final = add(rat(a + '/' + b), rat(c + '/' + d));
      return { final, steps: [common, a * common / b, c * common / d, a * common / b + c * common / d, final] };
    }
    case 'fraction-multiply': case 'fraction-divide': {
      const quotient = example.topicId === 'fraction-divide';
      const n = a * (quotient ? d : c), denominator = b * (quotient ? c : d);
      const final = (quotient ? divide : multiply)(rat(a + '/' + b), rat(c + '/' + d));
      return { final, steps: [...(quotient ? [rat(d + '/' + c)] : []), n, denominator, gcd(n, denominator), final] };
    }
    case 'decimal-add': {
      const n = Math.round(a * 100), m = Math.round(b * 100), final = [BigInt(n + m), 100n];
      return { final, steps: [n, m, n + m, final] };
    }
    case 'percent-part': {
      const final = a * b / 100;
      return { final, steps: [100, b, a * b, final, b] };
    }
    case 'percent-whole': {
      const final = a * 100 / b;
      return { final, steps: [100, b, a * 100, final, a] };
    }
    case 'percent-ratio': {
      const final = b * 100 / a;
      return { final, steps: [100, a, b * 100, final, b] };
    }
    default: throw Error('Missing reference calculation: ' + example.topicId);
  }
}

assert.equal(legacyTopics.length, 30, 'Keep every first-batch topic in the original mathematical regression');
assert.equal(C.revision, 2, 'Revised lessons have an explicit persistence revision');
assert.equal(typeof C.legacyMake, 'function', 'Original attempts retain their original task generator');
assert.equal(C.topics.length, legacyTopics.length + extensionTopics.length);
assert.equal(new Set(C.topics.map(topic => topic.id)).size, C.topics.length);
for (const topic of C.topics) {
  const source = sources.forTopic(topic.id);
  assert.ok(source && source.authors && source.bookTitle && source.section);
  assert.ok(Number.isInteger(source.year) && source.year < 1992);
  assert.equal(source.task, null, 'Original exercises must not invent textbook task numbers');
  assert.match(source.label, /^Авторск(?:ий пример|ое упражнение) ·/, 'Authored exercise must be distinguished from its textbook reference');
}
// Keep the original oracle and its sample sizes intact. New topics have their
// own independent exact-arithmetic oracle in soviet-math-extension.test.cjs.
let ordinaryExamples = 0, divisionExamples = 0, divisionCycles = 0, checkedSteps = 0;
for (const topic of legacyTopics) {
  const divisionTopic = topic.id.startsWith('divide-');
  const sampleCount = divisionTopic ? 1000 : 12;
  const prompts = new Set();
  for (let index = 0; index < sampleCount; index++) {
    const example = legacyMake(topic.id, index);
    assert.deepEqual(C.legacyMake(topic.id, index), example, 'Legacy API preserves the original plan: ' + topic.id + '/' + index);
    prompts.add(JSON.stringify([example.prompt, example.visual || null]));
    assert.ok(example.steps.length >= 3);
    for (const item of example.steps) {
      assert.ok(item.prompt && item.record && item.hint && Array.isArray(item.helper));
      assert.ok(C.check(item.answer, item), topic.id + '[' + index + '] must accept its correct step answer');
      checkedSteps++;
    }
    if (!divisionTopic) {
      ordinaryExamples++;
      if (primaryIds.has(topic.id)) {
        equal(example.answer, primaryAnswer(example), example.prompt);
        assert.ok(example.steps.length <= 7);
        example.steps.forEach(item => assert.ok(item.record.length < 45, item.record));
      } else {
        const expected = advancedAnswers(example);
        equal(example.answer, expected.final, example.prompt);
        example.steps.forEach((item, i) => equal(item.answer, expected.steps[i], topic.id + '[' + index + '] step ' + i));
      }
      continue;
    }
    divisionExamples++;
    const plan = example.division;
    const dividend = rat(plan.task.dividend), divisor = rat(plan.task.divisor);
    const quotient = rat(plan.quotient), remainder = plan.task.level === 'remainder' ? rat(plan.remainder) : rat(0);
    equal(add(multiply(divisor, quotient), remainder), dividend, example.prompt + ' inverse check');
    if (plan.task.level === 'remainder') assert.ok(plan.remainder >= 0 && plan.remainder < Number(plan.task.divisor));
    let previous = null, writtenQuotient = '';
    for (const cycle of plan.cycles) {
      divisionCycles++;
      assert.equal(cycle.qd, Math.floor(cycle.partial / plan.normalizedDivisor));
      assert.equal(cycle.product, cycle.qd * plan.normalizedDivisor);
      assert.equal(cycle.remainder, cycle.partial - cycle.product);
      assert.ok(cycle.qd >= 0 && cycle.qd <= 9);
      assert.ok(cycle.remainder >= 0 && cycle.remainder < plan.normalizedDivisor);
      if (previous) assert.equal(cycle.partial, previous.remainder * 10 + plan.digits[cycle.sourceIndex]);
      previous = cycle;
    }
    for (const item of example.steps) {
      const action = item.raw, cycle = Number.isInteger(action.cycle) ? plan.cycles[action.cycle] : null;
      switch (action.kind) {
        case 'digit': equal(item.answer, cycle.qd); writtenQuotient += item.answer; break;
        case 'product': equal(item.answer, cycle.product); break;
        case 'subtract': equal(item.answer, cycle.remainder); break;
        case 'remainder-check': assert.equal(item.answer, 'да'); assert.equal(C.check('нет', item), false); break;
        case 'bring': equal(item.answer, plan.digits[action.sourceIndex]); break;
        case 'comma': assert.equal(item.answer, writtenQuotient + ','); writtenQuotient += ','; break;
        case 'answer': equal(item.answer, quotient); break;
        case 'final-remainder': equal(item.answer, remainder); break;
        case 'verify': equal(item.answer, dividend); break;
        case 'shift-divisor': {
          const factor = rat(10 ** plan.task.divisor.split(',')[1].length);
          equal(item.answer, multiply(divisor, factor)); break;
        }
        case 'shift-dividend': {
          const factor = rat(10 ** plan.task.divisor.split(',')[1].length);
          equal(item.answer, multiply(dividend, factor)); break;
        }
      }
    }
  }
  if (!divisionTopic) assert.equal(prompts.size, 12, topic.id + ': twelve distinct tasks');
}

// A request to reduce a fraction must not accept the unchanged fraction or an
// approximate decimal, even though it represents the same/nearby numeric value.
for (const id of ['fraction-reduce', 'fraction-add', 'fraction-multiply', 'fraction-divide']) {
  for (let index = 0; index < 12; index++) {
    const final = legacyMake(id, index).steps.at(-1);
    assert.equal(final.checkKind, 'reduced-fraction');
    const [n, d = '1'] = final.answer.split('/');
    assert.equal(C.check((BigInt(n) * 2n) + '/' + (BigInt(d) * 2n), final), false, id + ': reject reducible answer');
    assert.equal(C.check(n + ' / ' + d, final), true, id + ': spaces around the fraction bar are fine');
    assert.equal(C.check((BigInt(n) + BigInt(d)) + '/' + d, final), false, id + ': reject wrong value');
    assert.equal(C.check(n + '/0', final), false);
  }
}
const reducedHalf = legacyMake('fraction-reduce', 0).steps.at(-1);
for (const wrong of ['2/4', '0,5', '0.5', '0,5000000001', '1/2/3', '1,0/2', '1/2.0', '']) {
  assert.equal(C.check(wrong, reducedHalf), false, 'Reject non-reduced/non-fraction response: ' + wrong);
}
const exactThird = { answer: '1/3', checkKind: 'reduced-fraction' };
assert.equal(C.check('0.333333333', exactThird), false);
assert.equal(C.check('1/3', exactThird), true);
const integerResult = legacyMake('fraction-divide', 0).steps.at(-1);
assert.equal(C.check('2', integerResult), true);
assert.equal(C.check('2/1', integerResult), true);
assert.equal(C.check('4/2', integerResult), false);
assert.equal(C.check('1,550', legacyMake('decimal-add', 0).steps.at(-1)), true);
assert.equal(C.check('1.55', legacyMake('decimal-add', 0).steps.at(-1)), true);
assert.equal(C.check('1,56', legacyMake('decimal-add', 0).steps.at(-1)), false);

// Check both browser and Node loading paths, including delegated division checks.
const browser = {};
browser.window = browser;
for (const relative of [
  'trainers/oge-basics/multiplication-division/division-lab-core.js',
  'trainers/oge-basics/multiplication-division/division-guided-core.js',
  'soviet-math/primary.js', 'soviet-math/advanced.js',
  ...revisedModules.map(name => 'soviet-math/' + name + '.js'),
  ...extensionModules.map(name => 'soviet-math/' + name + '.js'), 'soviet-math/course.js', 'soviet-math/progress.js'
]) vm.runInNewContext(fs.readFileSync(path.join(root, relative), 'utf8'), browser, { filename: relative });
assert.equal(browser.SovietMath.topics.length, C.topics.length);
assert.equal(browser.SovietProgress.defaults(false).version, 2);
assert.equal(browser.SovietMath.check('2/4', browser.SovietMath.legacyMake('fraction-reduce', 0).steps.at(-1)), false);
const divisionStep = browser.SovietMath.legacyMake('divide-decimal', 0).steps.find(item => item.raw.kind === 'shift-factor');
assert.equal(browser.SovietMath.check('10', divisionStep), true);
assert.equal(browser.SovietMath.check('100', divisionStep), false);

console.log('SOVIET_MATH_CONTENT_OK ' + JSON.stringify({ ordinaryExamples, divisionExamples, divisionCycles, checkedSteps }));
