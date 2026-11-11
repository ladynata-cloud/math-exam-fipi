'use strict';
// Invert only the nine reviewed, additive lesson includes. The historical
// candidate/engine hashes remain the authority for every other byte.
const assert = require('node:assert/strict');
const {graphScale} = require('./fixtures/oge-video-models-native-bytes.json');
const entries = Object.freeze({
  11: 'trainers/oge-task11-graphs-trainer.html',
  15: 'trainers/oge-task15-triangles.html',
  16: 'trainers/oge-task16-circle.html',
  17: 'trainers/oge-task17-quadrilaterals.html',
  19: 'trainers/task19-trainer.html',
  22: 'trainers/oge-task22-functions-graphs.html',
  23: 'trainers/oge-task23-geometry-calculations.html',
  24: 'trainers/oge-task24-proofs.html',
  25: 'trainers/oge-task25-geometry.html'
});
const assets = Object.freeze(['trainers/oge-video-models.css', 'trainers/oge-video-graphs.js', 'trainers/oge-video-geometry.js', 'trainers/oge-video-models.js']);
function snippet(number) {
  assert(Object.hasOwn(entries, number), 'Unknown video-model task');
  return '<!-- OGE video-model investigations: standalone practice -->\n'
    + '<link rel="stylesheet" href="oge-video-models.css">\n'
    + '<script defer src="oge-video-graphs.js"></script>\n'
    + '<script defer src="oge-video-geometry.js"></script>\n'
    + '<script defer src="oge-video-models.js" data-oge-video-task="' + number + '"></script>\n';
}
function restoreVideoModels(file, source) {
  const original = String(source);
  const row = Object.entries(entries).find(([, name]) => name === file);
  if (!row) return original;
  const marker = /OGE video-model investigations|oge-video-(?:models|graphs|geometry)/;
  if (!marker.test(original)) return original;
  const include = snippet(row[0]);
  assert.equal(original.split(include).length, 2, file + ': one exact reviewed video-model include block');
  assert(original.includes(include + '</head>'), file + ': video models stay at the reviewed head boundary');
  const restored = original.replace(include, '');
  assert(!marker.test(restored), file + ': no altered, duplicate or hidden lesson dependency');
  return restored;
}
function restoreGraphScale(file, source) {
  if (file !== graphScale.file) return source;
  const parts = source.split(graphScale.after);
  return parts.length === 2 ? parts.join(graphScale.before) : source;
}
module.exports = { entries, assets, snippet, restoreVideoModels, restoreGraphScale };
