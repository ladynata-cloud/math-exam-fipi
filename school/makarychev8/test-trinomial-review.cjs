'use strict';
const assert=require('node:assert/strict'),C=require('./check.js'),G=require('./task-graphs.js'),M=require('./models.js'),ts=require('./exercises-783-797.json');
for(const q of ts.filter(t=>t.graph?.type==='factor-witness')){
 const [lead,...roots]=q.answer.split(';');assert(C.check([lead,...roots.reverse()].join(';'),q));assert.deepEqual(C.vietaAudit(roots.join(';'),q.graph),{sum:true,product:true});
}
const frac=(suffix)=>ts.find(q=>q.id==='p25-extra-'+suffix+'-domain').graph;
for(const [q,v,original,reduced]of [[frac('797-d'),'-5',null,'1/3'],[frac('797-d'),'5',null,'11/3'],[frac('797-d'),'6','4','4'],[frac('796-b'),'2;4',null,'3'],[frac('796-b'),'3;3',null,null],[frac('796-b'),'3;4','5','5']]){
 assert.deepEqual(G.sourceFractionTrial(q,v),{original,reduced});
}
for(const level of [1,2,3])for(let seed=1;seed<=60;seed++){
 const t=M.practiceFractionDomain(seed,level),[h,k]=t.answer.split(';');
 assert(C.check(t.answer,t));const special=G.sourceFractionTrial(t.graph,h),singular=G.sourceFractionTrial(t.graph,k);
 assert(special.original===null&&special.reduced!==null);assert.deepEqual(singular,{original:null,reduced:null});
 t.steps.forEach(q=>assert(C.check(q.answer,q)));
}
assert.deepEqual(G.fractionSample('2/3;0',2),[{n:2,d:3},{n:0,d:1}]);assert.equal(G.fractionSample('101',1),null);assert.equal(G.fractionSample('1/0',1),null);
console.log('PASS quadratic factor witnesses, exact two-variable domains and 180 fresh cancellation problems');
