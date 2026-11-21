'use strict';
const assert=require('node:assert/strict'),C=require('./check.js'),G=require('./task-graphs.js'),M=require('./models.js'),cards=require('./exercises-753-763.json');
const q=n=>cards[n-753];
for(const n of [753,754]){
 const task=q(n),reversed=task.answer.split('),(').reverse().map(item=>'('+item.replace(/[()]/g,'')+')').join(',');
 assert(C.check(reversed,task));const rows=G.sequenceRows(task.answer,task.graph);
 const first='('+rows[0].join(';')+')';
 for(const wrong of [first,first+','+first,'(1;2)'])assert(!C.check(wrong,task));
 assert(G.sequenceEvidence(task.answer,task.graph).every(row=>row.domain&&row.ordered&&row.correct));
}
assert(!G.sequenceEvidence('(-18;-17)',q(762).graph)[0].domain);
assert.deepEqual(G.sequenceEvidence('(10;12)',q(763).graph).map(r=>[r.domain,r.ordered,r.correct]),[[false,true,false]]);
for(let seed=1;seed<=60;seed++)for(let level=1;level<=3;level++){
 const t=M.practiceAppliedReview(seed,level),model=G.sequenceEvidence(t.answer,t.graph)[0];assert(model.correct);
 assert(C.check(t.answer,t));t.steps.forEach(step=>assert(C.check(step.answer,step)));
}
console.log('PASS signed five-member sequences, duplicate/missing solutions, parity and 180 fresh application tasks');
