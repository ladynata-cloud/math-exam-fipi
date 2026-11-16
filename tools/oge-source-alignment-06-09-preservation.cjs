'use strict';
const assert = require('node:assert/strict');
const edits = require('./fixtures/oge-source-alignment-06-09-inverse.json');

// Restore only the reviewed source delta before comparing whole native engines
// with the historical gates. Call only for complete live source or its scripts.
function restoreAlignment(file, source) {
  let result = source;
  for (const {before, after} of edits[file] ?? []) {
    assert.equal(result.split(after).length, 2, `Missing or repeated source-alignment fragment in ${file}`);
    result = result.replace(after, () => before);
  }
  return result;
}

module.exports = {restoreAlignment};
