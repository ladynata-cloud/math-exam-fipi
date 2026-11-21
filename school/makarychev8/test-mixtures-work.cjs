'use strict';
const assert=require('node:assert/strict'),C=require('./check.js'),G=require('./task-graphs.js'),M=require('./models.js'),tasks=require('./exercises-822-831.json');
for(const t of tasks)for(const x of t.steps[2].answer.split(';'))assert(G.quantityTrial(t.graph,x).agrees,t.title);
const alloy=tasks[4].graph;assert.equal(G.quantityTrial(alloy,'12').value,'13/50');
assert.deepEqual(G.quantityTrial(alloy,'25').rows.map(row=>row.value),['19','19/25','1/2']);
assert(!G.quantityTrial(alloy,'5').valid);assert(!G.quantityTrial(alloy,'23').agrees);assert(!G.quantityTrial(tasks[9].graph,'30').valid);
for(let seed=0;seed<80;seed++)for(let l=1;l<=3;l++){
 const t=M.practiceMixture(seed,l),nums=t.prompt.match(/\d+/g).map(Number),[mass,copper,added]=nums;
 const old=100*copper/mass,after=100*copper/(mass+added);assert(C.check(String([old,after,old-after][l-1]),t));
 const j=M.practiceJoint(seed,l),[a,b,h]=j.prompt.match(/\d+/g).map(Number),right=l===1?h/a:l===2?h/a+h/b:a*b/(a+b);
 const q=j.answer.split('/').map(Number);assert(Math.abs(q[0]/(q[1]||1)-right)<1e-9);
 for(const generated of [t,j]){assert(C.check(generated.answer,generated));for(const s of generated.steps)assert(C.check(s.answer,s));}
}
console.log('PASS original quantity model and 480 independently evaluated composition/work variants');
