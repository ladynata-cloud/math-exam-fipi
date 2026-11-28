'use strict';
// Remove only the exact reviewed angle annotations and drawing amendment.
// The repaired visibility profile remains intact for its separate inverse.
const assert = require('node:assert/strict'), crypto = require('node:crypto');
const FILE = 'stereo-course/assets/task-scene-viewer.js';
const pin = require('./visibility-migration.json').files[FILE];
const inverse = require('./fixtures/right-angle-renderer-inverse.json');
const {AFTER: PROFILE_AFTER} = require('./visibility-profile-runtime-migration.cjs');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function beforeRightAngles(file, bytes, record = pin) {
  if (file !== FILE) return bytes;
  assert.equal(hash(bytes), record.rightAngleSHA256, 'exact renderer with right-angle marks');
  const lines = bytes.toString('utf8').split('\n');
  for (const edit of [...inverse].reverse()) lines.splice(edit.start, edit.remove, ...edit.restore);
  const previous = Buffer.from(lines.join('\n'));
  assert.equal(hash(previous), PROFILE_AFTER, 'exact repaired visibility renderer before angle marks');
  return previous;
}
module.exports = {beforeRightAngles};
