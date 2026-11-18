'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '../..');
test('locally served JSXGraph matches the pinned official distribution and license', () => {
  const expected = {
    'jsxgraphcore.js': '3b256219e90c83e183f253374ffcecab0cfbb1350a7b4252a69af134a684ee43',
    'jsxgraph.css': 'c82ee298a077701100fd99e85374b7e572ebe483fc287fd13cf72a6e5f86d64c',
    'LICENSE.MIT': '43e325001487de7f09745fbe086b054bb1b70d4ab58060e87153849365b23ff1'
  };
  for (const [file, hash] of Object.entries(expected)) {
    assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root, 'trainers/spacemath/vendor', file))).digest('hex'), hash, file);
  }
  const html = fs.readFileSync(path.join(root, 'trainers/spacemath/index.html'), 'utf8');
  const resources = [...html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)="([^"]+)"/g)].map(match => match[1]);
  assert(resources.includes('vendor/jsxgraphcore.js') && resources.includes('vendor/jsxgraph.css'));
  for (const resource of resources) {
    assert(!/^(?:https?:)?\/\//.test(resource), 'Runtime asset is local: ' + resource);
    assert(fs.existsSync(path.resolve(root, 'trainers/spacemath', resource)), 'Runtime asset exists: ' + resource);
  }
});
