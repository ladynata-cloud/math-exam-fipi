'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const root = path.resolve(__dirname, '..');
// Captured before the presentation migration; changing the UI must not silently
// remove a course destination or replace its mathematical/checking engines.
const baseline = JSON.parse(fs.readFileSync(path.join(root,
  'docs/tasks/OGE_BASICS_CONTEXTUAL_ROUTES.json'), 'utf8'));

test('All 70 original course destinations remain available', () => {
  assert.equal(baseline.version, 1);
  assert.equal(baseline.routes.length, 70);
  assert.equal(new Set(baseline.routes).size, 70);
  for (const route of baseline.routes) {
    assert.match(route, /^trainers\/oge-basics\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.html$/);
    const source = fs.readFileSync(path.join(root, route), 'utf8');
    assert.match(source, /<html[\s>]/i, route + ' still has its HTML document');
    assert.match(source, /<title>[^<]+<\/title>/i, route + ' has an identifiable page');
  }
});

test('Task banks, contract checks and arithmetic engines are byte-for-byte preserved', () => {
  assert.equal(Object.keys(baseline.unchangedContent).length, 6);
  for (const [file, expected] of Object.entries(baseline.unchangedContent)) {
    assert.match(file, /^trainers\/oge-basics\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.js$/);
    assert.match(expected, /^[a-f0-9]{64}$/);
    const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
    assert.equal(actual, expected, file + ': presentation changes must preserve mathematics and saved-state semantics');
  }
});
