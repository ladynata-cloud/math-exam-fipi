'use strict';
const assert = require('node:assert/strict');
const {before, test} = require('node:test');
const fs = require('node:fs');
const {execFileSync} = require('node:child_process');
const {restoreAlignment} = require('./oge-source-alignment-06-09-preservation.cjs');
const {sources, tasks, completeCorpus} = require('../trainers/oge-sources/coverage-06-09.json');
let math;
before(async () => {math = await import('./oge-algebra-contract.lib.mjs');});

const direct = row => math.loadTrainer(row.trainer);
const legacyRoom = row => {
  const html = fs.readFileSync(row.trainer, 'utf8');
  return math.loadTrainer(row.trainer, {html: '<script>window.OgeCourseSharedMode=true;</script>' + html});
};

test('coverage distinguishes samples, exact matches, partial coverage and author conditions', () => {
  assert.equal(completeCorpus, false);
  assert.deepEqual(tasks.map(row => row.number), [6, 7, 8, 9]);
  assert.equal(sources.length, 5);
  for (const source of sources) {
    assert.match(source.url, /^https:\/\//);
    assert.deepEqual(source.positions, [6, 7, 8, 9]);
  }
  for (const row of tasks) {
    const trainer = direct(row);
    assert.equal(trainer.run(row.number === 6 ? 'TASKS.length' : 'BANK.length'), row.bank.fixed);
    assert.deepEqual(row.sampleMappings.map(sample => sample.source).sort(), sources.map(source => source.id).sort());
    for (const sample of row.sampleMappings) assert.ok(sample.operations && sample.match && sample.status);
  }
  assert.equal(tasks[0].sampleMappings.find(row => row.source === 'statgrad-2026-09').match, 'adv#11');
  assert.match(tasks[2].sampleMappings.find(row => row.source === 'statgrad-2026-09').status, /частично/);
});

test('each source delta restores the complete predecessor and rejects missing or repeated fragments', () => {
  const edits = require('./fixtures/oge-source-alignment-06-09-inverse.json');
  for (const row of tasks) {
    const source = fs.readFileSync(row.trainer, 'utf8');
    const original = execFileSync('git', ['show', `${require('../trainers/oge-sources/coverage-06-09.json').base}:${row.trainer}`], {encoding:'utf8'});
    assert.equal(restoreAlignment(row.trainer, source), original);
    for (const {after} of edits[row.trainer]) {
      assert.throws(() => restoreAlignment(row.trainer, source.replace(after, '')), /fragment/);
      assert.throws(() => restoreAlignment(row.trainer, source + after), /fragment/);
    }
    assert.notEqual(restoreAlignment(row.trainer, source + '<!-- foreign change -->'), original);
  }
});

test('decimal compound fraction has a finite answer and a valid, preserved historical queue', () => {
  const row = tasks[0], trainer = direct(row);
  const newTask = trainer.run('TASKS[fractionAnalogueIndex]');
  assert.equal(newTask.ansDisp, '0,96');
  assert.equal(newTask.html.includes('1,08'), true);
  const answer = math.div(math.R(108, 100), math.add(math.ONE, math.R(1, 8)));
  assert.equal(math.str(answer), '24/25');
  assert.deepEqual(Array.from(trainer.run('Task6Hints.plan(TASKS[fractionAnalogueIndex]).final')), [24n, 25n]);
  const oldOrder = Array.from(trainer.run('TASKS.map((t,i)=>t.cat==="adv"&&i!==fractionAnalogueIndex?i:null).filter(x=>x!==null)')).reverse();
  const saved = {v:1, cat:'adv', order:oldOrder, pos:2, shuffle:true, streak:1,
    records:{[oldOrder[0]]:{wrongAttempts:0, status:'solved-first', lastInput:'3', answerWasRevealed:false}}};
  const restore = value => math.loadTrainer(row.trainer, {storage:math.makeStorage(new Map([['mathExam.oge6.practice.v1',JSON.stringify(value)]]))});
  const resumed = restore(saved);
  assert.equal(resumed.run('pos'), 2);
  assert.deepEqual(Array.from(resumed.run('order')), [...oldOrder, row.authored.index]);
  assert.deepEqual(JSON.parse(resumed.run('JSON.stringify(records)')), saved.records);
  assert.equal(resumed.run('records[fractionAnalogueIndex]'), undefined);
  const malicious = {...saved, order:oldOrder.slice(1)};
  assert.equal(restore(malicious).run('cat'), 'bank');
});

test('standalone author conditions and prior shared indices have distinct answer and state identities', () => {
  const [seven, eight, nine] = tasks.slice(1);
  for (const row of [seven, eight, nine]) {
    const trainer = direct(row), shared = legacyRoom(row), map = row.authored;
    assert.equal(trainer.run(`BANK[${map.index}].id`), map.id);
    assert.equal(shared.run(`BANK[${map.legacySharedIndex}].id`), map.legacyId);
    assert.equal(shared.run('BANK.length'), row.bank.fixed + 1);
    assert.equal(shared.run(`BANK[${map.sharedIndex}].id`), map.id);
    assert.equal(trainer.run(`BANK.some(t=>t.id===${JSON.stringify(map.legacyId)})`), false);
  }
  const point = direct(seven).run(`BANK[${seven.authored.index}]`);
  const ordered = Array.from(point.nums, math.parseNum).sort(math.cmp);
  assert.equal(ordered.findIndex(value => math.eq(value, math.parseNum(point.targetStr))) + 1, 3);
  assert.deepEqual(Array.from(point.pic.pts, v => v.x), ordered.map(v => Number(v.n) / Number(v.d)));
  const roots = direct(eight).run(`BANK[${eight.authored.index}]`);
  const params = roots.p;
  assert.equal(math.str(math.mul(math.R(params.k1 * params.k2), math.sqrtExact(math.R(params.m1 * params.m2 * params.m3)))), '360');
  const equation = direct(nine);
  assert.equal(equation.run('checkFinal(EXAM_BANK[0], "-13").ok'), true);
  assert.equal(equation.run('checkFinal(EXAM_BANK[0], "-32").ok'), false);
  assert.equal(new Set(equation.run('EXAM_BANK.map(task=>task.examKind)')).size, 7);
});
