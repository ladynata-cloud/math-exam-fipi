'use strict';
const assert=require('node:assert/strict'),C=require('./check.js'),M=require('./models.js'),cards=require('./exercises-743-752.json');
for(const q of cards.filter(t=>t.graph?.type==='root-residual')){
 const evidence=C.quadraticTrial(q.answer,q.quadraticCoefficients);
 assert(evidence.length>=1);
 if(q.graph.mode==='exact')assert(evidence.every(r=>r.exact),q.title);
 else assert(evidence.every(r=>!r.exact),q.title);
}
const coeff=[1,-2,-5];
for(const trial of ['1±√6','1+√(6);1-√6','1+√24/2;1-√(24)/2'])assert(C.quadraticTrial(trial,coeff).every(e=>e.exact));
assert.deepEqual(C.quadraticTrial('1+√6;1+√5',coeff).map(e=>e.exact),[true,false]);
for(const invalid of ['','√','1;','0;0;0','not a root'])assert.deepEqual(C.quadraticTrial(invalid,coeff),[]);
const cases=cards.filter(t=>t.id.includes('744-a-pair'));
assert(C.check('0;a*(a+1)/(a+1)',cases[0]));assert(!C.check('0;a*(a-1)/(a-1)',cases[0]));
for(let seed=1;seed<=60;seed++)for(let level=1;level<=3;level++){
 const t=M.practiceCertificate(seed,level),[k,h,r]=t.answer.split(';').map(Number),[a,b,c]=t.graph.targets[0];
 assert(C.check(t.answer,t));assert(k>0&&r>0);
 for(const x of [-11,-1,0,h,3,11])assert.equal(k*(x-h)**2+r,a*x*x+b*x+c);
 t.steps.forEach(s=>assert(C.check(s.answer,s)));
}
console.log('PASS exact residuals including irrational candidates, parameter scope and 180 fresh completed squares');
