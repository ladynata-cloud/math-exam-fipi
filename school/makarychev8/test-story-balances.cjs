'use strict';
const assert=require('node:assert/strict'),C=require('./check.js'),M=require('./models.js'),cards=require('./exercises-719-732.json');
const question=cards.find(t=>t.id==='p32-source-check-1');
for(const x of ['(4;1)','(2;2)','(7;-1/2)'])assert(C.check(x,question));
for(const x of ['(4;2)','(6;0),(4;1)'])assert(!C.check(x,question));
const square=cards.find(t=>t.id==='p32-source-731-a');
assert(C.check('(3-2x)^2',square));assert(!C.check('(2x-3)(2x-3)',square));assert.equal(C.squaredBinomial('(2x-3)(2x-3)',square.answer),'form');
for(let level=1;level<=3;level++)for(let seed=1;seed<=60;seed++){
 const q=M.practiceBalance(seed,level),[x,y]=q.answer.split(';').map(Number);assert(C.check(q.answer,q));
 for(const r of q.graph.checks){
  const num=s=>s.includes('/')?s.split('/').map(Number).reduce((a,b)=>a/b):Number(s);
  assert(Math.abs(num(r.coeff[0])*x+num(r.coeff[1])*y-num(r.rhs))<1e-10);
 }
 for(const s of q.steps)assert(C.check(s.answer,s));
}
console.log('PASS unrestricted control example, square form, 180 independent application systems');
