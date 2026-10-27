import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTrainer } from './oge-geometry-contract.lib.mjs';

const trainer = loadTrainer('trainers/oge-task17-quadrilaterals.html', { seed: 20261028 });
const check = (task, raw) => trainer.run(`isRight(${JSON.stringify(task)},${JSON.stringify(raw)})`);

test('OGE17: concatenated lengths reject signs, text and inserted separators', () => {
  const task = JSON.parse(trainer.run('JSON.stringify(build("rhombHeightSegments",S17.rhombHeightSegments.proto,{}))'));
  assert.equal(task.ans, '1717');
  assert.equal(check(task, '1717'), true);
  assert.equal(check(task, ' 1717 '), true, 'outer whitespace is harmless');
  for (const raw of ['garbage 1717', '1717 garbage', '-1717', '+1717', '−1717', '17 17', '17,17', '17.17', '17/17', '1717°', '<b>1717</b>', '', '  ', '1177', '01717']) {
    assert.equal(check(task, raw), false, JSON.stringify(raw));
  }
});

test('OGE17: every generated and archived concatenation keeps its exact accepted answer', () => {
  const tasks = JSON.parse(trainer.run(`JSON.stringify([
    ...Array.from({length:100},()=>build('rhombHeightSegments',S17.rhombHeightSegments.gen(),{})),
    ...ARCHIVE.filter(row=>row.sub==='rhombHeightSegments').map(row=>build(row.sub,row.p,{}))
  ].map(task=>({ansFmt:task.ansFmt,ans:task.ans})))`));
  assert.ok(tasks.length > 100);
  for (const task of tasks) {
    assert.equal(check(task, String(task.ans)), true);
    assert.equal(check(task, '-' + task.ans), false);
    assert.equal(check(task, 'answer=' + task.ans), false);
  }
});

test('OGE17: ordinary numerical answers still accept decimal and fraction notation precisely', () => {
  const task = { ansFmt: 'num', ans: 3.5 };
  for (const raw of ['3.5', '3,5', '7/2', ' 7 / 2 ']) assert.equal(check(task, raw), true, raw);
  for (const raw of ['3.5 text', '-3.5', '35', '7/0', 'NaN', 'Infinity', '3.5001']) assert.equal(check(task, raw), false, raw);
});
