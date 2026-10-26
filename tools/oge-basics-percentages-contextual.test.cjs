'use strict';
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const root = path.resolve(__dirname, '..');
const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/oge-basics-percentages-contextual-shell.json')));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fallbackStart = '<!-- seo-catalog-fallback:map:start -->';
const fallbackEnd = '<!-- seo-catalog-fallback:map:end -->';
const clearContext = 'let doneTotal=0,allTotal=0,firstOpen=-1;\nbox.replaceChildren();\nTOPICS.forEach((t,i)=>{';

function assertPreservedMap(html) {
  const file = fixture.files.find(x => x.path.endsWith('/index.html'));
  assert.equal(html.split(fallbackStart).length, 2, 'one source fallback start');
  assert.equal(html.split(fallbackEnd).length, 2, 'one source fallback end');
  const fallback = html.match(/<div class="map" id="map">(<!-- seo-catalog-fallback:map:start -->[\s\S]*?<!-- seo-catalog-fallback:map:end -->)<\/div>/);
  assert(fallback, 'fallback remains inside the original map container');
  // Pin the reviewed six-card addition, including its URLs and all markup.
  // Stripping arbitrary marker content would hide inserted scripts from the
  // original preservation hashes. Source/render parity is checked separately.
  assert.equal(sha(fallback[1]), '2bc07b70e972980e59ee20c7f684f74b916d22de89be181116e0319c354003ed',
    'only the exact reviewed static fallback is permitted');
  assert.equal(html.split(clearContext).length, 2, 'one exact clear statement before the existing render');
  const normalized = html.replace(fallback[0], '<div class="map" id="map"></div>')
    .replace(clearContext, clearContext.replace('box.replaceChildren();\n', ''));
  assert.equal(normalized.split(fixture.injection).length, 2);
  assert.equal(sha(normalized), file.currentSha256);
  assert.equal(sha(normalized.replace(fixture.injection, '')), file.baseSha256);
}

function assertPreservedTrainer(html, file) {
  const addition = `<link rel="canonical" href="https://mathexam.space/${file.path}">\n`;
  assert.equal(html.split(addition).length, 2, file.path + ': one exact HTTPS self-canonical');
  assert(html.indexOf(addition) < html.indexOf('</head>'), file.path + ': canonical remains in head');
  // Only this literal, reviewed metadata addition is permitted. Retain the
  // historical whole-document hashes, including all scripts, styles and body.
  assert.equal(sha(html.replace(addition, '')), file.baseSha256, file.path);
}

test('six percentage sources retain their original bytes after one exact head canonical', () => {
  assert.equal(fixture.schemaVersion, 1);
  assert.equal(fixture.baseSha, '59ca8d215312831a21494e3b67099b30b1e6013d');
  assert.equal(fixture.files.length, 7);
  assert.equal(new Set(fixture.files.map(x => x.path)).size, 7);
  const trainers = fixture.files.filter(x => !x.path.endsWith('/index.html'));
  assert.equal(trainers.length, 6);
  for (const file of trainers) {
    assert.equal(file.currentSha256, file.baseSha256, file.path);
    assertPreservedTrainer(fs.readFileSync(path.join(root, file.path), 'utf8'), file);
  }
  assert.equal(sha(fs.readFileSync(path.join(__dirname, 'fixtures', fixture.historicalFixture))), fixture.historicalFixtureSha256);
});

test('trainer metadata normalization rejects wrong, missing and duplicate canonicals or content edits', () => {
  for (const file of fixture.files.filter(x => !x.path.endsWith('/index.html'))) {
    const html = fs.readFileSync(path.join(root, file.path), 'utf8');
    const addition = `<link rel="canonical" href="https://mathexam.space/${file.path}">\n`;
    const mutations = [
      ['missing canonical', html.replace(addition, '')],
      ['wrong canonical', html.replace(addition, addition.replace(file.path, 'lessons/'))],
      ['duplicate canonical', html.replace(addition, addition + addition)],
      ['canonical in body', html.replace(addition, '').replace('</body>', addition + '</body>')],
      ['extra script', html.replace(addition, addition + '<script>window.unapproved = true;</script>')],
      ['noindex', html.replace(addition, addition + '<meta name="robots" content="noindex">')],
      ['changed content', html.replace('</body>', '<p>Unapproved content</p></body>')],
    ];
    for (const [label, changed] of mutations) {
      assert.notEqual(changed, html, file.path + ': mutation must apply: ' + label);
      assert.throws(() => assertPreservedTrainer(changed, file), { name: 'AssertionError' }, label);
    }
  }
});

test('percentage map preserves its original hashes after exact navigation and catalog additions', () => {
  const file = fixture.files.find(x => x.path.endsWith('/index.html'));
  assert.equal(file.path, 'trainers/oge-basics/percentages/index.html');
  assert.equal(fixture.injection, '<!-- BEGIN OGE BASICS CONTEXTUAL SHELL -->\n'
    + '<link rel="stylesheet" href="../navigation-minimal.css?v=20261020">\n'
    + '<script defer src="../navigation-minimal.js?v=20261020"></script>\n'
    + '<!-- END OGE BASICS CONTEXTUAL SHELL -->');
  const html = fs.readFileSync(path.join(root, file.path), 'utf8');
  assertPreservedMap(html);
});

test('catalog normalization rejects hidden scripts, altered links and unrelated page changes', () => {
  const html = fs.readFileSync(path.join(root, 'trainers/oge-basics/percentages/index.html'), 'utf8');
  const mutations = [
    ['script inside fallback', html.replace(fallbackStart, fallbackStart + '<script>window.unapproved = true;</script>')],
    ['changed fallback destination', html.replace('href="percent-meaning.html"', 'href="percent-change.html"')],
    ['missing clear statement', html.replace('box.replaceChildren();\n', '')],
    ['duplicate clear statement', html.replace('box.replaceChildren();', 'box.replaceChildren();box.replaceChildren();')],
    ['changed runtime outside fallback', html.replace('let store={};', 'let store={changed:true};')],
    ['new noindex directive', html.replace('</head>', '<meta name="robots" content="noindex"></head>')],
  ];
  for (const [label, changed] of mutations) {
    assert.notEqual(changed, html, label + ': mutation must apply');
    assert.throws(() => assertPreservedMap(changed), { name: 'AssertionError' }, label);
  }
});
