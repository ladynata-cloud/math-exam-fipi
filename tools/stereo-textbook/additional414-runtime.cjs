'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { beforeHarmonization } = require('./harmonization-input-migration.cjs');
const { restorePublicNavigator } = require('../public-navigator-preservation.cjs');
const { historicalRead } = require('./mobile-layout-migration.cjs');

const courseRoot = path.resolve(__dirname, '../..');

// The sphere review was made after the mobile layout change and before the
// later catalog, geometry-renderer and navigator changes. Each existing
// migration validates its own exact bytes before returning the former version.
function sphereReviewBytes(file) {
  if (file === 'stereo-course/textbook/assets/engine.js' ||
      file === 'stereo-course/textbook/index.html') {
    const bytes = fs.readFileSync(path.join(courseRoot, file));
    return beforeHarmonization(file, restorePublicNavigator(file, bytes));
  }
  return historicalRead(file);
}

module.exports = { sphereReviewBytes };
