'use strict';

const assert = require('node:assert/strict');
const {test} = require('node:test');
const {missions} = require('../trainers/oge-basics/multiplication-division/arzhenikov-harbor-bank.js');

// These fixed cases are the approved teaching sequence, not answers imported
// from the trainer. The browser gate checks the trainer against the same facts.
const cases = [
  ['exact', 12, 4, 3, 0, 3],
  ['remainder', 14, 4, 3, 2, 4],
  ['floor', 14, 4, 3, 2, 4],
  ['ceil', 14, 4, 3, 2, 4],
  ['exact', 15, 5, 3, 0, 3],
  ['remainder', 17, 5, 3, 2, 4],
  ['floor', 17, 5, 3, 2, 4],
  ['ceil', 17, 5, 3, 2, 4],
  ['exact', 12, 3, 4, 0, 4],
  ['remainder', 10, 3, 3, 1, 4],
  ['floor', 12, 4, 3, 0, 3],
  ['ceil', 12, 4, 3, 0, 3]
];

function physicalCounts(total, capacity) {
  let complete = 0, loose = total;
  while (loose >= capacity) { loose -= capacity; complete++; }
  let containers = 0;
  while (containers * capacity < total) containers++;
  return {complete, loose, containers};
}

test('the twelve missions retain their approved order, quantities and questions', () => {
  assert.equal(missions.length, cases.length);
  assert.deepEqual(missions.map(m => [m.kind, m.total, m.capacity]), cases.map(c => c.slice(0, 3)));
  assert.deepEqual(missions.map(m => m.id), cases.map((_, index) => String(index + 1)));
  for (const [index, mission] of missions.entries()) {
    const [, total, capacity, complete, loose, containers] = cases[index];
    assert.deepEqual(physicalCounts(mission.total, mission.capacity), {complete, loose, containers}, mission.id);
    assert.equal(total, complete * capacity + loose, mission.id);
    assert(loose >= 0 && loose < capacity, mission.id + ': remainder must be smaller than a full group');
    if (mission.kind === 'exact') assert.equal(loose, 0, mission.id + ': exact division cannot have a remainder');
    if (mission.kind === 'remainder') assert(loose > 0, mission.id + ': these three tasks explicitly practise a remainder');
  }
});

test('full sets and capacity for every object differ only when a remainder exists', () => {
  for (const [floorId, ceilId] of [['3', '4'], ['7', '8'], ['11', '12']]) {
    const down = missions.find(m => m.id === floorId), up = missions.find(m => m.id === ceilId);
    assert.equal(down.kind, 'floor');
    assert.equal(up.kind, 'ceil');
    assert.deepEqual([down.total, down.capacity], [up.total, up.capacity]);
    const {complete, loose, containers} = physicalCounts(down.total, down.capacity);
    assert.equal(containers - complete, Number(loose > 0));
    assert((complete + 1) * down.capacity > down.total, 'No additional full set can be made');
    assert(containers * up.capacity >= up.total, 'All objects have a place');
    assert((containers - 1) * up.capacity < up.total, 'One fewer container cannot hold everything');
  }
  assert.deepEqual(physicalCounts(missions[10].total, missions[10].capacity), {complete: 3, loose: 0, containers: 3});
  assert.deepEqual(physicalCounts(missions[11].total, missions[11].capacity), {complete: 3, loose: 0, containers: 3});
  assert.equal(physicalCounts(missions[7].total, missions[7].capacity).containers, 4);
  assert.equal(Math.round(missions[7].total / missions[7].capacity), 3,
    'Capacity rounding must not be replaced by rounding to the nearest whole number');
});

test('missions have distinct usable contexts and fit the child-sized exploration range', () => {
  for (const field of ['id', 'title', 'prompt']) assert.equal(new Set(missions.map(m => m[field])).size, missions.length, field);
  for (const mission of missions) {
    assert(Number.isInteger(mission.total) && mission.total >= 2 && mission.total <= 20, mission.id + ': object range');
    assert(Number.isInteger(mission.capacity) && mission.capacity >= 2 && mission.capacity <= 6, mission.id + ': capacity range');
    for (const field of ['title', 'prompt', 'question', 'answerLabel', 'hint', 'item', 'itemName', 'container']) {
      assert.equal(typeof mission[field], 'string', mission.id + ': ' + field);
      assert(mission[field].trim().length > 0, mission.id + ': empty ' + field);
    }
    const mentioned = (mission.prompt.match(/\d+/g) || []).map(Number);
    assert(mentioned.includes(mission.total), mission.id + ': the story must state its stock');
    assert(mentioned.includes(mission.capacity), mission.id + ': the story must state the group size');
    assert(mission.question.endsWith('?'), mission.id + ': a child needs an explicit question');
    if (mission.kind === 'ceil') assert(/все|всех/.test(mission.question), mission.id + ': the question must require transporting every object');
    if (mission.kind === 'floor') assert(/полн/.test(mission.question), mission.id + ': the question must require complete sets');
  }
});
