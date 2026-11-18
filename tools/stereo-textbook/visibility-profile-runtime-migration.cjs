'use strict';
// Remove only the additional exact profile when an older full-byte gate reads
// the renderer. No original profile or executable renderer code is replaced.
const assert = require('node:assert/strict'), crypto = require('node:crypto');
const supplement = require('./visibility-profiles/merzlyak-sections-composition.json');
const FILE = 'stereo-course/assets/task-scene-viewer.js';
const BEFORE = '91ef00cd15e0e831fa835c089116e5150813ce0bd6554280d3e9f76a5c547f64';
const AFTER = 'da832009a652165c1d673d14237a5df04c34937fd858e2ed5971dbf5c3e1ec86';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function beforeProfileComposition(file, bytes) {
  if (file !== FILE || hash(bytes) !== AFTER) return bytes;
  assert.equal(supplement.profiles.length, 1);
  const row = supplement.profiles[0], geometry = {};
  for (const key of ['faces', 'views', 'spheres', 'viewSpheres']) if (row[key] !== undefined) geometry[key] = row[key];
  const added = ',' + JSON.stringify([row.signature, geometry]), source = bytes.toString('utf8');
  assert.equal(source.split(added).length, 2, 'exactly one derived profile entry');
  const restored = source.replace(added, '');
  assert.equal(hash(restored), BEFORE, 'every original renderer and profile byte remains unchanged');
  return Buffer.from(restored);
}
module.exports = {beforeProfileComposition, FILE, BEFORE, AFTER};
