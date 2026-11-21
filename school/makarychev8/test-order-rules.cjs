'use strict';
const assert=require('node:assert/strict'),C=require('./check.js'),G=require('./task-graphs.js'),M=require('./models.js'),ts=require('./exercises-860-868.json');
const find=id=>ts.find(t=>t.id==='p35-source-'+id),order=find('860');
assert(C.check('-3;-2;0;5;-4',order));assert(!C.check('-3;-2;0;5;0',order));assert(!C.check('0;0;1;2;-2',order));assert(!C.check('0;1;2;3',order));assert(C.check('1/4;1/3;1/2;2;1/5',order));
const uncertain=find('862-d');for(const [i,raw]of [[1,'-102;-95'],[2,'-10;-5'],[3,'-10;-9']])assert(C.check(raw,uncertain.steps[i]));
assert(!C.check('2;1',uncertain.steps[3]));assert(!C.check('0;5',uncertain.steps[1]));
assert(C.check('-12<13',find('864-a-1')));assert(!C.check('13<-12',find('864-a-1')));
assert(!C.orderInput('no<1',find('864-a-1')));assert(!C.orderInput('z<a',find('865-а')||find('865-a')));
const scale=find('865-d');assert(C.check('3a<3b',scale));assert(C.check('b/(1/3)>a/(1/3)',scale));assert(!C.check('a/3<b/3',scale));
for(let seed=0;seed<60;seed++)for(let level=1;level<=3;level++){
 const t=M.practiceOrder(seed,level),[left,sign,right]=t.answer.match(/^(-?\d+)([<>])(-?\d+)$/).slice(1);
 assert(C.check(t.answer,t));assert(C.check(right+(sign==='<'?'>':'<')+left,t));assert(!C.check(left+(sign==='<'?'>':'<')+right,t));
 for(const q of t.steps)assert(C.check(q.answer,q));
}
console.log('PASS exact rational placements, all three gap outcomes, positive and negative multipliers, 180 variants');
