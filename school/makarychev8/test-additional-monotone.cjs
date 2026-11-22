'use strict';
const assert=require('node:assert/strict'),C=require('./check.js'),G=require('./task-graphs.js'),P=require('./models.js'),M=require('../peterson6/math.js');
const cards=require('./exercises-1150-1153.json'),get=k=>cards.find(t=>t.id.endsWith(k));
assert.equal(cards.length,8);assert.equal(cards.reduce((s,t)=>s+t.steps.length,0),18);
for(const t of cards)assert(t.source.page===258&&C.check(t.answer,t));
assert(C.check('-5,5',get('1150-a')));assert(!C.check('-5;5',get('1150-a')));
assert(C.check('нет',get('1150-b')));assert(!C.check('16',get('1150-b')));assert.equal(G.functionValueAt(get('1150-b').graph,'16'),null);
assert(C.check('2;-2',get('1150-c')));assert(!C.check('-2',get('1150-c')));
for(const t of cards.filter(t=>t.kind==='proof-chain'))assert(!C.check('1;2;3',t));
for(const x of [-8,-2,-1,0,1,3,8]){
 const v=M.parse(String(x)),w=M.parse(String(x+1));
 for(const mode of ['increasing','decreasing','unique']){
  const g={mode,a:3,b:2},a=G.monotoneExampleValue(g,v).map(z=>M.parse(z)),b=G.monotoneExampleValue(g,w).map(z=>M.parse(z));
  assert(a.every((q,i)=>mode==='decreasing'?q.n/q.d>b[i].n/b[i].d:q.n/q.d<b[i].n/b[i].d));
  if(mode==='unique')assert(Math.abs(a[0].n)<a[0].d);
 }
}
for(const id of ['zeros-and-poles','monotone-proof','monotone-equation']){
 const variants=new Set();
 for(let seed=0;seed<100;seed++)for(let level=1;level<=3;level++){
  const t=P.practiceFinalFunction(id,seed,level),g=t.graph;assert(C.check(t.answer,t));variants.add(t.prompt);
  if(id==='zeros-and-poles'){assert.equal(G.functionValueAt(g,t.answer),'0');assert.equal(G.functionValueAt(g,String(g.poles[0])),null);}
  if(id==='monotone-equation'){const x=Number(t.answer),y=g.mode==='sqrt-square'?Math.sqrt(x)+x*x:x*x*x+g.coefficient*x;assert.equal(y,g.target);}
  if(id==='monotone-proof'){assert(!C.check('1;3;4',t));assert(!C.check('4;3;2',t));assert(G.admissibleSample('-2;1','lt-pair',2));}
 }
 assert(variants.size>=15,variants.size);
}
console.log('PASS 8 source cards, strict proof chains and witnesses, excluded denominator, 900 independently checked repeats.');
