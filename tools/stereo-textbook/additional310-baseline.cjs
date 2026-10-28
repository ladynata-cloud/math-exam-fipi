'use strict';
// Test-only projection of the complete published 507-card release. Every hash
// was captured directly from the named Git base, before new content was added.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const published = require('./additional310-baseline.json');
const parts = Object.fromEntries(Array.from({length: 10}, (_, i) => [
  String(i + 310), i + 310 === 311 ? ['а', 'б'] : [null]
]));
const ids = new Set([
  'ex-main-0310', 'ex-main-0311-a', 'ex-main-0311-b', 'ex-main-0312',
  'ex-main-0313', 'ex-main-0314', 'ex-main-0315', 'ex-main-0316',
  'ex-main-0317', 'ex-main-0318', 'ex-main-0319'
]);
const numbers = new Set(Object.keys(parts));
const canon = value => Array.isArray(value) ? value.map(canon) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canon(value[key])])) : value;
const sha = value => crypto.createHash('sha256').update(JSON.stringify(canon(value))).digest('hex');
const target = entry => entry.source.collection === 'main' && numbers.has(entry.source.exercise);

function previousIndex(sourceIndex) {
  const copy = structuredClone(sourceIndex);
  const entries = copy.entries.filter(target);
  assert.equal(entries.length, 10, 'ten original chapter III final source positions');
  for (const entry of entries) {
    const number = entry.source.exercise;
    assert.equal(entry.id, 'source-main-' + number.padStart(4, '0'));
    assert.deepEqual(entry.source.printedPages, [88]);
    assert.deepEqual(entry.source.pdfPages, [90]);
    assert.deepEqual(entry.sourceSubparts, parts[number].filter(part => part !== null), 'actual printed subparts');
    if (Object.hasOwn(entry, 'requiredParts')) assert.deepEqual(entry.requiredParts, parts[number]);
    delete entry.requiredParts;
  }
  assert.equal(sha(copy), published.sourceIndexSHA256, 'exact source index before additional 310–319');
  return copy;
}

function previousCourse(course, sourceIndex) {
  const index = previousIndex(sourceIndex);
  const originals = new Map(index.entries.filter(target).map(entry => [entry.source.exercise, entry]));
  const copy = structuredClone(course), seen = new Set(), entries = [];
  copy.lessons = copy.lessons.filter(card => !ids.has(card.id));
  for (const entry of copy.catalog.entries) {
    if (!target(entry)) {
      entries.push(entry);
      continue;
    }
    const number = entry.source.exercise;
    if (seen.has(number)) continue;
    seen.add(number);
    const old = originals.get(number);
    entries.push({id: old.id, kind: old.kind, title: old.title,
      source: structuredClone(old.source), revision: 1, status: 'draft'});
  }
  copy.catalog.entries = entries;
  assert.equal(seen.size, 10);
  assert.equal(copy.lessons.length, 507);
  assert.equal(sha(copy), published.canonicalBundleSHA256, 'complete prior 507-card course, including every review');
  return copy;
}

function previousRegistry(registry) {
  const copy = {...structuredClone(registry), ...structuredClone(published.registryMetadata)};
  copy.cards = copy.cards.filter(card => !ids.has(card.id));
  copy.batches = copy.batches.slice(0, published.reviewBatches);
  assert.equal(copy.cards.length, 507);
  assert.equal(copy.batches.length, 26);
  assert.equal(sha(copy), published.registrySHA256, 'complete prior review registry');
  return copy;
}

function previousCases(cases) {
  const rows = [...cases].filter(([key]) => !ids.has(key.split('|')[0]));
  assert.equal(rows.length, 1188);
  assert.equal(sha(rows), published.screenshotCasesSHA256, 'all 1188 prior browser cases');
  return new Map(rows);
}

module.exports = {ids, numbers, parts, target, published, canon, sha,
  previousIndex, previousCourse, previousRegistry, previousCases};
