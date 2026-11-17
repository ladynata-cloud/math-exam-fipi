'use strict';
const assert = require('node:assert/strict');
const edits = require('./fixtures/oge-source-alignment-06-09-inverse.json');

// Restore only reviewed native fragments before checking historical scripts.
// The math, progress, and source digest assertions on the result still run.
function restoreAlignmentScripts(file, scripts) {
  const result = scripts.slice();
  for (const {before, after} of edits[file] ?? []) {
    const matches = result.reduce((count, script) => count + script.split(after).length - 1, 0);
    assert.equal(matches, 1, `Missing or repeated source-alignment fragment in ${file}`);
    const index = result.findIndex(script => script.includes(after));
    result[index] = result[index].replace(after, () => before);
  }
  return result;
}
function restoreAlignment(file, source) {
  return restoreAlignmentScripts(file, [source])[0];
}

module.exports = {restoreAlignment, restoreAlignmentScripts};
