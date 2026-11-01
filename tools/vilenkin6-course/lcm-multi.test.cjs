'use strict';

// Finite, authored LCM lessons. These independent arithmetic and immutable-base
// checks supplement the original source, server and real-browser gates.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const baseline = require('./lcm-multi-base.json');
const manifest = require('../../learning/vilenkin6-textbook-catalog');
const catalog = require('../../learning/catalog');
const supplements = require('../../courses/vilenkin-6-part-1/textbook-data/supplement-lcm-multi.json');
const labels = require('../../courses/vilenkin-6-part-1/textbook-source-labels');
const math = require('../../courses/vilenkin-6-part-1/textbook-math');
const contract = require('../../courses/vilenkin-6-part-1/textbook-learning-contracts');
const unit = supplements[0], tasks = unit.tasks;
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const answer = item => String(item.answer);
const key = numbers => numbers.slice().sort((a, b) => a - b).join(',');

// Search the actual ordered positive multiples, independently of both methods
// taught by the application. The upper bound covers this finite bank exactly.
function firstCommonMultiple(numbers) {
  const stride = Math.max(...numbers);
  for (let candidate = stride; candidate <= 100000; candidate += stride) {
    if (numbers.every(number => candidate % number === 0)) return candidate;
  }
  throw Error('Unbounded authored condition: ' + numbers.join(', '));
}
function factors(number) {
  const values = [];
  for (let divisor = 2; divisor <= number; divisor++) {
    while (number % divisor === 0) {
      values.push(divisor);
      number /= divisor;
    }
  }
  return values;
}

test('the published 194 source records, revisions, order and A–D bytes are immutable', () => {
  const original = manifest.filter(row => row.unitKind !== 'author-supplement');
  assert.equal(original.length, baseline.count);
  assert.equal(sha256(JSON.stringify(original)), baseline.manifestSha256);
  assert.deepEqual(manifest.slice(0, baseline.count), original);
  for (const {file, sha256: expected} of baseline.sourceFiles) {
    assert.equal(sha256(fs.readFileSync(path.join(root, file))), expected, file);
  }
  assert.deepEqual(catalog.items.filter(row => row.trainerId === 'vilenkin6-textbook'), manifest);
  assert.equal(catalog.items.filter(row => row.trainerId === 'vilenkin6-part1').length, 27);
  const old = catalog.items.filter(row => row.trainerId !== 'vilenkin6-textbook');
  assert.equal(old.length, 378);
  assert.equal(sha256(JSON.stringify(old)), '86c3504c2d170b3afb208b96c4dc0a0fa689290fe646935683ab8c29691bf439');
});

test('one author supplement has three examples, sixteen conditions and six fresh checks', () => {
  assert.equal(supplements.length, 1);
  assert.equal(unit.id, 1008);
  assert.equal(unit.kind, 'author-supplement');
  assert.equal(unit.relatedPoint, 8);
  assert.deepEqual(unit.prereq, [6, 7, 8]);
  assert.equal(tasks.length, 44);
  assert.equal(new Set(tasks.map(task => task.id)).size, 44);
  assert.equal(tasks.filter(task => task.stage === 'example').length, 6);
  assert.equal(tasks.filter(task => task.stage === 'practice').length, 32);
  assert.equal(tasks.filter(task => task.stage === 'check').length, 6);
  assert.deepEqual(tasks.filter(task => task.stage === 'practice' && task.method === 'chain')
    .map(task => task.numbers), [
    [3,4,6], [4,6,8], [6,9,12], [8,12,18], [6,10,15], [12,18,30],
    [9,12,18], [8,9,12], [4,8,16], [5,5,10], [1,6,8], [6,8,12,18],
    [8,9,12,15], [4,6,9,10,15], [7,8,9], [2,3,4,5,6]
  ]);
  for (const task of tasks) {
    assert.match(task.id, /^v6-author-lcm-(example|practice|check)-\d{2}-(chain|factors)$/);
    assert(task.numbers.length >= 3 && task.numbers.length <= 5);
    assert(task.numbers.every(number => Number.isSafeInteger(number) && number > 0));
    if (task.stage === 'check') continue;
    const other = tasks.find(row => row.stage === task.stage && row.groupId === task.groupId && row.method !== task.method);
    assert(other, task.id + ' must have both methods');
    assert.deepEqual(other.numbers, task.numbers);
    assert.equal(other.answer, task.answer);
    if (task.stage === 'practice') {
      assert.equal(task.alternativeId, other.id);
      assert.equal(other.alternativeId, task.id);
    }
  }
});

test('author captions never impersonate a textbook exercise, page or paragraph', () => {
  const rows = manifest.filter(row => row.unitKind === 'author-supplement');
  assert.equal(rows.length, 44);
  assert.match(labels.unitSectionLabel(unit), /Авторское дополнение/);
  for (const task of tasks) {
    assert.equal(task.source.kind, 'author');
    assert.equal(task.source.relatedPoint, 8);
    assert.equal(Object.hasOwn(task.source, 'page'), false);
    assert.equal(Object.hasOwn(task.source, 'number'), false);
    assert.equal(labels.taskLabel(task), 'Авторское дополнение MathExam · ' + task.source.label);
    const row = rows.find(item => item.contentId === task.id);
    assert(row);
    assert.equal(row.unitId, 1008);
    assert.equal(row.relatedPoint, 8);
    for (const field of ['page', 'endPage', 'pointId', 'bookPart', 'chapterId', 'paragraphId']) {
      assert.equal(row[field], null, task.id + ' ' + field);
    }
    assert.match(row.sectionLabel, /Авторское дополнение/);
    assert(!/№|страниц|§\s*1008/.test(row.title));
  }
});

test('all 44 exact LCMs pass and larger common multiples cannot pass', () => {
  for (const task of tasks) {
    const least = firstCommonMultiple(task.numbers);
    assert.equal(Number(task.answer), least, task.id);
    assert.equal(task.answerType, 'integer');
    assert(math.check(answer(task), task.answer, task.answerType).ok, task.id);
    for (const raw of ['', '0', '-1', String(2 * least), String(3 * least)]) {
      assert(!math.check(raw, task.answer, task.answerType).ok, task.id + ' rejects ' + raw);
    }
    assert(task.solution.some(line => /Проверка:/.test(line)), task.id + ' division check');
    assert(task.solution.some(line => /наименьш|необходим|лишни|наибольш/.test(line)), task.id + ' minimality');
  }
  assert.equal(firstCommonMultiple([6, 10, 15]), 30, 'GCD 1 of all three does not justify multiplying them');
  assert.equal(firstCommonMultiple([7, 8, 9]), 504, 'The supplement is not limited by the old 200-number bank');
});

test('all 203 steps use the accumulated pair or maximum prime multiplicity, including one and duplicates', () => {
  let steps = 0, lcmInputs = 0, unitInputs = 0;
  for (const task of tasks) {
    if (task.method === 'chain') {
      assert.equal(task.steps.length, task.numbers.length - 1, 'No duplicate final confirmation');
      let accumulated = task.numbers[0];
      task.steps.forEach((step, index) => {
        assert.deepEqual(step.lcmInputs, [accumulated, task.numbers[index + 1]]);
        accumulated = firstCommonMultiple(step.lcmInputs);
        assert.equal(Number(step.answer), accumulated, task.id + ' pair ' + index);
        assert.equal(step.answerType, 'integer');
        lcmInputs++;
      });
    } else {
      assert.equal(task.method, 'factors');
      const rows = task.numbers.map(factors);
      const primes = [...new Set(rows.flat())].sort((a, b) => a - b);
      assert.equal(task.steps.length, rows.length + primes.length + 1);
      rows.forEach((values, index) => {
        const step = task.steps[index];
        assert.equal(step.lcmInputs, undefined);
        if (!values.length) {
          unitInputs++;
          assert.equal(step.answerType, 'integer');
          assert.equal(Number(step.answer), 0);
        } else {
          assert.equal(step.answerType, 'prime-factors');
          const written = answer(step).split(/\s*[·×*]\s*/).map(Number).sort((a, b) => a - b);
          assert.deepEqual(written, values, task.id + ' input ' + index);
          assert(math.check(values.slice().reverse().join(' * '), step.answer, step.answerType).ok);
        }
      });
      primes.forEach((prime, index) => {
        const step = task.steps[rows.length + index];
        assert.equal(step.answerType, 'integer');
        assert.equal(step.lcmInputs, undefined, 'Multiplicity is not an LCM answer');
        assert.equal(Number(step.answer), Math.max(...rows.map(values => values.filter(n => n === prime).length)));
      });
      const final = task.steps.at(-1);
      assert.deepEqual(final.lcmInputs, task.numbers);
      assert.equal(Number(final.answer), firstCommonMultiple(task.numbers));
      lcmInputs++;
    }
    for (const step of task.steps) {
      steps++;
      for (const field of ['prompt', 'hint', 'explain']) assert(step[field]?.trim(), task.id + ' ' + field);
      assert(math.check(answer(step), step.answer, step.answerType).ok, task.id + ' step answer');
      assert(!math.check('', step.answer, step.answerType).ok);
    }
  }
  assert.equal(steps, 203);
  assert.equal(lcmInputs, 76);
  assert.equal(unitInputs, 1);
  assert(!math.check('1', '1', 'prime-factors').ok, 'One must never be presented as a prime');
});

test('only six unseen conditions start independently; both taught methods remain supported practice', () => {
  const taught = new Set(tasks.filter(task => task.role === 'learn').map(task => key(task.numbers)));
  const checks = tasks.filter(task => task.role === 'check');
  assert.equal(tasks.filter(task => task.role === 'learn').length, 38);
  assert.equal(new Set(checks.map(task => key(task.numbers))).size, 6);
  for (const method of ['chain', 'factors']) {
    assert.deepEqual(checks.filter(task => task.method === method).map(task => task.numbers.length), [3,4,5]);
  }
  for (const task of tasks) {
    const {taskSpec, state} = contract.create(task.id, 37);
    assert.equal(state.version, 1);
    assert.equal(state.task.step, 0);
    assert.deepEqual(state.task.stepDrafts, []);
    assert.equal(state.task.draft, '');
    assert.equal(state.task.mode, task.role === 'learn' ? 'guided' : 'independent');
    if (task.role === 'learn') {
      const forged = structuredClone(state);
      forged.task.mode = 'independent';
      assert.throws(() => contract.normalize(taskSpec, forged));
    } else {
      assert(!taught.has(key(task.numbers)), task.id + ' must be new');
      assert.equal(task.alternativeId, undefined);
      assert.equal(contract.assistance(taskSpec, state), false);
    }
  }
});

test('all new source-helper projections fit existing bounds and preserve assistance', () => {
  for (const task of tasks) {
    const {taskSpec, state} = contract.create(task.id, 21);
    for (const mode of ['hint', 'step', 'solution']) {
      const result = contract.help(taskSpec, state, {
        mode, sourceRevision: taskSpec.sourceRevision, step: 0, workMode: state.task.mode
      });
      assert(result.help.lines.length > 0 && result.help.lines.length <= 16);
      assert(result.help.lines.every(line => line.length <= 2048));
      assert.equal(result.help.contentId, task.id);
      assert.equal(result.state.task.helped, true);
      assert.equal(result.state.task.step, 0);
      assert.equal(result.state.task.status, '');
      const erased = structuredClone(result.state);
      erased.task.helped = false;
      assert.throws(() => contract.normalize(taskSpec, erased, result.state));
    }
  }
});
