'use strict';

// Build the public contract from the input manifest without calling registry code.
function manifestMirrors(manifest) {
  return manifest.trainers
    .filter(entry => entry.boardCompatibility === 'board-mirror' && entry.supportsBoardMirror === true)
    .map(({ trainerId, file, version, stateSchemaVersion, bridgeProtocolVersion, allowLegacyHtml }) => ({
      trainerId, file, version, stateSchemaVersion, bridgeProtocolVersion, allowLegacyHtml
    }))
    .sort((left, right) => {
      if (left.trainerId === right.trainerId) return 0;
      return left.trainerId < right.trainerId ? -1 : 1;
    });
}

module.exports = { manifestMirrors };
