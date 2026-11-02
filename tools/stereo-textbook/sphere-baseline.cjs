'use strict';
// Test-only exact projection to the published PR374 tree. Every frozen value
// was read from Git 139b944a, never from the evolving sphere authoring worktree.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const published = require('./sphere-baseline.json');
const parts = Object.fromEntries(Array.from({length: 24}, (_, i) => [String(i + 372), [null]]));
for (const number of ['372', '382', '383', '384']) parts[number] = ['а', 'б'];
for (const number of ['373', '381', '388']) parts[number] = ['а', 'б', 'в', 'г'];
const ids = new Set(Object.entries(parts).flatMap(([number, values]) => values.map((part, i) =>
  'ex-main-' + number.padStart(4, '0') + (part === null ? '' : '-' + 'abcd'[i]))));
for (let point = 43; point <= 51; point++) ids.add('theory-' + String(point).padStart(3, '0'));
assert.equal(ids.size, 46, 'exact 37 sphere exercise parts and nine theory cards');
const numbers = new Set(Object.keys(parts));
const theoryPoints = new Set(Array.from({length: 9}, (_, i) => String(i + 43)));
const canon = value => Array.isArray(value) ? value.map(canon) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canon(value[key])])) : value;
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const sha = value => hash(JSON.stringify(canon(value)));
const target = entry => entry.source.collection === 'main' && numbers.has(entry.source.exercise)
  || entry.source.collection === 'theory' && theoryPoints.has(entry.source.point);
const sourceKey = source => source.collection + ':' + (source.exercise || source.point);
const originals = new Map(published.originalSources.map(entry => [sourceKey(entry.source), entry]));
const requiredParts = entry => entry.source.collection === 'theory' ? [null] : parts[entry.source.exercise];
const exactIds = (actual, expected, label) => {
  assert.equal(new Set(actual).size, actual.length, label + ': unique identities');
  assert.deepEqual([...actual].sort(), [...expected].sort(), label);
};

function previousIndex(sourceIndex) {
  const copy = structuredClone(sourceIndex), entries = copy.entries.filter(target);
  assert.equal(entries.length, 33, 'exact 24 sphere exercises and nine theory points');
  const contracts = entries.filter(entry => Object.hasOwn(entry, 'requiredParts')).length;
  assert(contracts === 0 || contracts === 33, 'all 33 sphere completeness contracts are added together');
  for (const entry of entries) {
    if (Object.hasOwn(entry, 'requiredParts')) assert.deepEqual(entry.requiredParts, requiredParts(entry), 'reviewed sphere completeness contract');
    delete entry.requiredParts;
    // The printed source has both 382а and 382б. This exact metadata repair is
    // part of this release; all other source metadata must stay byte-for-value.
    if (entry.source.collection === 'main' && entry.source.exercise === '382') {
      assert.deepEqual(entry.sourceSubparts, contracts === 33 ? ['а', 'б'] : ['а'], 'exact sphere 382 source-subpart repair');
      entry.sourceSubparts = ['а'];
    }
    assert.deepEqual(entry, originals.get(sourceKey(entry.source)), 'original sphere source metadata');
  }
  assert.equal(sha(copy), published.sourceIndexSHA256, 'exact source index before sphere');
  return copy;
}

function previousCourse(course, sourceIndex) {
  previousIndex(sourceIndex);
  const copy = structuredClone(course), added = copy.lessons.filter(card => ids.has(card.id));
  const hasSphere = added.length > 0;
  if (hasSphere) exactIds(added.map(card => card.id), ids, 'all and only 46 sphere cards');
  const catalogAdded = copy.catalog.entries.filter(entry => ids.has(entry.id));
  if (hasSphere) exactIds(catalogAdded.map(entry => entry.id), ids, 'all and only 46 sphere catalog entries');
  else assert.equal(catalogAdded.length, 0, 'no sphere catalog entry without authored cards');
  copy.lessons = copy.lessons.filter(card => !ids.has(card.id));
  const seen = new Set(), entries = [];
  for (const entry of copy.catalog.entries) {
    if (!target(entry)) {
      assert(!ids.has(entry.id), 'sphere identity cannot be attached to another source');
      entries.push(entry);
      continue;
    }
    const key = sourceKey(entry.source), original = originals.get(key);
    if (hasSphere) {
      assert(ids.has(entry.id), 'only exact sphere catalog identities may be projected');
      const card = added.find(card => card.id === entry.id);
      assert.deepEqual(entry, Object.fromEntries(['id', 'revision', 'kind', 'title', 'status', 'source'].map(field => [field, card[field]])), 'sphere catalog matches its authored card');
    } else {
      assert.deepEqual(entry, {id: original.id, kind: original.kind, title: original.title,
        source: original.source, revision: 1, status: 'draft'}, 'original pending sphere catalog entry');
    }
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({id: original.id, kind: original.kind, title: original.title,
      source: structuredClone(original.source), revision: 1, status: 'draft'});
  }
  copy.catalog.entries = entries;
  assert.equal(seen.size, 33, 'all original sphere source positions retained');
  assert.equal(copy.lessons.length, 594, 'complete prior 594-card course');
  assert.equal(copy.catalog.entries.length, 1394, 'complete prior 1394-entry catalog');
  assert.equal(sha(copy), published.canonicalBundleSHA256, 'complete prior 594-card course, including every review');
  return copy;
}

function previousRegistry(registry) {
  const added = registry.cards.filter(card => ids.has(card.id));
  assert(registry.batches.length === 29 || registry.batches.length === 30, 'only one sphere review batch may be appended');
  if (registry.batches.length === 30) {
    exactIds(added.map(card => card.id), ids, 'all and only 46 sphere review rows');
    exactIds(registry.batches[29].cardIds, ids, 'only the exact sphere review batch');
  } else assert.equal(added.length, 0, 'sphere review rows require their independent batch');
  const copy = {...structuredClone(registry), ...structuredClone(published.registryMetadata)};
  copy.cards = copy.cards.filter(card => !ids.has(card.id));
  copy.batches = copy.batches.slice(0, 29);
  assert.equal(copy.cards.length, 594, 'complete prior 594 review rows');
  assert.equal(sha(copy), published.registrySHA256, 'complete prior review registry');
  return copy;
}

function previousCases(cases) {
  const all = [...cases], rows = all.filter(([key]) => !ids.has(key.split('|')[0]));
  assert.equal(rows.length, 1685, 'all 1685 prior browser cases');
  assert.equal(sha(rows), published.screenshotCasesSHA256, 'all 1685 prior browser cases');
  assert.deepEqual(all.slice(0, 1685), rows, 'sphere cases append after the complete historical sequence');
  if (all.length > rows.length) exactIds([...new Set(all.slice(1685).map(([key]) => key.split('|')[0]))], ids, 'browser cases cover every sphere identity');
  return new Map(rows);
}

function previousRawLessons(manifest) {
  assert.equal(new Set(manifest.map(([name]) => name)).size, manifest.length, 'unique authored lesson filenames');
  const added = manifest.filter(([name]) => ids.has(name.replace(/\.json$/, '')));
  if (added.length) exactIds(added.map(([name]) => name), [...ids].map(id => id + '.json'), 'all and only 46 sphere authored lesson filenames');
  const rows = manifest.filter(([name]) => !ids.has(name.replace(/\.json$/, ''))).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
  assert.equal(rows.length, 594, 'all 594 prior authored lesson files');
  assert.equal(sha(rows), published.rawLessonManifestSHA256, 'all 594 prior authored lesson files byte-identical');
  return rows;
}

function previousLessonFiles(directory) {
  const manifest = fs.readdirSync(directory).filter(name => name.endsWith('.json')).sort()
    .map(name => [name, hash(fs.readFileSync(path.join(directory, name)))]);
  return previousRawLessons(manifest).map(([name]) => name);
}

module.exports = {ids, numbers, theoryPoints, parts, target, requiredParts,
  published, canon, sha, previousIndex, previousCourse, previousRegistry, previousCases,
  previousRawLessons, previousLessonFiles};
