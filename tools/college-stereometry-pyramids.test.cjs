'use strict';

const assert = require('node:assert/strict');
const { guided, homework, rhombusPyramid, truncatedPyramid, checkAnswer } = require('../trainers/college-stereometry/pyramids/content.js');
const { prepare } = require('../stereo-course/assets/task-scene-viewer.js');
const source239 = require('../stereo-course/textbook/lessons/ex-main-0239.json');

const expected = {
  'three-lengths': [3, 5, '√34'],
  'six-faces': [24, 108],
  'similar-cut': [3, 10, '15/2', 225],
  'frustum-height': [5, 13, 468],
  '239': [4, 3, '√65', '√58'],
  reverse: [9, '6√2'],
  'hw-square': [17, 544],
  'hw-triangle': [63],
  'hw-cut': [5, '6,5', 195],
  'hw-full': [572, 864],
  'hw-rhombus': ['12√2', 13],
  'hw-reverse': [8]
};
assert.equal(guided.length, 6);
assert.equal(homework.length, 6);
for (const task of [...guided, ...homework]) {
  const model = task.figure();
  assert.equal(prepare(model).convex, true, task.id);
  assert.equal(task.steps.length, expected[task.id].length, task.id);
  for (const [i, step] of task.steps.entries()) {
    assert.equal(checkAnswer(String(expected[task.id][i]), step.answer), 'correct', `${task.id} step ${i + 1}`);
    assert.equal(checkAnswer('√1', step.answer), 'wrong', `${task.id} step ${i + 1}`);
    assert(Object.hasOwn(model.views, step.focus), `${task.id} step ${i + 1}: missing model view`);
  }
}
for (const form of ['√65', '√(65)', 'sqrt(65)', '\\sqrt{65}', '2√260/4']) {
  assert.equal(checkAnswer(form, { square: 65 }), 'correct');
}
for (const invalid of ['1/0', '√(-65)', '√65/0', '8,1.2', '1e999', 'sqrt(65)+0']) {
  assert.equal(checkAnswer(invalid, { square: 65 }), 'format', invalid);
}
assert.equal(checkAnswer('8,062257495', { square: 65 }), 'radical');
assert.equal(checkAnswer('√58', { square: 65 }), 'wrong');
assert.deepEqual(rhombusPyramid(5, 4, 7).points, source239.visualization.model.points);
for (const cut of [2, 3, 4, 5, 6]) {
  const { points } = truncatedPyramid(8, 8 - cut, cut);
  const k = 1 - cut / 8;
  for (const p of ['A', 'B', 'C', 'D']) {
    assert.deepEqual(points[p + '1'], [points[p][0] * k, points[p][1] * k, cut]);
  }
}
console.log(`12 task figures and ${Object.values(expected).flat().length} checked answers, exact roots, №239 and parallel-section geometry passed.`);
