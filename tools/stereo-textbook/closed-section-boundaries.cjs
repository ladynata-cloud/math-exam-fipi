'use strict';

const assert = require('node:assert/strict');
const {makeReviewedIncrement} = require('./reviewed-increment.cjs');
const {cards} = require('./closed-section-boundaries.json');
const {digest} = makeReviewedIncrement({cards: {}});
const identity = value => value;

// The source and the historical receipts predate the removal of 16 coincident
// arc endpoints. Only these reviewed cards can be mapped to their previous form.
function previousCard(card) {
  const receipt = cards[card.id];
  if (!receipt) return card;
  const actual = digest(card);
  if (actual === receipt.before.integrated) return card;
  assert.equal(actual, receipt.after.integrated, card.id + ' current reviewed section');
  const old = structuredClone(card);
  for (const [view, index, removed] of receipt.restore)
    old.visualization.model.views[view].polygon.splice(index, 0, removed);
  assert.equal(digest(old), receipt.before.integrated, card.id + ' previous complete lesson');
  return old;
}

function previousHash(hash, receipt, key) {
  if (hash === receipt.before[key]) return hash;
  assert.equal(hash, receipt.after[key], 'current reviewed ' + key + ' bytes');
  return receipt.before[key];
}

function courseBefore(course) {
  return {...course, lessons: course.lessons.map(previousCard)};
}
function registryBefore(registry) {
  const rows = registry.cards.map(row => {
    const receipt = cards[row.id];
    return receipt ? {...row, sha256: previousHash(row.sha256, receipt, 'authored')} : row;
  });
  return {...registry, cards: rows};
}
function rawBefore(rows) {
  return rows.map(([file, hash]) => {
    const receipt = cards[file.replace(/\.json$/, '')];
    return [file, receipt ? previousHash(hash, receipt, 'raw') : hash];
  });
}
module.exports = {previousCard, courseBefore, registryBefore, rawBefore, indexBefore: identity, casesBefore: identity};
