'use strict';
const assert=require('node:assert/strict'),C=require('./check.js'),G=require('./task-graphs.js'),M=require('./models.js'),tasks=require('./exercises-798-805.json');
const find=n=>tasks.find(t=>t.id==='p26-extra-'+n);
const cube=find('802-d');
for(const right of ['-1.7;1.7','±∛5','cbrt(5);-cbrt(5)','-5^(1/3);5^(1/3)'])assert(C.check(right,cube),right);
for(const wrong of ['1.7','1.7;1.7','-1.6;1.6','-∛(5;∛5'])assert(!C.check(wrong,cube),wrong);
assert(C.check('2.8',find('802-a')));assert(!C.check('2.7',find('802-a')));assert(C.check('√4;-√4',find('802-b')));
for(const [id,submitted]of [['798-e','-1'],['798-f','2'],['798-h','-3'],['804-c','1/2'],['803-a','√6/3']]){
 const q=find(id);assert(C.rationalRootTrial(submitted,q.graph)[0].forbidden);assert(!C.check(submitted,q));
}
const hole=find('799-c').graph.curves[0],pole=find('799-a').graph.curves[0];
assert(Number.isNaN(G.curveValue(hole,2)));assert.equal(G.curveValue(hole,3),0);assert(Number.isNaN(G.curveValue(pole,-3)));
for(let level=1;level<=3;level++)for(let seed=1;seed<=60;seed++){
 const q=M.practiceRationalAudit(seed,level);assert(C.check(q.answer,q));
 assert(C.rationalRootTrial(q.answer,q.graph).every(v=>!v.forbidden&&v.exact));
 assert(C.rationalRootTrial(q.graph.excluded[0],q.graph)[0].forbidden);q.steps.forEach(s=>assert(C.check(s.answer,s)));
}
console.log('PASS graph readings with cube roots or precision 0.1, holes and poles, exact algebraic exclusions and 180 fresh tasks');
