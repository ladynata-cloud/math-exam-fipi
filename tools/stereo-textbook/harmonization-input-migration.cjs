'use strict';
// This amendment preserves the older release gates: undo exactly the four
// authorized runtime edits, then let the existing UI/content hashes run.
// Neither an extra runtime edit nor an extra migration path is projected away.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const manifest = require('./harmonization-input-migration.json');
const {beforeCombinedCatalogReturn} = require('./catalog-return-composition.cjs');
const FILE = 'stereo-course/textbook/assets/engine.js';
const BEFORE = '14cb7f4c44b7e6aa78da563503592cd97a8f62ae7d6e57dc23942565a7d3a413';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function replaceOnce(source, from, to) {
  assert(typeof from === 'string' && from.length && typeof to === 'string' && to.length, 'nonempty exact migration spans');
  const position = source.indexOf(from);
  assert(position >= 0 && source.indexOf(from, position + from.length) < 0, 'each migration span must occur exactly once');
  return source.slice(0, position) + to + source.slice(position + from.length);
}
function beforeHarmonization(file, bytes, record = manifest) {
  if (file !== FILE) return bytes;
  bytes = beforeCombinedCatalogReturn(file, bytes);
  assert.equal(record.schemaVersion, 1);
  assert.equal(record.base, '5f25f75b6e7178ad1d492c7bcb28ed9e63c97bae');
  assert.equal(record.task, 'ATANASYAN_7_11_HARMONIZATION_20261116');
  assert.deepEqual(Object.keys(record.files), [FILE], 'only the authorized textbook engine may migrate');
  const row = record.files[FILE];
  assert.equal(row.beforeSHA256, BEFORE, 'original pre-harmonization runtime hash stays frozen');
  assert.match(row.afterSHA256, /^[a-f0-9]{64}$/);
  assert.notEqual(row.afterSHA256, BEFORE);
  assert.equal(hash(bytes), row.afterSHA256, 'exact harmonization input migration: ' + file);
  assert.equal(row.operations.length, 4, 'exact four independently inspectable runtime edit spans');
  let restored = bytes.toString('utf8');
  for (const operation of row.operations) restored = replaceOnce(restored, operation.after, operation.before);
  assert.equal(hash(restored), BEFORE, 'reversal restores every original runtime byte');
  let reapplied = restored;
  for (const operation of row.operations) reapplied = replaceOnce(reapplied, operation.before, operation.after);
  assert.equal(reapplied, bytes.toString('utf8'), 'reapplying only the scoped edits restores the current runtime');
  return Buffer.from(restored);
}
module.exports = {beforeHarmonization, FILE, BEFORE};
