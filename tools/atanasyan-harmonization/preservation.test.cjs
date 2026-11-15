'use strict';
// The task harmonizes the topic workshops. These complete source trees remain
// byte-identical to the authorized base, including every published model and
// the legacy trainers. Hashing names as well as bytes catches removals/additions.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const baseline = require('./preservation-baseline.json');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
assert.equal(baseline.schemaVersion, 1);
assert.equal(baseline.base, '5f25f75b6e7178ad1d492c7bcb28ed9e63c97bae');
assert.deepEqual(baseline.groups.map(group => group.group), ['geometry_textbook', 'first_steps', 'legacy_trainers', 'stereo_textbook', 'literacy', 'ege_bridge']);
function filesAt(relative) {
  const name = path.join(root, relative);
  if (fs.statSync(name).isFile()) return [relative];
  return fs.readdirSync(name, {withFileTypes: true}).flatMap(entry => {
    assert(!entry.isSymbolicLink(), 'protected source cannot be replaced by a symlink');
    return filesAt(path.posix.join(relative, entry.name));
  });
}
function verify(group, read = file => fs.readFileSync(path.join(root, file)), extra = []) {
  const files = [...new Set(group.paths.flatMap(filesAt).concat(extra))].filter(file => !group.excluded.includes(file)).sort();
  assert.equal(files.length, group.fileCount, group.group + ': exact protected file set size');
  const digest = crypto.createHash('sha256');
  for (const file of files) digest.update(file + '\0' + hash(read(file)) + '\n');
  assert.equal(digest.digest('hex'), group.sha256, group.group + ': every source path and byte must match the authorized base');
}
for (const group of baseline.groups) verify(group);
const geometry = require(root + '/geometry-course/textbook/data/course.json');
const stereo = require(root + '/stereo-course/textbook/data/course.json');
const first = require(root + '/learning/atanasyan-first-steps/course.json');
const literacy = require(root + '/stereo-course/literacy/data/course.json');
const legacy = require(root + '/geometry-course/data/legacy.json');
assert.equal(geometry.lessons.length, 1425);
assert.equal(stereo.lessons.length, 674);
assert.equal(first.lessons.length, 255);
assert.equal(literacy.lessons.length, 36);
assert.equal(legacy.length, 70);
assert.equal(geometry.lessons.reduce((n, lesson) => n + lesson.steps.length, 0), 4951);
assert.equal(stereo.lessons.reduce((n, lesson) => n + lesson.steps.length, 0), 2614);
const sample = baseline.groups.find(group => group.group === 'literacy');
const protectedFile = 'stereo-course/literacy/data/course.json';
assert.throws(() => verify(sample, file => file === protectedFile ? Buffer.from('CHANGED') : fs.readFileSync(path.join(root, file))), /every source path and byte/);
assert.throws(() => verify(sample, undefined, ['stereo-course/literacy/unapproved.json']), /exact protected file set size/);
console.log('ATANASYAN_HARMONIZATION_PRESERVATION_OK ' + JSON.stringify({geometryCards: 1425, stereoCards: 674, firstSteps: 255, literacy: 36, legacy: 70, protectedFiles: baseline.groups.reduce((n, group) => n + group.fileCount, 0), negativeControls: 2}));
