'use strict';
const assert=require('node:assert/strict'),C=require('./check.js'),G=require('./task-graphs.js'),M=require('./models.js'),ts=require('./exercises-838-845.json'),find=label=>ts.find(t=>t.title===label);
const a=find('№ 844а'),d=find('№ 844г'),b=find('№ 841, общий вывод');for(const v of ['-9','-19/2','-1000000'])assert(C.check(v,a),v);
for(const v of ['-8.999999999','1000','всегда','0/0'])assert(!C.check(v,a),v);
assert(C.check('-28/3',b));assert(C.check('0',d));assert(C.check('1000000',d));assert(!C.check('-0.0000001',d));
const square=find('№ 845д').graph;assert.equal(G.inequalityTrial(square,'2;2').sign,'=');assert.equal(G.inequalityTrial(square,'2;3').sign,'>');assert.equal(G.inequalityTrial(square,'1/5;1/5').sign,'=');
assert.equal(new Set(ts.filter(t=>t.kind==='proof-chain').map(t=>t.answer)).size>=8,true);
for(let seed=0;seed<50;seed++)for(let level=1;level<=3;level++){
 const t=M.practiceInequality(seed,level),h=1+seed%12,k=1+Math.floor(seed/3)%7;
 const answer=String(level===1?k*k:level===2?h:h-k);assert(C.check(answer,t));if(level===3){assert(C.check(String(h-k-1234),t));assert(!C.check(String(h-k+1),t));}
 for(const step of t.steps)assert(C.check(step.answer,step));
}
console.log('PASS exact comparisons, arbitrarily large counterexamples, equality and 150 independent practice variations');
