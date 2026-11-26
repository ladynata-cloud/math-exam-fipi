'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const { compare, limits, parse } = require('../ege-profil/part-two/equation-answers.js');
const vectors = require('./fixtures/profile-equation-answers.json');
const algebra = require('../ege-profil/part-two/content-algebra.js');
const { forTask } = require('../ege-profil/part-two/equation-fields.js');

const newTasks = algebra.flatMap(lesson => lesson.tasks.filter(task => task.equationAnswer));
const answerById = new Map(newTasks.map(task => [task.id, task.equationAnswer]));
const half = { general: [['1/6', '2'], ['5/6', '2']] };
const integers = { general: [['0', '1']] };
answerById.set('p14-circle-selection-1', half);

function check(text, type, spec, expected) {
  const result = compare(parse(text, type), spec);
  const message = JSON.stringify({ text, type, expected });
  assert.equal(result.status, expected, message);
  assert.equal(result.recognized, expected !== 'format', message);
  assert.equal(result.correct, expected === 'correct', message);
  return result;
}

test('all 22 specified general-solution vectors', () => {
  assert.equal(vectors.general.length, 22);
  for (const [id, text, status] of vectors.general) {
    check(text, 'periodic-pi', answerById.get(id), status);
  }
});

test('all 42 specified finite-answer vectors', () => {
  assert.equal(vectors.finite.length, 42);
  for (const [id, text, status] of vectors.finite) {
    const spec = answerById.get(id);
    check(text, spec.type, spec, status);
  }
});

test('all twelve authored cases use the checked fixtures and parse canonical exact answers', () => {
  assert.equal(vectors.math.length, 12);
  for (const item of vectors.math) {
    const spec = answerById.get(item.id);
    assert.deepEqual(spec.finite, item.roots);
    assert.deepEqual(spec.general, item.families);
    assert.deepEqual(spec.interval, item.interval);
    const unit = spec.type === 'finite-pi' ? 'π' : '';
    check(spec.finite.map(value => value + unit).join(';') || '∅', spec.type, spec, 'correct');
    if (spec.general) {
      const description = spec.general.map(([offset, step]) => offset + 'π+' + step + 'πn').join(';');
      check(description, 'periodic-pi', spec, 'correct');
    }
  }
});

test('periodic unions handle equal refinements, flipped steps and isolated points', () => {
  for (const expression of ['x=πn+(-1)^nπ/6', 'x=π*N+(-1)^N*π/6, N ∈ ℤ',
    'x=π/6−2πk ∪ x=5π/6+2πn, k,n∈ℤ', 'x=π/6+2πn; x=5π/6+2πm; n ∈ Z; m ∈ Z']) {
    check(expression, 'periodic-pi', half, 'correct');
  }
  for (const [text, status] of [['x=2πn;π/2', 'missing-extra'], ['x=πn;3π', 'correct'],
    ['x=πn;π/2', 'extra'], ['x=-5π + 2πn; x=2πm', 'correct'],
    ['x=πn/2', 'extra'], ['x=nπ', 'correct'], ['x=π/2*n; x=2πm', 'extra'],
    ['x=πn; x=3π/2+0πm', 'extra'], ['x=πn; x=π/2', 'extra'],
    ['x=πn; x=8π', 'correct'], ['x=0+2πn; x=π+2πm', 'correct']]) {
    check(text, 'periodic-pi', integers, status);
  }
  const alternatingIsolated = { general: [['1/6', '0'], ['-1/6', '0']] };
  check('x=(-1)^nπ/6+0πn', 'periodic-pi', alternatingIsolated, 'correct');
  check('x=±π/6', 'periodic-pi', alternatingIsolated, 'correct');
  check('x=π/6', 'periodic-pi', alternatingIsolated, 'missing');
  check('∅', 'periodic-pi', { general: [] }, 'correct');
});

test('e and i need an explicit integer declaration to denote a family of roots', () => {
  for (const name of ['e', 'i', 'E', 'I']) {
    check('х=pi*' + name, 'periodic-pi', integers, 'format');
    check('х=πn или Х=π' + name + ', n ∈ ℤ', 'periodic-pi', integers, 'format');
    check('х=pi*' + name + ', ' + name + ' ∈ ℤ', 'periodic-pi', integers, 'correct');
  }
  check('х=2πe или Х=π+2πi, e,i∈Z', 'periodic-pi', integers, 'correct');
  check('x=2πe, e∈Z; x=π+2πi, i∈Z', 'periodic-pi', integers, 'correct');
  check('x=2πe; x=π+2πi, i∈Z', 'periodic-pi', integers, 'format');
  check('х=(-1)^iπ/6+πi, i∈Z', 'periodic-pi', half, 'correct');
  check('х=πa, a∈ℤ', 'periodic-pi', integers, 'correct');
  check('х=πk', 'periodic-pi', integers, 'correct');
});

test('finite roots preserve exact signs, units, endpoints, domain and all diagnostics', () => {
  const circle = answerById.get('p14-circle-selection-8');
  const a = check('3π/4; π', 'finite-pi', circle, 'extra-outside-interval');
  assert.deepEqual(a.extra, [{ unit: 'pi', value: '3/4', reason: 'outside-interval' },
    { unit: 'pi', value: '1', reason: 'not-root' }]);
  const b = check('0900/1200\\pi; π', 'finite-pi', circle, 'extra-outside-interval');
  assert.deepEqual(b.extra, a.extra);
  const zero = answerById.get('p14-trig-factors-8');
  assert.equal(check('-0π;0/7;0', 'finite-pi', zero, 'correct').duplicates, 2);
  check('0π/0', 'finite-pi', zero, 'format');
  const radical = answerById.get('p14-radical-check-7');
  const c = check('0,25;0,75;3/16;0', 'finite-rational', radical, 'extra-outside-domain');
  assert.deepEqual(c.extra, [{ unit: 'number', value: '3/16', reason: '' },
    { unit: 'number', value: '0', reason: 'outside-domain' }]);
  check('3.141592653589', 'finite-pi', zero, 'missing-extra-not-root');
  check('−17/6*pi; -13/6*PI; -5/6π', 'finite-pi', answerById.get('p14-circle-selection-7'), 'correct');
});

test('integer parameters may be declared beside each factor branch', () => {
  const spec = { general: [['0', '1'], ['1/3', '2'], ['-1/3', '2']] };
  check('x=πn, n∈ℤ; x=±π/3+2πk, k∈ℤ', 'periodic-pi', spec, 'correct');
  check('x=πn, n∈ℤ или x=±π/3+2πk, k∈ℤ', 'periodic-pi', spec, 'correct');
  check('x=πn, k∈ℤ; x=±π/3+2πk, k∈ℤ', 'periodic-pi', spec, 'format');
  check('x=πn, n∈R; x=±π/3+2πk, k∈ℤ', 'periodic-pi', spec, 'format');
});

test('division of the entire angle series scales both the offset and the period', () => {
  const spec = { general: [['1/12', '1'], ['5/12', '1']] }; // sin(2x) = 1/2
  check('x=(π/6+2πk)/2; x=(5π/6+2πn)/2', 'periodic-pi', spec, 'correct');
  check('x=((-1)^nπ/6+πn)/2', 'periodic-pi', spec, 'correct');
  check('x=(-π/6−2πk)/−2; x=(-5π/6−2πk)/−2', 'periodic-pi', spec, 'correct');
  check('π/12+2πk; 5π/12+2πn', 'periodic-pi', spec, 'missing');
  for (const invalid of ['(π/6+2πn)/0', '(π/6+2πn)/n', '(π/6+2πn)/2π']) {
    check(invalid, 'periodic-pi', spec, 'format');
  }
});

test('ambiguity, nonintegral declarations and unsupported form fail without a math verdict', () => {
  for (const text of ['x=πx', 'x=(-1)^xπ/6+πx', 'x=(-1)^kπ/6+πn', 'x=πn, n ∈ R',
    'x=πn, k∈Z', 'x=πn, n∈Z, n>0', 'x=πn+πk', 'x=πn;', 'x=πn//2',
    'x=πn^2', 'x=πn; x=cos(π)', 'x=πn/2n', 'x=<b>πn</b>', 'x=π~n']) {
    check(text, 'periodic-pi', integers, 'format');
  }
  const spec = { finite: ['12'] };
  for (const text of ['1 2', '1. 2', '1 .2', '1;;2', '1,2,3', '±1', '12*', '+-12',
    '12*¹', '12/0', 'π', '12√1', '{12}}', '{∅}', '12/']) {
    check(text, 'finite-rational', spec, 'format');
  }
  check('12,000000000001', 'finite-rational', spec, 'missing-extra');
  check('12,0000000000001', 'finite-rational', spec, 'format');
  check('12,000000000000', 'finite-rational', spec, 'correct');
  check('0000000000012', 'finite-rational', spec, 'format');
});

test('length, number of entries, expanded families and residues are independently bounded', () => {
  assert.equal(limits.residues, 16384);
  assert.equal(check('x=16383πn', 'periodic-pi', integers, 'missing').missing.length, 16382);
  assert.equal(check('x=16384πn', 'periodic-pi', integers, 'format').reason, 'complexity');
  check(('πn;').repeat(11) + 'πn', 'periodic-pi', integers, 'correct');
  assert.equal(check(('πn;').repeat(12) + 'πn', 'periodic-pi', integers, 'format').reason, 'complexity');
  const alternative = '±0π+πn';
  check(Array(8).fill(alternative).join(';'), 'periodic-pi', integers, 'correct');
  assert.equal(check(Array(9).fill(alternative).join(';'), 'periodic-pi', integers, 'format').reason, 'complexity');
  const zero = { finite: ['0'] };
  assert.equal(check(Array(64).fill('0').join(';'), 'finite-rational', zero, 'correct').duplicates, 63);
  assert.equal(check(Array(65).fill('0').join(';'), 'finite-rational', zero, 'format').reason, 'complexity');
  check(' '.repeat(499) + '0', 'finite-rational', zero, 'correct');
  assert.equal(check(' '.repeat(500) + '0', 'finite-rational', zero, 'format').reason, 'complexity');
});

test('loader works without CommonJS and without a DOM', () => {
  const world = vm.createContext({});
  const script = fs.readFileSync(require.resolve('../ege-profil/part-two/equation-answers.js'), 'utf8');
  vm.runInContext(script, world);
  const api = world.ProfileEquationAnswers;
  assert.equal(api.compare(api.parse('(-1)^nπ/6+πn', 'periodic-pi'), half).correct, true);
});

const expected = {
  'p14-circle-selection': [['2/3', '4/3'], ['1/4', '3/4'], ['5/6', '7/6']],
  'p14-trig-factors': [['0', '1/4', '1', '7/4', '2'], ['0', '3/4', '1', '5/4', '2'], ['0', '1/6', '1', '11/6', '2']],
  'p14-exponential-substitution': [['-1', '2'], ['-2', '1'], ['-1', '1']],
  'p14-log-domain': [['7'], ['2'], ['6']],
  'p14-radical-check': [['5'], ['4'], ['8']],
  'p14-rational-hole': [['2', '6'], ['-2', '4'], ['-6', '2']],
};

test('legacy independent tasks adopt exact fields without changing any authored object', () => {
  const before = JSON.stringify(algebra);
  for (const lesson of algebra) {
    for (const [index, task] of lesson.tasks.entries()) {
      if (task.equationAnswer) continue;
      assert.equal(forTask(lesson, task, 'guided', index >= 3), null);
      assert.equal(forTask(lesson, task, 'plan', index >= 3), null);
      const model = forTask(lesson, task, 'independent', index >= 3);
      if (lesson.exam !== 14 || (index < 3 && task.id !== 'p14-circle-selection-1')) {
        assert.equal(model, null, task.id);
        continue;
      }
      const roots = index < 3 ? ['1/6', '5/6'] : expected[lesson.id][index - 3];
      assert.deepEqual(model.answer.finite, roots, task.id);
      assert.doesNotMatch(model.prompt, /коэффициент|количество корней|все пять/i);
      const angular = model.answer.type === 'finite-pi';
      assert.deepEqual(model.fields.map(field => field.key), angular ? ['general', 'selected'] : ['roots']);
      const text = roots.map(root => root + (angular ? 'π' : '')).join(';');
      assert.equal(compare(parse(text, model.answer.type), model.answer).correct, true, task.id);
      if (angular) {
        const form = model.answer.general.map(([a, b]) => `${a}π+${b}πn`).join(';');
        assert.equal(compare(parse(form, 'periodic-pi'), model.answer).correct, true, task.id);
      }
    }
  }
  assert.equal(JSON.stringify(algebra), before);
});

test('first guided sine task accepts both general forms via its practice view', () => {
  const lesson = algebra.find(row => row.id === 'p14-circle-selection');
  const model = forTask(lesson, lesson.tasks[0], 'independent', false);
  for (const text of ['π/6+2πn;5π/6+2πn', '(-1)^nπ/6+πn']) {
    assert.equal(compare(parse(text, 'periodic-pi'), model.answer).correct, true);
  }
});
