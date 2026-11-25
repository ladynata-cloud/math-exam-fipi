'use strict';

// Test-only projection of the reviewed, committed manifest. Do not import the
// production registry here: an implementation bug must not define its own oracle.
const crypto = require('node:crypto');
const byId = (a, b) => a.trainerId < b.trainerId ? -1 : a.trainerId > b.trainerId ? 1 : 0;
function expectedMirrors(manifest) {
  return manifest.trainers.filter(row => row.boardCompatibility === 'board-mirror')
    .map(({trainerId, file, version, stateSchemaVersion, bridgeProtocolVersion, allowLegacyHtml}) =>
      ({trainerId, file, version, stateSchemaVersion, bridgeProtocolVersion, allowLegacyHtml}))
    .sort(byId);
}
function expectedProgress(manifest) {
  return manifest.trainers.filter(row => row.supportsProgressTracking === true)
    .map(({trainerId, file, progressSchemaVersion}) => ({trainerId, file, progressSchemaVersion}));
}
function expectedDigest(manifest) {
  const json = JSON.stringify({schemaVersion: manifest.schemaVersion, trainers: expectedMirrors(manifest)});
  return 'sha256:' + crypto.createHash('sha256').update(json, 'utf8').digest('hex');
}
module.exports = {expectedMirrors, expectedProgress, expectedDigest, byId};
