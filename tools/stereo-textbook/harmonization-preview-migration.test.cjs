'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {beforeCompactPreview, FILE, BEFORE, BEFORE_RIGHT_ANGLES} = require('./harmonization-preview-migration.cjs');
const {beforeRightAngles} = require('./right-angle-renderer-migration.cjs');
const {beforeProfileComposition, AFTER: PROFILE_AFTER} = require('./visibility-profile-runtime-migration.cjs');
const {historicalRead} = require('./mobile-layout-migration.cjs');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file));
const bytes = read(FILE), restored = beforeCompactPreview(FILE, bytes);
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const gitBlob = value => crypto.createHash('sha1').update('blob ' + value.length + '\0').update(value).digest('hex');
assert.equal(sha256(restored), BEFORE_RIGHT_ANGLES);
assert.match(restored.toString(), /data-right-angle/, 'undoing compact preview retains the reviewed angle marks');
const repairedProfile = beforeRightAngles(FILE, restored);
assert.equal(sha256(repairedProfile), PROFILE_AFTER, 'angle inverse preserves every repaired profile byte');
assert.equal(sha256(beforeProfileComposition(FILE, repairedProfile)), BEFORE, 'profile inverse restores the unchanged historical renderer');
const repairedPreview = Buffer.from(repairedProfile.toString().replace('      viewportHeight = Math.max(360, Math.min(680, viewportWidth * .76));', '      const minimum = options.compactPreview ? 300 : 360;\n      viewportHeight = Math.max(minimum, Math.min(680, viewportWidth * .76));'));
assert.equal(sha256(beforeCompactPreview(FILE, repairedPreview)), PROFILE_AFTER, 'the separately reviewed profile plus preview variant remains exact');
for (const unknown of [Buffer.concat([restored, Buffer.from('\nUNREVIEWED')]), repairedProfile, Buffer.from(restored.toString().replace('data-right-angle', 'data-unreviewed-angle'))])
  assert.throws(() => beforeRightAngles(FILE, unknown), /exact renderer with right-angle marks/);
// Exercise the same historicalRead path as all three later frozen consumers;
// their old SHA-256/Git-blob literals remain the authorities.
assert.equal(require('./sphere-baseline.json').immutableFiles[FILE], BEFORE);
assert.equal(sha256(historicalRead(FILE)), require('./sphere-baseline.json').immutableFiles[FILE]);
const originalPreview = Buffer.from(historicalRead(FILE).toString().replace('      viewportHeight = Math.max(360, Math.min(680, viewportWidth * .76));', '      const minimum = options.compactPreview ? 300 : 360;\n      viewportHeight = Math.max(minimum, Math.min(680, viewportWidth * .76));'));
assert.equal(sha256(beforeCompactPreview(FILE, originalPreview)), BEFORE, 'the separately reviewed preview-only variant remains valid');
for (const name of ['additional396', 'additional404'])
  assert.equal(gitBlob(historicalRead(FILE)), require('./' + name + '-baseline.json').unchangedFiles[FILE], name + ': original renderer Git blob retained');
for (const input of [
  Buffer.concat([bytes, Buffer.from('\nUNREVIEWED')]),
  Buffer.from(bytes.toString().replace('!incident.includes(index)', 'incident.includes(index)')),
  Buffer.from(bytes.toString('utf8').replace('compactPreview ? 300 : 360', 'compactPreview ? 300 : 200')),
  Buffer.from(bytes.toString('utf8').replace('compactPreview ? 300 : 360', 'compactPreview ? 299 : 360')),
  Buffer.from(bytes.toString('utf8').replace('Math.min(680, viewportWidth * .76)', 'Math.min(681, viewportWidth * .76)')),
  restored
]) {
  assert.throws(() => beforeCompactPreview(FILE, input), /exact reviewed visibility migration/);
  assert.throws(() => historicalRead(FILE, file => file === FILE ? input : read(file)), /exact reviewed visibility migration/);
}
const untouched = fs.readFileSync(path.join(root, 'stereo-course/assets/task-scenes.css'));
assert.equal(beforeCompactPreview('stereo-course/assets/task-scenes.css', untouched), untouched);
assert.equal(historicalRead('stereo-course/assets/task-scenes.css', () => untouched), untouched);
assert.equal(historicalRead('stereo-course/assets/task-scene-viewer-copy.js', () => bytes), bytes, 'projection applies only to the exact renderer path');
require('./visibility-migration.test.cjs');
console.log('ATANASYAN_HARMONIZATION_PREVIEW_MIGRATION_OK: exact optional preview delta; three later frozen consumers; 12 projection negative controls; old default and historical visibility guards retained');
