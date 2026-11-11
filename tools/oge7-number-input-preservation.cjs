'use strict';
const assert = require('node:assert/strict');

// Exact inverse of the reviewed OGE7 user-input guard. The caller must still
// compare the complete restored script/document with its existing immutable
// baseline. No other byte, hash, control, math rule or receipt is relaxed.
const BEFORE = String.raw`  m=s.match(/^(-?\d+)\s*\/\s*(\d+)$/); if(m){ return Q(BigInt(m[1]),BigInt(m[2])); }`;
const AFTER = String.raw`  m=s.match(/^(-?\d+)\s*\/\s*(\d+)$/); if(m){
    const d=BigInt(m[2]); return d===0n?null:Q(BigInt(m[1]),d); }`;

function restoreOge7Input(source) {
  const text = String(source);
  assert.equal(text.split(AFTER).length, 2, 'OGE7 input: exactly one reviewed fraction guard');
  assert.equal(text.split(BEFORE).length, 1, 'OGE7 input: legacy fraction branch must not coexist');
  return text.replace(AFTER, BEFORE);
}

module.exports = {restoreOge7Input, BEFORE, AFTER};
