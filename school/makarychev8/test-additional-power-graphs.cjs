'use strict';
const assert=require('node:assert/strict');
const C=require('./check.js'),G=require('./task-graphs.js'),M=require('../peterson6/math.js'),P=require('./models.js');
const tasks=require('./exercises-1165-1166.json');
assert.equal(tasks.length,7);assert.equal(tasks.reduce((n,t)=>n+t.steps.length,0),21);assert(tasks.every(q=>q.source.page===260&&C.check(q.answer,q)));
for(const [x,status]of [['-1','negative'],['0','zero'],['1.55','below'],['1.65','above']])assert.equal(G.rootReciprocalProbe(2,M.parse(x)).status,status);
assert.equal(G.rootReciprocalProbe(8,M.parse(4)).status,'equal');assert(C.check('8/5',tasks[0]));assert(!C.check('1.58',tasks[0]));
const draw=tasks[1];assert(C.check('9/4;2,25;81/16;729/64;3/2',draw));
for(const [row,why] of [['1;1;1;1;1','anchor'],['1/4;1/4;1/16;1/64;-1/2','height-3'],['4;4;16;8;2','height-2']])assert.equal(G.fourPowerMarks(row).status,why);
assert(C.check('(1;1);(0;0)',tasks[2]));assert(!C.check('(1;1)',tasks[2]));
for(const [index,correct,wrong]of [[3,'x³;x²;x;√x','√x;x;x²;x³'],[4,'корень;прямая;квадрат;куб','x;x³;x²;√x'],[5,'(0,37)³;(0,37)²;0,37;√0,37','x²;x³;x;√x'],[6,'4,6^3;4,6^2;4,6;√4,6','√x;x;x²;x³']]){
 assert(C.check(correct,tasks[index]));assert(!C.check(wrong,tasks[index]));
}
for(const id of ['estimate-root-reciprocal','build-four-powers','compare-four-powers']){
 const seen=new Set();
 for(let seed=0;seed<100;seed++)for(let level=1;level<=3;level++){
  const q=P.practiceFinalFunction(id,seed,level),g=q.graph;assert(C.check(q.answer,q));seen.add(q.prompt);
  if(g.group==='estimate')assert.equal(Math.round(Math.pow(g.k,2/3)*10),Number(q.answer)*10);
  if(g.mode==='draw')assert.equal(G.fourPowerMarks(q.answer).points.length,4);
  if(g.mode==='order'){
   const v=M.parse(g.sample),x=v.n/v.d, heights={прямая:x,квадрат:x*x,куб:x**3,корень:Math.sqrt(x)};
   const own=Object.keys(heights).sort((a,b)=>(g.ascending?1:-1)*(heights[a]-heights[b]));assert.equal(own.join(';'),q.answer);
  }
 }
 assert(seen.size>=15);
}
console.log('PASS 7 tasks, 21 steps, exact curve ordering, movable common abscissa, rounded reading and 900 generated exercises.');
