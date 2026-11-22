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
  if (hash(bytes) === '0645e81d2dcc53222f766fcb68e6cf28049f31d5568f93c0f5711ef3f6010d8c') {
    const scoped = `   // Volume lessons have a reviewed phone layout that keeps their full diagram above the fold.
   get compactPreview(){
    return lesson.source.chapter === 'V. Объёмы тел' && model.clientWidth > 0 && model.clientWidth < 400;
   },`;
    const original = `   // The renderer re-reads this when its container changes size. Keep a full-width figure on narrow reading pages.
   get compactPreview(){return model.clientWidth > 0 && model.clientWidth < 400;},`;
    bytes = Buffer.from(replaceOnce(bytes.toString('utf8'), scoped, original));
    assert.equal(hash(bytes), '7d9b56f655d2e1e6fe27ddd3cc32e7dbe70c67eca753ff39e04126f844ce37ac', 'only scope the compact reading height to the reviewed volume chapter');
  }
  if (hash(bytes) === '7d9b56f655d2e1e6fe27ddd3cc32e7dbe70c67eca753ff39e04126f844ce37ac') {
    const source = bytes.toString('utf8');
    const compact = `viewer=sceneViewer.mount(model,lesson.visualization.model,{
   lessonId:lesson.id,
   // The renderer re-reads this when its container changes size. Keep a full-width figure on narrow reading pages.
   get compactPreview(){return model.clientWidth > 0 && model.clientWidth < 400;},
   savedCamera:state.camera,onChange:camera=>{state.camera=camera;save();}
  });`;
    const previous = 'viewer=sceneViewer.mount(model,lesson.visualization.model,{lessonId:lesson.id,savedCamera:state.camera,onChange:camera=>{state.camera=camera;save();}});';
    assert.equal(source.split(compact).length, 2, 'one reviewed narrow textbook figure');
    bytes = Buffer.from(source.replace(compact, previous));
    assert.equal(hash(bytes), '98f27d0bedbfa8dab28f2d844fa33d7aec24a67e2264156a9447688fd3a64081', 'all pre-existing textbook engine bytes');
  }
  // Compose the exact two lesson identities with the independently reviewed engine.
  if (hash(bytes) === '98f27d0bedbfa8dab28f2d844fa33d7aec24a67e2264156a9447688fd3a64081') {
    const source = bytes.toString('utf8');
    const after = 'sceneViewer.mount(model,lesson.visualization.model,{lessonId:lesson.id,savedCamera:', before = 'sceneViewer.mount(model,lesson.visualization.model,{savedCamera:';
    assert.equal(source.split(after).length, 3, 'exactly two textbook mounts identify their lesson');
    bytes = Buffer.from(source.replaceAll(after, before));
    assert.equal(hash(bytes), 'aded83bf7166a6c083bac6fa683b661db50af988bb8e1fe7dd16783b2f95ec62', 'all reviewed harmonization and catalog-return engine bytes remain');
  }
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
