'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {beforeCompactPreview, FILE, BEFORE} = require('./harmonization-preview-migration.cjs');
const root = path.resolve(__dirname, '../..');
const bytes = fs.readFileSync(path.join(root, FILE));
assert.equal(crypto.createHash('sha256').update(beforeCompactPreview(FILE, bytes)).digest('hex'), BEFORE);
for (const input of [Buffer.concat([bytes, Buffer.from('\nUNREVIEWED')]), Buffer.from(bytes.toString('utf8').replace('compactPreview ? 300 : 360', 'compactPreview ? 300 : 200'))]) {
  assert.throws(() => beforeCompactPreview(FILE, input), /exact reviewed visibility migration/);
}
const untouched = fs.readFileSync(path.join(root, 'stereo-course/assets/task-scenes.css'));
assert.equal(beforeCompactPreview('stereo-course/assets/task-scenes.css', untouched), untouched);
require('./visibility-migration.test.cjs');
console.log('ATANASYAN_HARMONIZATION_PREVIEW_MIGRATION_OK: exact optional preview delta; old default and historical visibility guards retained');
