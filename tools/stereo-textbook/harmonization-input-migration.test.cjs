'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {beforeHarmonization, FILE, BEFORE} = require('./harmonization-input-migration.cjs');
const manifest = require('./harmonization-input-migration.json');
const root = path.resolve(__dirname, '../..');
const bytes = fs.readFileSync(path.join(root, FILE));
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
assert.equal(hash(beforeHarmonization(FILE, bytes)), BEFORE);
let negatives = 0;
function rejects(change, input = bytes) {
  const record = structuredClone(manifest);
  change(record);
  assert.throws(() => beforeHarmonization(FILE, input, record));
  negatives++;
}
rejects(() => {}, Buffer.concat([bytes, Buffer.from('\nUNREVIEWED')]));
rejects(record => { record.files['stereo-course/textbook/data/course.json'] = record.files[FILE]; });
rejects(record => { record.files[FILE].beforeSHA256 = '0'.repeat(64); });
rejects(record => { record.files[FILE].afterSHA256 = '0'.repeat(64); });
rejects(record => { record.base = '0'.repeat(40); });
rejects(record => { record.task = 'UNAPPROVED'; });
rejects(record => { record.files[FILE].operations.pop(); });
rejects(record => { record.files[FILE].operations[0].before += 'UNREVIEWED'; });
rejects(record => { record.files[FILE].operations[0].after += 'UNREVIEWED'; });
// Even refreshing the new hash cannot hide an edit outside the declared spans.
const extra = Buffer.concat([bytes, Buffer.from('\nEXTRA')]);
rejects(record => { record.files[FILE].afterSHA256 = hash(extra); }, extra);
const untouched = fs.readFileSync(path.join(root, 'stereo-course/textbook/data/course.json'));
assert.equal(beforeHarmonization('stereo-course/textbook/data/course.json', untouched), untouched);
require('./mobile-layout-migration.test.cjs');
require('./companion-migration.test.cjs');
console.log('ATANASYAN_HARMONIZATION_MIGRATION_OK: exact reversible runtime amendment; ' + negatives + ' negative controls; historical gates retained');
