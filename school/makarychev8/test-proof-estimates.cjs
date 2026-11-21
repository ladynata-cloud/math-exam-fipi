'use strict';
const assert=require('node:assert/strict'),C=require('./check.js'),G=require('./task-graphs.js'),M=require('./models.js'),ts=require('./exercises-1004-1013.json');
for(const t of ts){
 assert.equal(t.kind,'proof-chain');assert(C.check(t.answer,t));assert(!C.check(t.answer.split(';').reverse().join(';'),t));
 assert.equal(new Set(t.proofClaims).size,4);for(const s of t.steps)assert(C.check(s.answer,s));
 const q=t.steps[0];assert(!C.check('0;0;0;0',q));if(t.graph.type==='inequality-evidence')assert(G.inequalityTrial(t.graph,q.answer,true));
}
for(const [d,ok,no]of [['product-nine','1/2;3;6','1;2;3'],['root-sum-one','-1/4;1/4;1','-1/2;1/2;1'],['above-one','1000001/1000000','1'],['ride-plan','3;1/5','2;1/5']]){const n=ok.split(';').length;assert(G.admissibleSample(ok,d,n));assert(!G.admissibleSample(no,d,n));}
for(let seed=0;seed<60;seed++)for(let level=1;level<=3;level++){const t=M.practiceProofEstimate(seed,level);assert(C.check(t.answer,t));for(const s of t.steps)assert(C.check(s.answer,s));assert(!C.check('1;2;3;4',t));const b=2+seed%9;assert.equal(G.inequalityTrial(t.graph,String(b),true).sign,level===3?'>':'=');}
console.log('PASS proof order, four source-specific domains and 180 generated comparisons with equality witnesses');
