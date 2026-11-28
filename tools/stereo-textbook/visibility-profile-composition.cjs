'use strict';
// One reviewed lesson gained three views. Preserve the original signature and
// surfaces, and accept only its exact extended model as an additional profile.
const assert = require('node:assert/strict'), crypto = require('node:crypto');
const supplement = require('./visibility-profiles/merzlyak-sections-composition.json');
const baseline = require('./visibility-profiles/merzlyak.json');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const signature = source => JSON.stringify([source.points, source.edges || [], source.faces || [],
  Object.entries(source.views || {}).map(([id, view]) => [id, view.segments || [], view.polygon || []]), !!source.planar]);
function historicalSignature(id, model, expected) {
  const current = signature(model);
  if (id !== 'research-sections-004') return current;
  const record = supplement.composition;
  assert.equal(supplement.schemaVersion, 1);
  assert.equal(record.lessonId, id);
  assert.equal(record.sourceCommit, '09934f48cbc0483da4738c8f28854150b7132cff');
  assert.equal(record.baseProfile, 'merzlyak.json');
  assert.equal(record.historicalSignatureSHA256, 'e78cb290ca1f66f60d2b091ad550444f3afc0344e14d7bdf03ad9fe85a386cca');
  assert.equal(record.currentSignatureSHA256, '0ff38ae0674ce80ed49ed2fb22d49f932363db30a1863068aeee3926adbb96f1');
  assert.equal(record.currentModelSHA256, '1f118bb840c4020b2686113b05868e146615505045df1b93686775002f9d2537');
  assert.equal(hash(current), record.currentSignatureSHA256, 'exact reviewed extended geometry');
  assert.equal(hash(JSON.stringify(model)), record.currentModelSHA256, 'exact reviewed model including labels and view points');
  assert.deepEqual(Object.keys(record.addedViews), ['first-ratio', 'parallel-bases', 'second-ratio']);
  const restored = structuredClone(model);
  for (const [key, view] of Object.entries(record.addedViews)) {
    assert.deepEqual(restored.views[key], view, 'exact reviewed new view: ' + key);
    delete restored.views[key];
  }
  const original = baseline.profiles.filter(row => row.lessonIds.includes(id));
  assert.equal(original.length, 1, 'one historical profile');
  assert.equal(hash(original[0].signature), record.historicalSignatureSHA256);
  assert.equal(signature(restored), original[0].signature, 'every original coordinate, edge, face and view stays unchanged');
  assert.equal(supplement.profiles.length, 1, 'one exact derived profile');
  const derived = supplement.profiles[0];
  assert.deepEqual(derived.lessonIds, [id]);
  assert.equal(derived.signature, current);
  assert.deepEqual(derived.faces, original[0].faces, 'retain the first prism');
  assert.deepEqual(derived.views, {...original[0].views,
    'first-ratio': original[0].faces, 'parallel-bases': original[0].faces,
    'second-ratio': original[0].views['second-section']}, 'retain old views and the correct prism in each new view');
  return expected === original[0].signature ? original[0].signature : current;
}
module.exports = {historicalSignature, signature};
