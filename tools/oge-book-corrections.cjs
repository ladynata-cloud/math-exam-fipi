'use strict';
const assert = require('node:assert/strict');

// The 2026-10-31 book audit reproduced these two mathematical defects through
// the learner UI. Historical preservation gates retain their original hashes:
// only these exact, independently tested corrections are reversed for hashing.
// This is not a new baseline or permission to normalize arbitrary source edits.
const corrections = Object.freeze({
  negativeComparison: Object.freeze({
    before: 'function makePracticeTask(){const type=Math.floor(Math.random()*4),a=-9+Math.floor(Math.random()*19),b=-9+Math.floor(Math.random()*19);',
    after: 'function makePracticeTask(){const type=Math.floor(Math.random()*4),a=-9+Math.floor(Math.random()*19);let b=-9+Math.floor(Math.random()*19);while(type===0&&b===a)b=-9+Math.floor(Math.random()*19);'
  }),
  percentDecrease: Object.freeze({
    before: "solution:'Старое значение — 100%. Новое — '+p+'%. Разница '+p+' − 100 = <b>'+diff+'%</b>'",
    after: "solution:'Старое значение — 100%. Новое — '+p+'%. Разница '+(up?p+' − 100':'100 − '+p)+' = <b>'+diff+'%</b>'"
  })
});

function restoreHistoricalBytes(file, source) {
  const permitted = file === 'trainers/oge-basics/learning-bank.js'
    ? ['negativeComparison', 'percentDecrease']
    : file === 'trainers/oge-basics/percentages/percent-change.html'
      ? ['percentDecrease'] : [];
  let restored = String(source);
  for (const key of permitted) {
    const {before, after} = corrections[key];
    assert.equal(restored.split(after).length, 2, file + ': exactly one corrected ' + key + ' fragment');
    assert.equal(restored.includes(before), false, file + ': defective ' + key + ' fragment must be absent');
    restored = restored.replace(after, before);
  }
  return restored;
}

module.exports = {corrections, restoreHistoricalBytes};
