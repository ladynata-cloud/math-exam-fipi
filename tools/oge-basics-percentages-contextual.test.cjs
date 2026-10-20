'use strict';
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const root = path.resolve(__dirname, '..');
const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/oge-basics-percentages-contextual-shell.json')));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

test('six current percentage sources and historical provenance are byte-for-byte preserved', () => {
  assert.equal(fixture.schemaVersion, 1);
  assert.equal(fixture.baseSha, '59ca8d215312831a21494e3b67099b30b1e6013d');
  assert.equal(fixture.files.length, 7);
  assert.equal(new Set(fixture.files.map(x => x.path)).size, 7);
  const trainers = fixture.files.filter(x => !x.path.endsWith('/index.html'));
  assert.equal(trainers.length, 6);
  for (const file of trainers) {
    assert.equal(file.currentSha256, file.baseSha256, file.path);
    assert.equal(sha(fs.readFileSync(path.join(root, file.path))), file.baseSha256, file.path);
  }
  assert.equal(sha(fs.readFileSync(path.join(__dirname, 'fixtures', fixture.historicalFixture))), fixture.historicalFixtureSha256);
});

test('percentage map changes only by the exact external navigation injection', () => {
  const file = fixture.files.find(x => x.path.endsWith('/index.html'));
  assert.equal(file.path, 'trainers/oge-basics/percentages/index.html');
  assert.equal(fixture.injection, '<!-- BEGIN OGE BASICS CONTEXTUAL SHELL -->\n'
    + '<link rel="stylesheet" href="../navigation-minimal.css?v=20261020">\n'
    + '<script defer src="../navigation-minimal.js?v=20261020"></script>\n'
    + '<!-- END OGE BASICS CONTEXTUAL SHELL -->');
  const html = fs.readFileSync(path.join(root, file.path), 'utf8');
  assert.equal(html.split(fixture.injection).length, 2);
  assert.equal(sha(html), file.currentSha256);
  assert.equal(sha(html.replace(fixture.injection, '')), file.baseSha256);
});
