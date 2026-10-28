'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const {assertHistoricalFile} = require('./companion-migration.cjs');
const baseline = require('./additional310-baseline.json');
const manifest = require('./companion-migration.json');
const read = file => fs.readFileSync(path.join(root, file));
let rejects = 0;
for (const [file, expected] of Object.entries(baseline.immutableFiles)) {
  assertHistoricalFile(file, expected);
  assert.throws(() => assertHistoricalFile(file, expected, name => name === file
    ? Buffer.concat([read(name), Buffer.from('\nUNREVIEWED CHANGE')]) : read(name)),
    /exact reviewed companion migration|unchanged runtime\/schema\/builder/);
  rejects++;
}
for (const [file, row] of Object.entries(manifest.files)) {
  assert.throws(() => assertHistoricalFile(file, '0'.repeat(64)), /original historical hash must remain unchanged/);
  assert.throws(() => assertHistoricalFile(file, row.beforeSHA256, name => name === row.beforeFixture
    ? Buffer.concat([read(name), Buffer.from('CORRUPTED')]) : read(name)), /archived original UI is byte-identical/);
  rejects += 2;
}
assert.throws(() => assertHistoricalFile('unlisted-ui.js', '0'.repeat(64), () => Buffer.from('arbitrary')), /unchanged runtime\/schema\/builder/);
rejects++;
console.log('ATANASYAN_COMPANION_MIGRATION_OK: nine historical files; three explicit UI migrations;', rejects, 'negative controls');
