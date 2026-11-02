'use strict';
// Exact, test-only projection to the published 640-card course. The approved
// increment is validated before removal; no unknown identity can be hidden.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const published = require('./iv-selfcheck-baseline.json');
const manifest = require('../../content-drafts/atanasyan-chapter-iv-selfcheck/manifest.json');
const ids = new Set(manifest.cards);
const canon = value => Array.isArray(value) ? value.map(canon) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canon(value[key])])) : value;
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const sha = value => hash(JSON.stringify(canon(value)));
const target = entry => entry.source.collection === 'selfcheck' && entry.source.chapter === 'IV. Цилиндр, конус и шар';
const originals = new Map(published.originalSources.map(entry => [entry.source.exercise, entry]));
function exact(actual, expected, label) {
  assert.equal(new Set(actual).size, actual.length, label + ': unique');
  assert.deepEqual([...actual].sort(), [...expected].sort(), label);
}
function previousIndex(index) {
  const copy = structuredClone(index), entries = copy.entries.filter(target);
  assert.equal(entries.length, 10, 'ten original IV self-check sources');
  const contracts = entries.filter(entry => Object.hasOwn(entry, 'requiredParts')).length;
  assert(contracts === 0 || contracts === 10, 'all ten IV contracts added together');
  for (const entry of entries) {
    if (contracts) assert.deepEqual(entry.requiredParts, manifest.proposedSourceContracts[entry.source.exercise], 'exact IV source parts');
    delete entry.requiredParts;
    assert.deepEqual(entry, originals.get(entry.source.exercise), 'unchanged IV source metadata');
  }
  assert.equal(sha(copy), published.sourceIndexSHA256, 'complete original source index');
  return copy;
}
function previousCourse(course, index) {
  const added = course.lessons.filter(card => ids.has(card.id));
  if (!added.length && !course.catalog.entries.some(entry => ids.has(entry.id))) return structuredClone(course);
  previousIndex(index);
  exact(added.map(card => card.id), ids, 'all thirteen integrated IV cards');
  for (const card of added) assert.equal(sha(card), published.integratedHashes[card.id], 'exact reviewed IV content and flags: ' + card.id);
  exact(course.catalog.entries.filter(target).map(entry => entry.id), ids, 'all thirteen IV catalog entries');
  const copy = structuredClone(course), seen = new Set();
  copy.lessons = copy.lessons.filter(card => !ids.has(card.id));
  copy.catalog.entries = copy.catalog.entries.flatMap(entry => {
    if (!target(entry)) return [entry];
    const card = added.find(card => card.id === entry.id);
    assert.deepEqual(entry, Object.fromEntries(['id','revision','kind','title','status','source'].map(key => [key, card[key]])), 'IV catalog matches reviewed card');
    const number = entry.source.exercise;
    if (seen.has(number)) return [];
    seen.add(number);
    const original = originals.get(number);
    return [{id: original.id, kind: original.kind, title: original.title, source: structuredClone(original.source), revision: 1, status: 'draft'}];
  });
  assert.equal(copy.lessons.length, 640, 'all 640 historical cards');
  assert.equal(copy.catalog.entries.length, published.catalogEntries, 'complete historical catalog');
  assert.equal(sha(copy), published.canonicalBundleSHA256, 'all 640 historical cards and review flags preserved');
  return copy;
}
function previousRegistry(registry) {
  const added = registry.cards.filter(card => ids.has(card.id));
  if (!added.length) return structuredClone(registry);
  exact(added.map(card => card.id), ids, 'thirteen new review rows');
  assert.equal(registry.batches.length, published.reviewBatches + 1, 'one new IV review batch');
  exact(registry.batches.at(-1).cardIds, ids, 'exact IV review batch');
  for (const row of added) assert.equal(row.sha256, published.contentHashes[row.id], 'exact IV review hash');
  const copy = {...structuredClone(registry), ...structuredClone(published.registryMetadata)};
  copy.cards = copy.cards.filter(card => !ids.has(card.id));
  copy.batches = copy.batches.slice(0, published.reviewBatches);
  assert.equal(sha(copy), published.registrySHA256, 'complete historical registry');
  return copy;
}
function previousCases(cases) {
  const all = [...cases], rows = all.filter(([key]) => !ids.has(key.split('|')[0]));
  if (rows.length === all.length) return new Map(rows);
  assert.equal(rows.length, published.screenshotCases, 'all historical browser cases');
  assert.equal(sha(rows), published.screenshotCasesSHA256, 'exact historical browser cases');
  assert.deepEqual(all.slice(0, rows.length), rows, 'IV cases append after the entire historical sequence');
  exact([...new Set(all.slice(rows.length).map(([key]) => key.split('|')[0]))], ids, 'browser cases cover all thirteen IV cards');
  return new Map(rows);
}
function previousRawLessons(rows) {
  const added = rows.filter(([name]) => ids.has(name.replace(/\.json$/, '')));
  if (!added.length) return rows;
  exact(added.map(([name]) => name.slice(0,-5)), ids, 'exact thirteen IV lesson filenames');
  const old = rows.filter(([name]) => !ids.has(name.replace(/\.json$/, ''))).sort(([a],[b]) => a < b ? -1 : a > b ? 1 : 0);
  assert.equal(old.length, 640);
  assert.equal(sha(old), published.rawLessonManifestSHA256, 'all 640 historical lesson bytes');
  return old;
}
function previousLessonFiles(directory) {
  return previousRawLessons(fs.readdirSync(directory).filter(name => name.endsWith('.json')).sort()
    .map(name => [name, hash(fs.readFileSync(path.join(directory, name)))])).map(([name]) => name);
}
module.exports = {ids, target, published, canon, hash, sha, exact, previousIndex, previousCourse, previousRegistry, previousCases, previousRawLessons, previousLessonFiles};
