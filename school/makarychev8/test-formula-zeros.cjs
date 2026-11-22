'use strict';
const assert=require('node:assert/strict'),G=require('./task-graphs.js'),C=require('./check.js'),P=require('./models.js');
const cards=require('./exercises-1106-1108.json');
const items=[
 ['linear-old',[15],[],x=>12-.8*x],
 ['rational-old',[-2],[],x=>(4+2*x)/(x*x+5)],
 ['product',[-6,10/3],[],x=>(3*x-10)*(x+6)],
 ['constant',[],[-8,1],x=>6/((x-1)*(x+8))],
 ['linear',[100/3],[],x=>2.1*x-70],
 ['double',[0,2],[],x=>4*x*(x-2)],
 ['reciprocal',[6],[0],x=>(6-x)/x],
 ['root-above',[3],[-5],x=>(x-Math.sqrt(x+6))/(x+5)],
 ['root-below',[-25/4,0],[1],x=>(4*x*x+25*x)/(2*x-Math.sqrt(10-6*x))]
];
let checked=0;assert.equal(cards.length,9);
for(const [formula,zeros,holes,value] of items){
 for(let d=1;d<=13;d++)for(let n=-90;n<=130;n++){
  const x=n/d,r=G.functionZeroTrial({formula},n+'/'+d),y=value(x);
  const status=holes.includes(x)?'pole':!Number.isFinite(y)?'radical':zeros.includes(x)?'zero':'nonzero';
  assert.equal(r.status,status,formula+' '+n+'/'+d);
  if(Number.isFinite(y))assert(Math.abs(r.output-y)<1e-10*(1+Math.abs(y)));
  checked++;
 }
}
for(const q of cards){
 assert.equal(q.source.page,248);assert(C.check(q.answer,q));for(const s of q.steps)assert(C.check(s.answer,s));
 if(q.graph.measure!=='domain')continue;const ranges=C.axisRanges(C.systemInput(q.answer,'x'));
 for(let d=1;d<=11;d++)for(let n=-80;n<=60;n++){
  const x=n/d,r=G.functionZeroTrial(q.graph,n+'/'+d),inside=ranges.some(s=>(x>s.min||x===s.min&&!s.leftOpen)&&(x<s.max||x===s.max&&!s.rightOpen));
  assert.equal(inside,['zero','nonzero'].includes(r.status));checked++;
 }
}
for(let i=0;i<120;i++){const q=P.practiceFunctionZero(i,1+i%3);assert(C.check(q.answer,q));assert.equal(G.functionZeroTrial(q.graph,q.answer).status,'zero');assert.equal(G.functionZeroTrial(q.graph,q.graph.excluded).status,'pole');}
console.log('PASS '+checked+' rational substitutions, two radical domains, exclusions, all original zeros and fresh practice.');
