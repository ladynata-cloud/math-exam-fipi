'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {beforeCompactPreview, FILE, BEFORE} = require('./harmonization-preview-migration.cjs');
const {beforeProfileComposition, AFTER: PROFILE_AFTER} = require('./visibility-profile-runtime-migration.cjs');
const {historicalRead} = require('./mobile-layout-migration.cjs');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file));
const bytes = read(FILE), restored = beforeCompactPreview(FILE, bytes);
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const gitBlob = value => crypto.createHash('sha1').update('blob ' + value.length + '\0').update(value).digest('hex');
assert.equal(sha256(restored), PROFILE_AFTER, 'the compact inverse preserves the exact reviewed profile renderer');
assert.equal(sha256(beforeProfileComposition(FILE, restored)), BEFORE, 'the profile inverse then restores the unchanged historical renderer');
// Exercise the same historicalRead path as all three later frozen consumers;
// their old SHA-256/Git-blob literals remain the authorities.
assert.equal(require('./sphere-baseline.json').immutableFiles[FILE], BEFORE);
assert.equal(sha256(historicalRead(FILE)), require('./sphere-baseline.json').immutableFiles[FILE]);
for (const name of ['additional396', 'additional404'])
  assert.equal(gitBlob(historicalRead(FILE)), require('./' + name + '-baseline.json').unchangedFiles[FILE], name + ': original renderer Git blob retained');
for (const input of [
  Buffer.concat([bytes, Buffer.from('\nUNREVIEWED')]),
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
console.log('ATANASYAN_HARMONIZATION_PREVIEW_MIGRATION_OK: exact optional preview delta; three later frozen consumers; 10 projection negative controls; old default and historical visibility guards retained');
