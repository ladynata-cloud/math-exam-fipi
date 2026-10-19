'use strict';
const assert=require('node:assert/strict'),C=require('../trainers/oge-basics/multiplication-division/arithmetic-foundations-core.js'),M=require('../learning/division-course-map.js');
assert.equal(C.stages.length,12);assert.deepEqual(M.foundationTracks.flatMap(t=>t.stages.map(s=>s.id)),C.stages.map(s=>s.id));
let checked=0;
for(const stage of C.stages)for(let seed=1;seed<=300;seed++){
 const t=C.make(stage.id,seed);assert.equal(t.result,stage.branch==='addition'?t.a+t.b:t.a-t.b);assert(t.result>=0);assert(t.steps.length<22);assert(t.steps.every(s=>/^\d+$/.test(s.answer)&&s.hint&&s.record));
 for(const q of t.steps){
  // Independent arithmetic oracle for every explicitly posed expression.
  const expression=q.prompt.match(/(\d+)\s*([+−])\s*(\d+)(?:\s*\+\s*(\d+)\s*\(перенос\))?\s*= \?/);
  if(expression){const [,a,op,b,c]=expression;assert.equal(Number(q.answer),op==='+'?Number(a)+Number(b)+Number(c||0):Number(a)-Number(b));}
 }
 if(stage.id==='add-carry')assert(t.a%10+t.b%10>=10);
 if(stage.id==='add-chain'){assert(t.a%10+t.b%10>=10);assert(Math.floor(t.a/10)%10+Math.floor(t.b/10)%10+1>=10);}
 if(stage.id==='sub-borrow')assert(t.a%10<t.b%10);
 if(stage.id==='sub-zeros'){assert.equal(Math.floor(t.a/10)%10,0);assert(t.a%10<t.b%10);assert(t.steps.some(q=>q.prompt.includes('пришло 10')));}
 if(stage.branch==='subtraction'){assert.equal(t.steps.at(-1).answer,String(t.a));assert.equal(t.steps.at(-2).answer,String(t.result));}
 else assert.equal(t.steps.at(-1).answer,String(t.result));
 checked++;
}
assert.throws(()=>C.make('unknown'));console.log('ARITHMETIC_FOUNDATIONS_CORE_OK: '+checked+' examples, carry/borrow/zeros and independent expression oracle');
