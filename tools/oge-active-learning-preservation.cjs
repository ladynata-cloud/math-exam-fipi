'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const routes = Object.freeze({
  6: 'trainers/oge-task6-fractions.html',
  7: 'trainers/oge-task7-number-line.html',
  8: 'trainers/oge-task8-powers-roots.html',
  9: 'trainers/oge-task9-equations.html',
  10: 'trainers/oge-task10-probability.html',
  11: 'trainers/oge-task11-graphs-trainer.html',
  12: 'trainers/oge-task12-formulas-trainer.html'
});
const assets = Object.freeze([
  'trainers/oge-active-learning.css',
  'trainers/oge-active-learning-data.js',
  'trainers/oge-active-learning.js'
]);
function includeBlock(number) {
  assert(Object.hasOwn(routes, number), 'Only the seven reviewed lessons have active-learning includes');
  return '<link rel="stylesheet" href="oge-active-learning.css?v=20261109">\n' +
    '<script defer src="oge-active-learning-data.js?v=20261109"></script>\n' +
    '<script defer src="oge-active-learning.js?v=20261109" data-oa-task="' + number + '"></script>\n';
}
// This inverse removes only the complete exact include block. It cannot erase
// inline code, teaching text, unknown scripts, attributes, or duplicate tags.
// Historical engine and whole-document hashes remain independently checked.
function restoreActiveLearningIncludes(file, input) {
  const name = path.isAbsolute(file) ? path.relative(root, file).split(path.sep).join('/') : file;
  const number = Object.keys(routes).find(n => routes[n] === name);
  const raw = Buffer.isBuffer(input) ? input.toString('utf8') : input;
  if (!number) return raw;
  const block = includeBlock(number);
  assert.equal(raw.split(block).length, 2, name + ': exactly one reviewed active-learning include block');
  assert(raw.includes(block + '</head>'), name + ': reviewed includes immediately precede head closure');
  const restored = raw.replace(block, '');
  assert(!restored.includes('oge-active-learning'), name + ': unknown or duplicate active-learning integration');
  return restored;
}
module.exports = {routes, assets, includeBlock, restoreActiveLearningIncludes};
