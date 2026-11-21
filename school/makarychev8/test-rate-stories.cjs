'use strict';
const assert=require('node:assert/strict'),C=require('./check.js'),M=require('./models.js');
for(const [ratios,accepted,rejected] of [
 [['-√3','1/2'],['2;-2√3;1','√3;-3;√3/2','1+√3;-3-√3;(1+√3)/2'],['0;0;0','2;2√3;1','2;-2√3;2','1;;3']],
 [['-4','1'],['-1;4;-1','0,5;-2;1/2'],['0;0;0','-1;-4;-1','1;-4;-1']]]){
 const card={kind:'equation-from-roots',ratios};for(const x of accepted)assert(C.check(x,card),x);
 for(const x of rejected)assert(!C.check(x,card),x);
}
for(const x of ['2;3;-4;1','1/2;0;3;0','-3;-5;6,8;2'])assert(C.check(x,{kind:'examples-of-equations'}));
for(const x of ['0;3;4;5','2;;3;0','2;3;1/0;5'])assert(!C.check(x,{kind:'examples-of-equations'}));
for(let level=1;level<=3;level++)for(let seed=1;seed<=60;seed++){
 const q=M.practiceRates(seed,level),g=q.graph,answers=q.answer.split(';').map(Number);
 assert(C.check(q.answer,q));
 for(const s of q.steps)assert(C.check(s.answer,s));
 const results=answers.map(x=>g.rows.map(r=>r.total/(x+r.offset)));
 if(level===3){
  assert.equal(new Set(answers).size,2);assert(answers.every(a=>a>2));
  for(const [up,lake] of results)assert(Math.abs(lake-up-1)<1e-10);
 }else{
  const expected=Number(q.steps[1].answer),[a,b]=results[0];
  assert.equal(level===1?a-b:b-a,expected);
 }
}
console.log('PASS equations with freely scaled rational and irrational coefficients; 180 independent new-data checks');
