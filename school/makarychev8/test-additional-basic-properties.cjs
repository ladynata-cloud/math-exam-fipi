'use strict';
const assert=require('node:assert/strict');
const C=require('./check.js'),G=require('./task-graphs.js'),M=require('../peterson6/math.js'),P=require('./models.js');
const tasks=require('./exercises-1167-1169.json');
assert.equal(tasks.length,31);assert.equal(tasks.reduce((n,t)=>n+t.steps.length,0),65);assert(tasks.every(t=>t.source.page===260&&C.check(t.answer,t)));
const entry=(shape,mode)=>tasks.find(t=>t.id==='p45-source-1167-'+shape+'-'+mode);
for(const [shape,sign,direction,wrong]of [['square','(-∞;0)∪(0;+∞)|∅','[0;+∞)|(-∞;0]','(0;+∞)|(-∞;0)'],['cube','(0;+∞)|(-∞;0)','(-∞;+∞)|∅','(-∞;0)|∅'],['sqrt','(0;+∞)|∅','[0;+∞)|∅','(-∞;+∞)|∅'],['absolute','(-∞;0)∪(0;+∞)|∅','[0;+∞)|(-∞;0]','(0;+∞)|∅']]){
 assert(C.check(sign,entry(shape,'sign')));assert(C.check(direction,entry(shape,'direction')));assert(!C.check(wrong,entry(shape,'direction')));
}
for(const [shape,at,value] of [['cube',-2,-8],['square',-2,4],['absolute',-2,2],['sqrt',4,2]])assert.equal(G.elementaryHeight(shape,1,at),value);
assert(Number.isNaN(G.elementaryHeight('sqrt',1,-1)));assert(C.check('y = 4/x',tasks.at(-3)));
for(const [q,nums] of [[tasks.at(-2),[1,3]],[tasks.at(-1),[2,4]]]){
 const good=q.graph.points.flatMap(([x,y],i)=>G.belongsToReciprocal(q.graph.k,M.parse(x),M.parse(y))?[i+1]:[]);assert.deepEqual(good,nums);assert(C.check(nums.slice().reverse().join(';'),q));assert(!C.check('1;2;3;4',q));
}
for(const id of ['read-basic-function','identify-reciprocal','test-reciprocal-points']){
 const variants=new Set();for(let seed=0;seed<100;seed++)for(let level=1;level<=3;level++){
  const q=P.practiceFinalFunction(id,seed,level),g=q.graph;variants.add(q.prompt);assert(C.check(q.answer,q));
  if(g.group==='profile')assert.equal(G.elementaryHeight(g.shape,g.scale,1),g.scale);
  if(g.group==='membership'){const match=g.points.flatMap(([x,y],i)=>G.belongsToReciprocal(g.k,M.parse(x),M.parse(y))?[i+1]:[]);assert.equal(match.join(';'),q.answer);}
 }assert(variants.size>=15);
}
console.log('PASS original Figure 52 and 31 cards, 65 steps, both sign and direction intervals, decimal point products and 900 repetitions.');
