'use strict';
const assert = require('node:assert/strict');

// Revert only the two reviewed teaching-text changes before comparing with
// historical snapshots. Every other byte stays covered by the original checks.
const changes = [
  ['(при a ≥ 0 и натуральном n). Почему?', '(при a ≥ 0). Почему?'],
  ['} при a ≥ 0 и b ≥ 0. Работает в обе стороны. Для дроби ${M(fr(rt("a"),rt("b"))+" = "+rt(fr("a","b")))} при a ≥ 0 и b &gt; 0.</p>',
    '}. Работает в обе стороны, и с дробью тоже: ${M(fr(rt("a"),rt("b"))+" = "+rt(fr("a","b")))}.</p>'],
];

function restoreRootTeaching(source) {
  let result = source;
  for (const [current, original] of changes) {
    assert.equal(result.split(current).length, 2, 'exact reviewed teaching fragment must occur once');
    result = result.replace(current, original);
  }
  return result;
}

module.exports = { restoreRootTeaching };
