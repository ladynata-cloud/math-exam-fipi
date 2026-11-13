'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { lessons } = require('../trainers/ege-methods/content.js');
const S = require('../trainers/ege-methods/state.js');

const by = id => S.byId.get(id);
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const sums = (sizes, count) => Array.from({ length: count }, () => sizes)
  .reduce((values, sizes) => [...new Set(values.flatMap(value => sizes.map(size => value + size)))].sort((a, b) => a - b), [0]);
const steps = id => by(id).steps.map(step => step.field.answer);
const answers = id => by(id).practice.fields.map(field => field.answer);
const text = value => Array.isArray(value) ? value.join('; ') : String(value);

test('all modelled guided steps and fresh tasks match independent calculations', () => {
  const t = sums(range(2, 5), 4);
  const p = sums(range(3, 7), 5);
  assert.deepEqual(steps('bounds'), [t[0], t.at(-1), t.includes(22) ? 'lower' : 'upper']);
  assert.deepEqual(answers('bounds'), [p[0], p.at(-1), p.includes(36) ? 'yes' : 'no']);

  const ints = range(-10, 10).filter(n => n > -2 && n <= 2.5);
  assert.deepEqual(steps('integers'), [ints[0], ints.at(-1), ints]);
  assert.deepEqual(answers('integers'), [range(-10, 10).filter(n => n > -3.5 && n < 0)]);

  const multiples = range(20, 40).filter(n => n % 4 === 0);
  assert.deepEqual(steps('divisibility'), [multiples[1] - multiples[0], multiples, multiples.filter(n => n % 3 === 1)]);
  assert.deepEqual(answers('divisibility'), [range(15, 50).filter(n => n % 6 === 0 && n % 5 === 3)]);

  const triples = range(0, 5).find(k => (5 - k) * 2 + 3 * k === 13);
  assert(!sums([2, 4], 5).includes(13));
  assert.deepEqual(steps('construction'), [sums([2], 5)[0], triples, 'parity']);
  const sevens = range(0, 6).find(k => (6 - k) * 4 + 7 * k === 33);
  assert(!sums([4, 7], 6).includes(34));
  assert.deepEqual(answers('construction'), [6 - sevens, sevens, 'change']);

  const teams = range(1, 12).filter(n => sums([5, 6, 7], n).includes(46));
  assert.deepEqual(steps('double-inequality'), ['bounds', teams[0], teams.at(-1), 46 - 5 * 7 - 5]);
  const groups = range(1, 12).filter(n => sums([8, 9], n).includes(67));
  assert.deepEqual(groups, [8]);
  assert.deepEqual(answers('double-inequality'), [groups[0], range(0, 8).find(k => 9 * k + 8 * (8 - k) === 67)]);

  const x = range(5, 12).filter(n => range(8, 15).includes(18 - n));
  assert.deepEqual(steps('intersection'), ['rest', 'limits', x]);
  const xx = range(5, 11).filter(n => range(10, 16).includes(23 - n));
  assert.deepEqual(answers('intersection'), [xx[0], xx.at(-1), 23 - xx.at(-1)]);

  function distributions(total, distinct) {
    return range(4, total).flatMap(a => range(4, total).map(b => [a, b, total - a - b]))
      .filter(nums => nums[2] >= 4 && (!distinct || new Set(nums).size === 3));
  }
  const all = distributions(18, false);
  const max = Math.max(...all.map(([a]) => a));
  assert.deepEqual(steps('maximum'), [Math.min(...all.map(([, b, c]) => b + c)), max, all.find(([a, b]) => a === max && b === 4)[2]]);
  const varied = distributions(20, true);
  const best = Math.max(...varied.map(([a]) => a));
  const bestSet = varied.find(([a]) => a === best).slice().sort((a, b) => a - b);
  assert.deepEqual(answers('maximum'), [best, bestSet]);

  function packings(total, small, large) {
    return range(1, total).flatMap(n => range(0, n).map(k => [n, k]))
      .filter(([n, k]) => (n - k) * small + k * large === total);
  }
  const cakes = packings(37, 3, 5);
  assert.deepEqual(steps('combined'), [range(1, 37).filter(n => 3 * n <= 37 && 37 <= 5 * n),
    cakes.map(([n]) => n), ...cakes.map(([, k]) => k)]);
  const pencils = packings(43, 4, 7);
  assert.deepEqual(answers('combined'), [pencils.map(([n]) => n), ...pencils.map(([, k]) => k)]);
});

test('exact checking handles Unicode signs, sets, alternate number forms and invalid input', () => {
  const f = by('integers').steps[0].field;
  const set = by('integers').steps[2].field;
  for (const value of ['−1', '-1', '-2/2', '-1,0', '-1.00', '  -1  ']) assert.equal(S.check(f, value), 'correct', value);
  for (const value of ['-1.01', '−0,5', 'NaN', '-1e0', '1/0', '2−3']) assert.equal(S.check(f, value), 'format', value);
  for (const value of ['0', '1', '-2']) assert.equal(S.check(f, value), 'wrong', value);
  assert.equal(S.check(f, '   '), 'missing');
  assert.equal(S.check(set, '0; −1; 2; 1'), 'correct');
  assert.equal(S.check(set, '0, -1, 2, 1'), 'correct');
  assert.equal(S.check(set, '-1; 0; 1; 1'), 'wrong');
  assert.equal(S.check(set, '-2; -1; 0; 1; 2'), 'wrong');
  assert.equal(S.check(set, '-1; 0; 1'), 'wrong');
  assert.equal(S.check(set, '-1; 0; 1; 2;'), 'format');
});

test('empty and malformed entries preserve attempts; guided errors reveal a hint; independent practice stays separate', () => {
  for (const lesson of lessons) {
    const r = S.empty(lesson);
    S.answerGuide(r, lesson, 0, ' ');
    assert.equal(r.guide.misses, 0);
    assert.equal(r.guide.hint, false);
    const field = lesson.steps[0].field;
    const wrong = field.kind === 'list' ? '999; 998' : '999';
    S.answerGuide(r, lesson, 0, wrong);
    assert.equal(r.guide.hint, false);
    S.answerGuide(r, lesson, 0, wrong);
    assert.equal(r.guide.hint, true);
    lesson.steps.forEach((step, i) => S.answerGuide(r, lesson, i, text(step.field.answer)));
    assert.equal(r.guide.solved.length, lesson.steps.length);
    assert.equal(r.practice.done, false);
    S.answerPractice(r, lesson, r.practice.drafts);
    assert.equal(r.practice.attempts, 0);
    const drafts = lesson.practice.fields.map(field => text(field.answer));
    S.answerPractice(r, lesson, drafts);
    S.answerPractice(r, lesson, drafts);
    assert.equal(r.practice.attempts, 1);
    assert.equal(r.practice.done, true);
    assert.equal(S.validRecord(lesson, r), true);
    const forged = structuredClone(r);
    forged.practice.drafts[0] = '999';
    assert.equal(S.validRecord(lesson, forged), false);
  }
});

test('work in different tabs uses the same per-lesson lock; a corrupt record is not overwritten', async () => {
  const data = new Map([['mathExam.profile.partTwo.v1.keep', 'old profile'], ['mathexam.ege-baza.reasoning.draft.v1', 'old base']]);
  const storage = { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) };
  let queue = Promise.resolve();
  const locks = { request(key, callback) { assert.match(key, /^mathexam\.ege-methods\.v1\./); return queue = queue.then(callback); } };
  let warnings = 0;
  const a = S.createProgress(storage, locks, () => warnings++);
  const b = S.createProgress(storage, locks, () => warnings++);
  const lesson = by('bounds');
  await Promise.all([
    a.update(lesson, record => S.answerGuide(record, lesson, 0, '8')),
    b.update(lesson, record => S.answerGuide(record, lesson, 1, '20'))
  ]);
  assert.deepEqual(a.read(lesson).guide.solved, ['8', '20']);
  const corrupt = by('maximum');
  data.set(S.prefix + corrupt.id, '{broken data');
  await a.update(corrupt, ({ practice }) => { practice.proof = 'новый текст'; });
  assert.equal(a.read(corrupt).practice.proof, 'новый текст');
  assert.equal(data.get(S.prefix + corrupt.id), '{broken data');
  assert.equal(warnings, 1);
  assert.equal(data.get('mathExam.profile.partTwo.v1.keep'), 'old profile');
  assert.equal(data.get('mathexam.ege-baza.reasoning.draft.v1'), 'old base');

  const privateSession = S.createProgress(undefined, undefined, () => warnings++);
  await privateSession.update(lesson, ({ guide }) => { guide.draft = '5'; });
  assert.equal(privateSession.read(lesson).guide.draft, '5');
  assert.equal(warnings, 2);
});

test('room routes accept validated course records and reject incompatible saved states', () => {
  const l = by('construction');
  const valid = { view: S.route('#lesson/construction'), records: { construction: S.empty(l) } };
  assert.equal(S.validRoom(valid), true);
  assert.equal(S.validRoom({ ...valid, view: { page: 'lesson', id: 'missing' } }), false);
  assert.equal(S.validRoom({ ...valid, records: { fake: S.empty(l) } }), false);
  valid.records.construction.guide.model = 32;
  assert.equal(S.validRoom(valid), false);
  valid.records.construction.guide.model = 31;
  valid.records.construction.guide.solved = ['123'];
  assert.equal(S.validRoom(valid), false);
  assert.deepEqual(S.route('#lesson/__proto__'), { page: 'map', id: null });
});

test('transfer destinations target the existing profile and base banks', () => {
  const root = path.resolve(__dirname, '..');
  const profile = fs.readFileSync(path.join(root, 'ege-profil/part-two/content-models.js'), 'utf8');
  const base = fs.readFileSync(path.join(root, 'ege-baza/path/practice.js'), 'utf8');
  for (const lesson of lessons) {
    for (const link of lesson.links) {
      const url = new URL(link.href, 'https://mathexam.space');
      if (link.title.startsWith('Профиль №20')) assert(profile.includes("add('" + url.hash.split('/').at(-1) + "',20,"));
      else assert(base.replace(/,\s+/g, ',').includes("add('" + url.hash.split('practice-').at(-1) + "',21,"));
    }
  }
});
