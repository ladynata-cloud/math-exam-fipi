'use strict';
const assert=require('node:assert/strict'),C=require('./check.js'),M=require('./models.js'),cards=require('./exercises-764-782.json');
for(const q of cards.filter(t=>t.graph?.type==='vieta-audit'))assert.deepEqual(C.vietaAudit(q.answer,q.graph),{sum:true,product:true});
const q=cards.find(t=>t.title==='№ 764а');
assert.deepEqual(C.vietaAudit('√2;4√2',q.graph),{sum:true,product:false});
assert.deepEqual(C.vietaAudit('-2√2;-3√2',q.graph),{sum:false,product:true});assert.equal(C.vietaAudit('x;',q.graph),null);
const g=cards.find(t=>t.title==='№ 765г');assert(C.check('1/3;-1/7;1/2',g));assert(!C.check('1/3;1/2;1/2',g));
const transfer=cards.find(t=>t.title==='№ 782');assert(C.check('(2q-p^2)/q;1',transfer));assert(!C.check('(p^2-2q)/q;1',transfer));
for(let seed=1;seed<=60;seed++)for(let level=1;level<=3;level++){
 const t=M.practiceInvariants(seed,level);assert(C.check(t.answer,t));assert.deepEqual(C.vietaAudit(t.answer,t.graph),{sum:true,product:true});
 t.steps.forEach(step=>assert(C.check(step.answer,step)));
}
console.log('PASS exact independent Vieta relations, reordered roots, symbolic equations and 180 generated problems');
