'use strict';

// Recover only the complete, recorded OGE18 clarity revision for historical
// preservation comparisons. This receipt establishes source identity, not
// mathematical acceptance, external review or publication authorization.
const crypto = require('node:crypto');
const receipt = require('./fixtures/oge18-answer-model-clarity.json');
const allowed = new Set([
  'trainers/oge-task18-grid.html',
  'trainers/oge-course-geometry.js',
  'trainers/oge-course-geometry.css'
]);
const hash = source => crypto.createHash('sha256').update(source).digest('hex');

function restoreOge18Clarity(file, input) {
  const original = String(input);
  if (receipt.schemaVersion !== 1 ||
      receipt.task !== 'docs/tasks/OGE18_ANSWER_MODEL_CLARITY_20261116.md' ||
      !/^[a-f0-9]{40}$/.test(receipt.sourceBase || '') || !allowed.has(file)) return original;
  const row = receipt.files[file];
  const sourceHash = hash(original);
  const composed = file === 'trainers/oge-course-geometry.js' ? receipt.composedGeometry : null;
  const binding = sourceHash === composed?.afterSha256 ? composed : row;
  if (!row || !/^[a-f0-9]{64}$/.test(row.beforeSha256 || '') ||
      !/^[a-f0-9]{64}$/.test(row.afterSha256 || '') ||
      row.beforeSha256 === row.afterSha256 || !binding || sourceHash !== binding.afterSha256 ||
      !Array.isArray(row.fragments) || !row.fragments.length) return original;
  if (!row.fragments.every(fragment => typeof fragment.before === 'string' &&
      typeof fragment.after === 'string' && fragment.after.length > 0 &&
      original.split(fragment.after).length === 2)) return original;
  let restored = original;
  for (const fragment of row.fragments) {
    if (restored.split(fragment.after).length !== 2) return original;
    restored = restored.replace(fragment.after, () => fragment.before);
  }
  return hash(restored) === binding.beforeSha256 ? restored : original;
}

module.exports = { restoreOge18Clarity, receipt };
