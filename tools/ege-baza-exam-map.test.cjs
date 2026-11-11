'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const files = ['registry', 'foundation-reference', 'data-reference', 'course-definitions', 'course-state', 'backup',
  'path/data', 'path/practice', 'path/equation-practice', 'course-journey', 'exam-map'];
const expectedCounts = [4, 4, 4, 4, 3, 4, 3, 3, 3, 4, 5, 7, 7, 6, 11, 8, 11, 5, 4, 9, 7];
const anchors = ['round', 'units', 'data', 'formulas', 'probability', 'choice', 'graphs', 'logic', 'grid', 'practical',
  'box', 'triangle', 'roundbody', 'fractions', 'percent', 'powers', 'equations', 'numberline', 'integers', 'motion', 'reasoning'];
const plain = value => JSON.parse(JSON.stringify(value));
function runtime() {
  const ctx = vm.createContext({});
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(root, 'ege-baza', file + '.js'), 'utf8'), ctx, { filename: file });
  return ctx;
}
function store(values = {}, blocked = false) {
  const bytes = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, typeof value === 'string' ? value : JSON.stringify(value)]));
  return { bytes, writes: 0, getItem(key) { if (blocked) throw Error('blocked'); return bytes[key] ?? null; },
    setItem() { this.writes++; throw Error('read-only map'); }, removeItem() { this.writes++; throw Error('read-only map'); } };
}
const row = extra => ({ seed: 12, stage: 3, step: 0, help: false, attempted: false, independent: 0, guided: 0, note: '', draft: '', checks: [], ...extra });
const save = lessons => ({ version: 1, serial: 30, lessons, seen: {}, runs: [], active: null });
function map(ctx, storage) { return ctx.EgeBazaExamMap.catalog(ctx.EgeBazaJourney.snapshot(storage)); }

test('the exam map has all 21 numbered positions and exactly the 116 preparation families', () => {
  const ctx = runtime(), storage = store(), cards = map(ctx, storage);
  assert.deepEqual(plain(cards.map(card => card.pos)), Array.from({ length: 21 }, (_, i) => i + 1));
  assert.deepEqual(plain(cards.map(card => card.total)), expectedCounts);
  const ids = cards.flatMap(card => card.items.map(item => item.id));
  assert.equal(ids.length, 116); assert.equal(new Set(ids).size, 116);
  const actual = ctx.PathData.meta.filter(item => !item.grade7 && !item.pre7);
  assert.deepEqual(plain(ids).sort(), plain(actual.map(item => item.id)).sort());
  for (const card of cards) {
    assert(card.title.length > 3 && card.description.length > 5);
    assert.equal(card.href, '#task?pos=' + card.pos);
    assert(card.items.some(item => item.id === anchors[card.pos - 1]));
    for (const item of card.items) {
      assert.equal(actual.find(meta => meta.id === item.id).pos, card.pos, 'family belongs to the displayed exam number');
      assert.equal(item.href, '/ege-baza/path/index.html#lesson=' + item.id);
    }
    assert.equal(card.started, 0); assert.equal(card.independent, 0);
  }
  assert.equal(storage.writes, 0);
});

test('return and next links stay inside their exam number; the final family never spills into another task', () => {
  const ctx = runtime(), cards = map(ctx, store());
  for (const card of cards) for (let i = 0; i < card.items.length; i++) {
    const item = card.items[i], info = ctx.EgeBazaExamMap.forLesson(item.id), next = ctx.EgeBazaExamMap.nextLesson(item.id);
    assert.equal(info.pos, card.pos); assert(info.title.includes(card.title)); assert(info.title.includes('№' + card.pos));
    assert.equal(info.href, '/ege-baza/index.html#task?pos=' + card.pos);
    assert.equal(next?.id || null, card.items[i + 1]?.id || null);
  }
  for (const id of ['missing', 'grade7-a-expression-structure', '<script>', '']) {
    assert.equal(ctx.EgeBazaExamMap.forLesson(id), null);
    assert.equal(ctx.EgeBazaExamMap.nextLesson(id), null);
  }
});

test('progress is per family and per number: repeated successes do not inflate it, assistance stays separate', () => {
  const ctx = runtime(), key = ctx.EgeBazaJourney.keys.path;
  const storage = store({ [key]: save({ box: row({ independent: 8, done: true }), roundbody: row({ guided: 3, done: true }),
    equations: row({ draft: '7/' }), 'practice-faces': row({ independent: 1, done: true }) }) });
  const before = JSON.stringify(storage.bytes), cards = map(ctx, storage);
  assert.equal(cards[10].independent, 2); assert.equal(cards[10].started, 2); assert.equal(cards[10].total, 5);
  assert.equal(cards[12].independent, 0); assert.equal(cards[12].started, 1);
  assert.equal(cards[16].independent, 0); assert.equal(cards[16].started, 1);
  assert(cards[16].items.find(item => item.id === 'equations').resume);
  assert(cards.filter(card => ![11, 13, 17].includes(card.pos)).every(card => card.started === 0 && card.independent === 0));
  assert.equal(JSON.stringify(storage.bytes), before); assert.equal(storage.writes, 0);
});

test('legacy module successes remain separate and never award all the numbered task families', () => {
  const ctx = runtime(), bank = ctx.EgeBazaCourseState.forModule('m01').bank;
  const practice = Object.fromEntries(bank.tasks.filter(task => task.phase === 'practice').map(task =>
    [task.id, { tries: 1, hints: false, solution: false, done: true, answer: String(task.answer) }]));
  const storage = store({ [ctx.EgeBazaJourney.keys.m01]: { v: 1, practice, runs: {} }, sentinel: 'keep' });
  const before = JSON.stringify(storage.bytes), snapshot = ctx.EgeBazaJourney.snapshot(storage), cards = ctx.EgeBazaExamMap.catalog(snapshot);
  assert(snapshot.lines[0].groups.find(group => group.source === 'm01').independent > 0);
  assert(cards.every(card => card.independent === 0 && card.started === 0));
  assert.equal(JSON.stringify(storage.bytes), before); assert.equal(storage.writes, 0);
});

test('corrupt and blocked storage remain unknown, while a readable sibling keeps its historical result', () => {
  const ctx = runtime(), key = ctx.EgeBazaJourney.keys.path;
  for (const storage of [store({ [key]: '{broken' }), store({}, true)]) {
    const before = JSON.stringify(storage.bytes), cards = map(ctx, storage);
    assert(cards.every(card => card.started === null && card.independent === null));
    assert.equal(JSON.stringify(storage.bytes), before); assert.equal(storage.writes, 0);
  }
  const storage = store({ [key]: save({ box: row({ independent: 1 }), fractions: { broken: true } }) });
  const before = JSON.stringify(storage.bytes), cards = map(ctx, storage);
  assert.equal(cards[10].independent, 1);
  assert.equal(cards[13].started, null); assert.equal(cards[13].independent, null);
  assert(cards.flatMap(card => card.items).every(item => !item.resume), 'damaged whole save cannot promise exact continuation');
  assert.equal(JSON.stringify(storage.bytes), before); assert.equal(storage.writes, 0);
});
