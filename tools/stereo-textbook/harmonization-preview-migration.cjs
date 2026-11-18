'use strict';
// A new investigation preview opts into 300 px; all existing callers retain
// the 360 px minimum. Undo only this exact optional amendment for old gates.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const FILE = 'stereo-course/assets/task-scene-viewer.js';
const BEFORE = '91ef00cd15e0e831fa835c089116e5150813ce0bd6554280d3e9f76a5c547f64';
const AFTER = '7681c481f3ee217a06e6714e01b113873494cb1e28ed712bec7bcbba5d7c3cea';
// The sole second variant includes the independently reviewed #658 profile.
// Removing preview sizing leaves that profile byte-exact for its own inverse.
const COMPOSED_AFTER = 'da984d3f7fc90c8fa8396dd12d0032cb350057772597b3e330d76bbfa57243ab';
const COMPOSED_BEFORE = 'da832009a652165c1d673d14237a5df04c34937fd858e2ed5971dbf5c3e1ec86';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const before = '      viewportHeight = Math.max(360, Math.min(680, viewportWidth * .76));';
const after = '      const minimum = options.compactPreview ? 300 : 360;\n      viewportHeight = Math.max(minimum, Math.min(680, viewportWidth * .76));';
function beforeCompactPreview(file, bytes) {
  if (file !== FILE) return bytes;
  const current = hash(bytes);
  assert(current === AFTER || current === COMPOSED_AFTER, 'exact reviewed visibility migration / harmonization preview: ' + file);
  const text = bytes.toString('utf8');
  assert.equal(text.split(after).length, 2, 'exact one opt-in compact preview amendment');
  const restored = Buffer.from(text.replace(after, before));
  assert.equal(hash(restored), current === AFTER ? BEFORE : COMPOSED_BEFORE, 'all original viewer bytes and default sizing remain frozen');
  return restored;
}
module.exports = {beforeCompactPreview, FILE, BEFORE};
