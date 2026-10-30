'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const {assertHistoricalFile} = require('./companion-migration.cjs');
const {assertVisibilityMigration, originals} = require('./visibility-migration.cjs');
const manifest = require('./visibility-migration.json');
const read = file => fs.readFileSync(path.join(root, file));
const baselineNames = ['polyhedra-practical', 'additional288', 'additional294', 'additional299', 'additional310', 'cylinder', 'cone'];
let rejects = 0;
function reject(fn, pattern) { assert.throws(fn, pattern); rejects++; }
for (const [file, original] of Object.entries(originals)) {
  for (const name of baselineNames) {
    const recorded = require('./' + name + '-baseline.json').immutableFiles[file];
    assert.equal(recorded, original, name + ': historical literal preserved');
    assertHistoricalFile(file, recorded);
  }
  assertVisibilityMigration(file, original);
  reject(() => assertHistoricalFile(file, '0'.repeat(64)), /original historical hash must remain unchanged/);
  reject(() => assertHistoricalFile(file, original, name => name === file
    ? Buffer.concat([read(name), Buffer.from('\nUNREVIEWED')]) : read(name)), /exact reviewed visibility migration/);
  const fixture = manifest.files[file].beforeFixture;
  reject(() => assertHistoricalFile(file, original, name => name === fixture
    ? Buffer.concat([read(name), Buffer.from('\nCORRUPTED')]) : read(name)), /archived visibility asset is byte-identical/);
  for (const [field, value, pattern] of [
    ['beforeSHA256', '0'.repeat(64), /original visibility asset hash must remain unchanged/],
    ['beforeFixture', file, /visibility-before/],
    ['afterSHA256', original, /must not name the broken original/],
    ['afterSHA256', 'PENDING', /frozen reviewed visibility hash/],
    ['afterSHA256', '0'.repeat(64), /exact reviewed visibility migration/]
  ]) {
    const changed = structuredClone(manifest); changed.files[file][field] = value;
    reject(() => assertVisibilityMigration(file, original, read, changed), pattern);
  }
}
const file = Object.keys(originals)[0], original = originals[file];
for (const modify of [m => delete m.files[file], m => { m.files['extra.js'] = m.files[file]; }]) {
  const changed = structuredClone(manifest); modify(changed);
  reject(() => assertVisibilityMigration(file, original, read, changed), /exact visibility migration path set/);
}
reject(() => assertVisibilityMigration('unlisted.js', original), /only the two named visibility assets/);
const wrongBase = structuredClone(manifest); wrongBase.base = '0'.repeat(40);
reject(() => assertVisibilityMigration(file, original, read, wrongBase), /6fb959fc/);
reject(() => assertHistoricalFile('unlisted.js', '0'.repeat(64), () => Buffer.from('arbitrary')), /unchanged runtime\/schema\/builder/);
console.log('STEREOMETRY_VISIBILITY_MIGRATION_OK: seven historical baselines, exact two assets and archived originals; ' + rejects + ' negative controls');
