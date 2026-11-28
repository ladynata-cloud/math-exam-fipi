'use strict';
const assert = require('node:assert/strict');
const {test} = require('node:test');
const {lines, missions} = require('../trainers/oge-basics/multiplication-division/arzhenikov-discoveries-bank.js');

// These answers were worked out from the authored conditions, independently of
// the builders in the content bank and of the browser answer checker.
const cases = [
  ['meanings-1', [4], 'each', 'receivers', 12, [4, 4, 4]],
  ['meanings-2', [4], 'groups', 'size', 12, [3, 3, 3, 3]],
  ['meanings-3', [5], 'each', 'receivers', 10, [5, 5]],
  ['meanings-4', [3], 'groups', 'size', 15, [5, 5, 5]],
  ['change-1', [3, 12], 'less', 'stock', 12, [3, 3, 3, 3]],
  ['change-2', [4, 16], 'stock', 'each', 16, [4, 4, 4, 4]],
  ['change-3', [4, 12], 'less', 'stock', 12, [4, 4, 4]],
  ['change-4', [3, 12], 'stock', 'each', 12, [3, 3, 3, 3]],
  ['adjust-1', [3, 4], 'rest', 'filled', 20, [5, 5, 5, 5]],
  ['adjust-2', [2, 3], 'rest', 'removed', 15, [5, 5, 5]],
  ['adjust-3', [3, 4], 'rest', 'filled', 16, [4, 4, 4, 4]],
  ['adjust-4', [0, 4], 'rest', 'none', 12, [3, 3, 3, 3]],
  ['boundary-1', [3, 3, 0], 'more-full', 'left', 12, [4, 4, 4]],
  ['boundary-2', [3, 4, 1], 'more-boxes', 'left', 13, [4, 4, 4, 1]],
  ['boundary-3', [0, 1, 2], 'partial', 'left', 2, [2]],
  ['boundary-4', [1, 2, 3], 'same-boxes', 'left', 7, [4, 3]],
  ['reverse-1', [12, 14], 'groups-rest', 'rest', 14, [3, 3, 3, 3, 2]],
  ['reverse-2', [12, 13], 'size', 'rest', 13, [4, 4, 4, 1]],
  ['reverse-3', [15, 17], 'groups-rest', 'rest', 17, [5, 5, 5, 2]],
  ['reverse-4', [12, 13], 'rest', 'rest', 13, [3, 3, 3, 3, 1]],
  ['sequence-1', [12, 4], 'reserve', 'part', 18, [6, 4, 4, 4]],
  ['sequence-2', [12, 10], 'whole', 'whole', 12, [1, 3, 3, 3, 2]],
  ['sequence-3', [15, 5], 'reserve', 'part', 20, [5, 5, 5, 5]],
  ['sequence-4', [12, 9], 'whole', 'whole', 12, [1, 4, 4, 3]]
];

test('six learning lines provide two investigations and two fresh checks each', () => {
  assert.equal(lines.length, 6); assert.equal(missions.length, 24);
  assert.equal(new Set(missions.map(m => m.id)).size, 24);
  assert.equal(new Set(missions.map(m => m.story)).size, 24);
  for (const line of lines) {
    const own = missions.filter(m => m.line === line.id);
    assert.equal(own.length, 4);
    assert.deepEqual(own.map(m => m.mode), ['practice', 'practice', 'check', 'check']);
    assert(own.every(m => m.id.startsWith(line.id + '-')));
  }
});

test('all 24 numeric and semantic answers agree with independent worked cases', () => {
  assert.equal(cases.length, missions.length);
  for (const [id, values, prediction, reason] of cases) {
    const m = missions.find(mission => mission.id === id);
    assert(m, id);
    assert.deepEqual(m.fields.map(field => field.answer), values, id + ': arithmetic');
    assert.equal(m.prediction.answer, prediction, id + ': prediction meaning');
    assert.equal(m.reason.answer, reason, id + ': explanatory meaning');
    assert.equal(new Set(m.fields.map(field => field.id)).size, m.fields.length);
    assert(m.fields.every(field => field.label.length > 8 && field.clue.length > 15));
    for (const q of [m.prediction, m.reason]) {
      assert.equal(new Set(q.options.map(option => option.value)).size, q.options.length);
      assert.equal(q.options.filter(option => option.value === q.answer).length, 1);
      assert(q.options.length >= 3 && q.clue.length > 15);
    }
  }
});

test('every investigation has a constructible, conserved object arrangement', () => {
  for (const [id, , , , total, solved] of cases) {
    const m = missions.find(mission => mission.id === id), a = m.activity;
    assert.equal(a.targetTotal, total, id);
    assert.equal(a.labels.length, a.initialPiles.length, id);
    assert.equal(a.labels.length, a.capacities.length, id);
    assert(solved.length <= a.labels.length, id + ': enough real containers');
    const piles = solved.concat(Array(a.labels.length - solved.length).fill(0));
    assert.equal(piles.reduce((n, value) => n + value, 0), total, id + ': conserved total');
    assert(piles.every((value, index) => value >= 0 && value <= a.capacities[index]), id + ': capacity');
    assert(a.initialPiles.every((value, index) => value >= 0 && value <= a.capacities[index]), id + ': initial capacity');
    assert(a.initialPiles.reduce((n, value) => n + value, 0) <= a.total, id + ': initial stock');
    for (let i = 0; i < (a.lockedGroups || 0); i++) assert.equal(piles[i], a.initialPiles[i], id + ': preserved old set');
    if (a.goal === 'equal') assert(piles.every(value => value === piles[0]), id);
    if (a.goal === 'full') assert(piles.every(value => value === 0 || value === a.size), id);
    if (a.goal === 'all') assert(piles.filter(value => value > 0 && value < a.size).length <= 1, id);
    if (a.goal === 'build') { assert(piles.slice(0, a.groups).every(value => value === a.size)); assert.equal(piles[a.groups], a.rest); }
    if (a.goal === 'reserve') { assert.equal(piles[0], a.reserve); assert(piles.slice(1).every(value => value === piles[1])); }
    if (a.goal === 'takeaway') assert.equal(piles[a.reserveIndex], a.reserve);
    if (a.adjust === 'add') assert(a.targetTotal >= a.total && a.targetTotal <= a.maxTotal);
    if (a.adjust === 'remove') assert(a.targetTotal <= a.total);
  }
});

test('critical contrasts include the same quotient with different units, no leftover and no full groups', () => {
  const get = id => missions.find(m => m.id === id);
  assert.equal(get('meanings-1').fields[0].answer, get('meanings-2').fields[0].answer);
  assert.notEqual(get('meanings-1').fields[0].label, get('meanings-2').fields[0].label);
  assert.notEqual(get('meanings-1').reason.answer, get('meanings-2').reason.answer);
  assert.deepEqual(get('boundary-3').fields.map(f => f.answer), [0, 1, 2]);
  assert.deepEqual(get('boundary-1').fields.map(f => f.answer), [3, 3, 0]);
  assert.deepEqual(get('boundary-2').fields.map(f => f.answer), [3, 4, 1]);
  assert.equal(get('adjust-4').fields[0].answer, 0);
  assert.equal(get('reverse-2').prediction.answer, 'size');
  assert.equal(get('reverse-4').prediction.answer, 'rest');
});

test('minimal additions and removals, inverse totals and two-step quantities hold independently', () => {
  for (const m of missions) {
    const a = m.activity;
    if (m.line === 'adjust') {
      const leftovers = a.total % a.size;
      const changed = a.adjust === 'add' ? (a.size - leftovers) % a.size : leftovers;
      assert.equal(m.fields[0].answer, changed);
      assert(changed >= 0 && changed < a.size);
    }
    if (m.line === 'reverse') assert.equal(m.fields[1].answer, a.groups * a.size + a.rest);
    if (a.goal === 'reserve') {
      assert.equal(m.fields[0].answer, a.total - a.reserve);
      assert.equal(m.fields[1].answer * a.groups + a.reserve, a.total);
    }
    if (a.goal === 'takeaway') assert.equal(m.fields[1].answer + a.reserve, m.fields[0].answer);
  }
});
