'use strict';
// Test-only projection of the complete, published PR372 release. The fixture
// was read from the exact Git commit, not from a changing authoring worktree.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const published = require('./cone-baseline.json');
const later = require('./sphere-baseline.cjs');
const parts = Object.fromEntries(Array.from({length: 26}, (_, i) => [String(i + 346), [null]]));
for (const number of ['347', '350', '354', '359']) parts[number] = ['а', 'б', 'в'];
for (const number of ['348', '353', '367']) parts[number] = ['а', 'б'];
const ids = new Set(Object.entries(parts).flatMap(([number, values]) => values.map((part, i) =>
  'ex-main-' + number.padStart(4, '0') + (part === null ? '' : '-' + 'abc'[i]))));
ids.add('theory-040');
ids.add('theory-041');
ids.add('theory-042');
const numbers = new Set(Object.keys(parts));
const theoryPoints = new Set(['40', '41', '42']);
const canon = value => Array.isArray(value) ? value.map(canon) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canon(value[key])])) : value;
const sha = value => crypto.createHash('sha256').update(JSON.stringify(canon(value))).digest('hex');
const target = entry => entry.source.collection === 'main' && numbers.has(entry.source.exercise)
  || entry.source.collection === 'theory' && theoryPoints.has(entry.source.point);
const sourceKey = source => source.collection + ':' + (source.exercise || source.point);
const originals = new Map(published.originalSources.map(entry => [sourceKey(entry.source), entry]));
const requiredParts = entry => entry.source.collection === 'theory' ? [null] : parts[entry.source.exercise];

function previousIndex(sourceIndex) {
  if (sourceIndex.entries.some(entry => later.target(entry) && Object.hasOwn(entry, 'requiredParts'))) sourceIndex = later.previousIndex(sourceIndex);
  const copy = structuredClone(sourceIndex), entries = copy.entries.filter(target);
  assert.equal(entries.length, 29, 'exact 26 cone exercises and three theory points');
  for (const entry of entries) {
    if (Object.hasOwn(entry, 'requiredParts')) assert.deepEqual(entry.requiredParts, requiredParts(entry), 'reviewed cone completeness contract');
    delete entry.requiredParts;
    assert.deepEqual(entry, originals.get(sourceKey(entry.source)), 'original cone source metadata');
  }
  assert.equal(sha(copy), published.sourceIndexSHA256, 'exact source index before cone');
  return copy;
}

function previousCourse(course, sourceIndex) {
  if (course.lessons.some(card => later.ids.has(card.id))) {
    course = later.previousCourse(course, sourceIndex);
    sourceIndex = later.previousIndex(sourceIndex);
  }
  previousIndex(sourceIndex);
  const copy = structuredClone(course), seen = new Set(), entries = [];
  copy.lessons = copy.lessons.filter(card => !ids.has(card.id));
  for (const entry of copy.catalog.entries) {
    if (!target(entry)) { entries.push(entry); continue; }
    const key = sourceKey(entry.source);
    if (seen.has(key)) continue;
    seen.add(key);
    const original = originals.get(key);
    entries.push({id: original.id, kind: original.kind, title: original.title,
      source: structuredClone(original.source), revision: 1, status: 'draft'});
  }
  copy.catalog.entries = entries;
  assert.equal(seen.size, 29, 'all original cone source positions retained');
  assert.equal(copy.lessons.length, 554, 'complete prior 554-card course');
  assert.equal(copy.catalog.entries.length, 1383);
  assert.equal(sha(copy), published.canonicalBundleSHA256, 'complete prior 554-card course, including every review');
  return copy;
}

function previousRegistry(registry) {
  if (registry.cards.some(card => later.ids.has(card.id))) registry = later.previousRegistry(registry);
  assert(registry.batches.length === 28 || registry.batches.length === 29, 'only one cone review batch may be appended');
  if (registry.batches.length === 29) {
    const added = registry.batches[28].cardIds;
    assert.equal(new Set(added).size, 40, 'unique cone review IDs');
    assert.deepEqual([...added].sort(), [...ids].sort(), 'only the exact cone review batch');
  }
  const copy = {...structuredClone(registry), ...structuredClone(published.registryMetadata)};
  copy.cards = copy.cards.filter(card => !ids.has(card.id));
  copy.batches = copy.batches.slice(0, 28);
  assert.equal(copy.cards.length, 554, 'complete prior 554 review rows');
  assert.equal(sha(copy), published.registrySHA256, 'complete prior review registry');
  return copy;
}

function previousCases(cases) {
  if ([...cases.keys()].some(key => later.ids.has(key.split('|')[0]))) cases = later.previousCases(cases);
  const rows = [...cases].filter(([key]) => !ids.has(key.split('|')[0]));
  assert.equal(rows.length, 1478, 'all 1478 prior browser cases');
  assert.equal(sha(rows), published.screenshotCasesSHA256, 'all 1478 prior browser cases');
  return new Map(rows);
}

module.exports = {ids, numbers, theoryPoints, parts, target, requiredParts,
  published, canon, sha, previousIndex, previousCourse, previousRegistry, previousCases};
