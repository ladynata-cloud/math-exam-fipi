'use strict';
const assert=require('node:assert/strict'),C=require('./check.js'),M=require('./models.js'),cards=require('./exercises-702-718.json');
const get=ref=>cards.find(t=>t.source.reference==='№ '+ref);
const special=get('706в');
assert(C.check('(-sqrt(5)/3;1/3), (1;1), (-1;1), (sqrt(5)/3;1/3)',special));
const v=C.systemEvidence('(-sqrt(5)/3;1/3), (-32;-18), (1;0)',special.graph);
assert.deepEqual(v.map(t=>t.valid),[[true,true],[false,false],[false,false]]);
assert(!C.check('(-1;1),(1;1),(√5/3;1/3),(√5/3;1/3)',special));
assert(!C.check('(1;1),(-1;1)',special));assert.equal(C.algebraPairs('(1;1),'),null);
assert(C.systemEvidence('(0;0)',get('711а').graph)[0].excluded);
assert(C.check('(3/2;∞) или (-inf;-14)',get('718в')));
assert(!C.check('(-∞;-14] ∪ (3/2;+∞)',get('718в')));
assert(!C.check('(-Infinity;-14) ∪ (3/2;+∞) ∪ (3/2;+∞)',get('718в')));
assert.equal(C.openIntervals('(3/2;4'),null); // malformed input is rejected before a mathematical attempt
for(let seed=1;seed<=60;seed++)for(let level=1;level<=3;level++){
 const q=M.practiceSubstitution(seed,level);assert(C.check(q.answer,q));
 assert(C.systemEvidence(q.answer,q.graph).every(row=>row.valid.every(Boolean)));
 for(const s of q.steps)assert(C.check(s.answer,s));
}
console.log('PASS exact rational and radical pairs, independent checks of each equation, interval endpoint states and 180 substitutions');
