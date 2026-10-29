'use strict';
// A renderer correction may change these two historically frozen assets only.
// The original baseline literals and archived bytes remain authoritative; the
// replacement bytes must match the separately reviewed visibility migration.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const manifest = require('./visibility-migration.json');
const originals = Object.freeze({
  'stereo-course/assets/task-scene-viewer.js': 'a3e470e55b45d658cb74b2e32b5f1e9479785fa9b014be3929591bdcd55cefe6',
  'stereo-course/assets/task-scenes.css': '5dbecdc2c98fbb030bcc4dba224f3b4ae89af292579a5136942810be75fd2cbf'
});
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function assertVisibilityMigration(file, expected, read = name => fs.readFileSync(path.join(root, name)), record = manifest) {
  assert(Object.hasOwn(originals, file), 'only the two named visibility assets may migrate');
  assert.equal(record.schemaVersion, 1);
  assert.equal(record.base, '6fb959fc0130a0bb8842601d19297e305ac91ac0');
  assert.deepEqual(Object.keys(record.files).sort(), Object.keys(originals).sort(), 'exact visibility migration path set');
  for (const [name, original] of Object.entries(originals)) {
    const row = record.files[name];
    assert.equal(row.beforeSHA256, original, 'original visibility asset hash must remain unchanged: ' + name);
    assert.equal(row.beforeFixture, 'tools/stereo-textbook/fixtures/visibility-before/' + path.basename(name));
    assert.equal(hash(read(row.beforeFixture)), original, 'archived visibility asset is byte-identical: ' + name);
    assert.match(row.afterSHA256, /^[a-f0-9]{64}$/, 'a frozen reviewed visibility hash is required: ' + name);
    assert.notEqual(row.afterSHA256, original, 'visibility correction must not name the broken original: ' + name);
    assert.equal(hash(read(name)), row.afterSHA256, 'exact reviewed visibility migration: ' + name);
  }
  assert.equal(expected, originals[file], 'original historical hash must remain unchanged: ' + file);
}

module.exports = {assertVisibilityMigration, originals};
