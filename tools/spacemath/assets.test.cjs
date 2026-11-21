'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { JSDOM } = require('jsdom');
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
  const document = new JSDOM(html).window.document;
  const canonical = [...document.querySelectorAll('head link[rel="canonical" i]')];
  assert.deepEqual(canonical.map(link => link.getAttribute('href')),
    ['https://mathexam.space/trainers/spacemath/']);
  const resources = [...document.querySelectorAll('script[src], link[href]')]
    .filter(element => element !== canonical[0])
    .map(element => element.getAttribute(element.localName === 'script' ? 'src' : 'href'));
  assert(resources.includes('vendor/jsxgraphcore.js') && resources.includes('vendor/jsxgraph.css'));
  for (const resource of resources) {
    const url = new URL(resource, 'https://mathexam.space/trainers/spacemath/');
    assert.equal(url.origin, 'https://mathexam.space', 'Runtime asset is local: ' + resource);
    const filename = path.join(root, decodeURIComponent(url.pathname));
    assert(fs.statSync(filename).isFile(), 'Runtime asset exists: ' + resource);
  }
});
