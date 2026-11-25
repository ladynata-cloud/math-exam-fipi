'use strict';
// A new investigation preview opts into 300 px; all existing callers retain
// the 360 px minimum. Restore the exact earlier visibility build before
// undoing the optional sizing amendment for historical gates.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const FILE = 'stereo-course/assets/task-scene-viewer.js';
const BEFORE = '91ef00cd15e0e831fa835c089116e5150813ce0bd6554280d3e9f76a5c547f64';
const AFTER = '7681c481f3ee217a06e6714e01b113873494cb1e28ed712bec7bcbba5d7c3cea';
const AFTER_RIGHT_ANGLES = '2571e7958fde3156d768fdcd53d1f5242d48f95ecb37256aec8f46ec47265fe6';
const AFTER_INCIDENT_EDGES = 'c9938e754ddb0b7e7a2a43e3a820ffdc2312a7f4dfebe712dd504c4aa7e9f5ec';
const BEFORE_RIGHT_ANGLES = '961453baafc1c04692e9c12561da53da6e026913dafad798aa7bfeae2661ebd0';
const COMPOSED_AFTER = 'da984d3f7fc90c8fa8396dd12d0032cb350057772597b3e330d76bbfa57243ab';
const COMPOSED_BEFORE = 'da832009a652165c1d673d14237a5df04c34937fd858e2ed5971dbf5c3e1ec86';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const before = '      viewportHeight = Math.max(360, Math.min(680, viewportWidth * .76));';
const after = '      const minimum = options.compactPreview ? 300 : 360;\n      viewportHeight = Math.max(minimum, Math.min(680, viewportWidth * .76));';
function beforeCompactPreview(file, bytes) {
  if (file !== FILE) return bytes;
  if (hash(bytes) === AFTER_INCIDENT_EDGES) {
    // Reconstruct the exact preceding renderer for the frozen preview checks.
    const source = bytes.toString('utf8');
    const begin = source.indexOf('        // A polygon cannot hide its own boundary.');
    const end = source.indexOf('        for (const part of parts)', begin);
    assert(begin >= 0 && end > begin, 'exact geometric boundary correction');
    const original = '        const parts = visibilityParts(rotated(sub(a, data.center)), rotated(sub(b, data.center)), [...surfaces, ...sphereSurfaces], data.radius * 1e-8);\n';
    bytes = Buffer.from(source.slice(0, begin) + original + source.slice(end));
    assert.equal(hash(bytes), AFTER_RIGHT_ANGLES, 'every preceding renderer byte restored');
  }
  const current = hash(bytes);
  assert(current === AFTER || current === COMPOSED_AFTER || current === AFTER_RIGHT_ANGLES, 'exact reviewed visibility migration / harmonization preview: ' + file);
  const text = bytes.toString('utf8');
  assert.equal(text.split(after).length, 2, 'exact one opt-in compact preview amendment');
  const restored = Buffer.from(text.replace(after, before));
  assert.equal(hash(restored), current === AFTER ? BEFORE : current === COMPOSED_AFTER ? COMPOSED_BEFORE : BEFORE_RIGHT_ANGLES, 'all original viewer bytes and default sizing remain frozen');
  return restored;
}
module.exports = {beforeCompactPreview, FILE, BEFORE, BEFORE_RIGHT_ANGLES};
