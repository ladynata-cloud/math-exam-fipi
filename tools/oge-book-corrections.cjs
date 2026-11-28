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


/* Exact inverse of the reviewed fraction-meaning correction only.
 * The original book audit hashes are still checked after this inverse;
 * no unrelated source change, missing correction or duplicate is allowed. */
const fractionMeaningCorrections = Object.freeze([
  {
    "before": "\"Если умножить числитель и знаменатель на одно и то же число, значение не изменится.\"",
    "after": "\"Если умножить числитель и знаменатель на одно и то же натуральное число, значение дроби не изменится. На ноль умножать нельзя: знаменатель станет нулём.\""
  },
  {
    "before": "\"Сократите дробь <strong>4/10</strong>. Ответ запишите через /.\", \"answer\": {\"n\": 2, \"d\": 5}, \"unit\": \"\"",
    "after": "\"Сократите дробь <strong>4/10</strong> до несократимой. Ответ запишите через /.\", \"answer\": {\"n\": 2, \"d\": 5}, \"strict\": true, \"unit\": \"\""
  },
  {
    "before": "",
    "after": "      if(Number.isSafeInteger(answer)){\n        const s=normalize(raw);\n        if(/^[-+]?\\d+\\/[-+]?\\d+$/.test(s)){\n          const [n,d]=s.split('/').map(BigInt);\n          return d!==0n && n===BigInt(answer)*d;\n        }\n        if(!/^[-+]?\\d+(?:\\.0+)?$/.test(s))return false;\n        return BigInt(s.split('.')[0])===BigInt(answer);\n      }\n"
  }
].map(Object.freeze));

function restoreFractionMeaningBytes(source) {
  const marker = 'definitions["fraction-meaning"]=function(seed){';
  assert.equal(source.split(marker).length, 2, 'exactly one fraction-meaning definition');
  const start = source.indexOf(marker);
  const end = source.indexOf('\ndefinitions[', start + marker.length);
  assert.equal(end > start, true, 'fraction-meaning definition must have its original boundary');
  let definition = source.slice(start, end);
  for (const {before, after} of fractionMeaningCorrections) {
    assert.equal(definition.split(after).length, 2, 'exactly one reviewed fraction correction');
    assert.equal(source.split(after).length, 2, 'fraction correction must not be duplicated in another definition');
    if (before) assert.equal(definition.includes(before), false, 'unfixed fraction fragment must be absent');
    definition = definition.replace(after, before);
  }
  return source.slice(0, start) + definition + source.slice(end);
}

function restoreHistoricalBytes(file, source) {
  const permitted = file === 'trainers/oge-basics/learning-bank.js'
    ? ['negativeComparison', 'percentDecrease']
    : file === 'trainers/oge-basics/percentages/percent-change.html'
      ? ['percentDecrease'] : [];
  let restored = String(source);
  if (file === 'trainers/oge-basics/learning-bank.js') restored = restoreFractionMeaningBytes(restored);
  for (const key of permitted) {
    const {before, after} = corrections[key];
    assert.equal(restored.split(after).length, 2, file + ': exactly one corrected ' + key + ' fragment');
    assert.equal(restored.includes(before), false, file + ': defective ' + key + ' fragment must be absent');
    restored = restored.replace(after, before);
  }
  return restored;
}

module.exports = {corrections, fractionMeaningCorrections, restoreFractionMeaningBytes, restoreHistoricalBytes};
