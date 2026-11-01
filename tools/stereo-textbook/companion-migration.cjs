'use strict';
// The owner explicitly requested source-label edits after the content-only
// batches froze these three UI files. Keep those historical assertions against
// exact archived bytes, AND require the current UI to equal the reviewed label
// migration. The subsequent shared visibility correction has its own exact
// two-file amendment; all other frozen files retain unchanged-byte checks.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const manifest = require('./companion-migration.json');
const visibility = require('./visibility-migration.cjs');
const sphereSchema = require('./sphere-schema-migration.cjs');
const approved = {
  'stereo-course/textbook/assets/engine.js': '3b2f3c3fae68a9c8e6f532d32a19df1fb1c5749b60253c75d9241ff639066ad4',
  'stereo-course/textbook/assets/style.css': '268af771d4e1fe44d69fddb966f5a4bf2e5d6febc2102425675b0ba8aca92740',
  'stereo-course/textbook/index.html': 'daee3fb225e5b7a0d5129af24d2cdf5961eb5b74d195a863e22317313d1e1825'
};
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function assertHistoricalFile(file, expected, read = name => fs.readFileSync(path.join(root, name))) {
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.base, 'fa8d1b7ced31a5941ad52d8a21a48b63daaa84a8');
  assert.deepEqual(Object.keys(manifest.files).sort(), Object.keys(approved).sort(), 'only three approved companion UI paths');
  if (Object.hasOwn(sphereSchema.originals, file)) {
    sphereSchema.assertSphereSchemaMigration(file, expected, read);
    return;
  }
  if (Object.hasOwn(visibility.originals, file)) {
    visibility.assertVisibilityMigration(file, expected, read);
    return;
  }
  if (!Object.hasOwn(approved, file)) {
    assert.equal(hash(read(file)), expected, 'unchanged runtime/schema/builder: ' + file);
    return;
  }
  const row = manifest.files[file];
  assert.equal(expected, approved[file], 'original historical hash must remain unchanged: ' + file);
  assert.equal(row.beforeSHA256, expected, 'migration begins at exact historical UI: ' + file);
  assert.equal(row.beforeFixture, 'tools/stereo-textbook/fixtures/companion-before/' + path.basename(file));
  assert.equal(hash(read(row.beforeFixture)), expected, 'archived original UI is byte-identical: ' + file);
  assert.match(row.afterSHA256, /^[a-f0-9]{64}$/, 'specific reviewed UI hash is required');
  assert.equal(hash(read(file)), row.afterSHA256, 'exact reviewed companion migration: ' + file);
}

module.exports = {assertHistoricalFile};
