'use strict';
const assert=require('node:assert/strict'),C=require('./check.js'),M=require('./models.js'),T=require('./exercises-881-897.json');
const task=id=>T.find(t=>t.id==='p36-source-'+id);
for(const input of ['1/5;1/2','-100;2','1;0.0001'])assert(C.check(input,task('894-draw')));
for(const input of ['1','1;0','1;-2','1;2;3'])assert(!C.check(input,task('894-draw')));
assert(C.check('3;5',task('884-b').steps[0]));assert(!C.check('3;4',task('884-b').steps[0]));
assert(C.check('1,5 > 1', {kind:'transformed-order',numericSides:true,answer:'1<1.5'}));
for(let seed=0;seed<60;seed++)for(let level=1;level<=3;level++){
 const t=M.practiceCombined(seed,level),g=t.graph,[[a,b],[c,d]]=g.ranges.map(r=>r.map(Number)),results=[a,b].flatMap(x=>[c,d].map(y=>level===1?x+y:level===2?x-y:x/y));
 const q=C.estimateInput(t.answer,g.expression);assert.equal(q.min,Math.min(...results));assert.equal(q.max,Math.max(...results));assert(C.check(t.answer,t));assert.equal(q.leftOpen,seed%2===1);
 for(const s of t.steps)assert(C.check(s.answer,s));
}
console.log('PASS lower and upper bounds at all four corners, arbitrary medians and 180 practice variants');

