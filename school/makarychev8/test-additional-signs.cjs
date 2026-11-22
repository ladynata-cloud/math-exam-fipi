'use strict';
const assert=require('node:assert/strict'),C=require('./check.js'),G=require('./task-graphs.js'),P=require('./models.js');
const cards=require('./exercises-1154-1157.json'),get=k=>cards.find(t=>t.id.endsWith(k));
assert.equal(cards.length,19);assert(cards.every(t=>t.source.page===258&&C.check(t.answer,t)));
assert.deepEqual(cards.slice(0,9).map(t=>t.choices.indexOf(t.answer)),[2,0,4,4,3,1,2,0,0]);
assert.deepEqual(cards.slice(0,9).filter(t=>['Всюду положительна','Всюду отрицательна'].includes(t.answer)).map(t=>t.graph.code),[2,6,8,9]);
const pic=G.curveValue;assert.equal(pic({kind:'sqrt-affine',k:-1,b:1},1),0);assert(Number.isNaN(pic({kind:'sqrt-affine',k:-1,b:1},2)));assert.equal(pic({kind:'sqrt-affine',k:-1,b:1},-3),2);
for(const [h,b]of [[2,-2],[2,0],[-2,0]]){const g={kind:'abs-linear',k:1,b,h};assert.equal(pic(g,h),b);assert.equal(pic(g,h-1),b+1);}
const g=get('1157-graph');
for(const good of ['(-1;6),(3;2)','(1/2;12),(-12;1/2)','(-3;2),(3;2)'])assert(C.check(good,g));
for(const bad of ['(-1;-6),(3;2)','(-1;6),(-3;2)','(0;6),(3;2)'])assert(!C.check(bad,g));
for(const [suffix,a,wrong]of [['domain','x ≠ 0','все'],['range','y > 0','y ≥ 0'],['increase','x < 0','x > 0'],['decrease','x > 0','x ≥ 0'],['extrema','нет;нет','0;нет']]){assert(C.check(a,get('1157-'+suffix)));assert(!C.check(wrong,get('1157-'+suffix)));}
for(const id of ['strict-sign-study','identify-transformed-graph','absolute-reciprocal-study']){
 const variants=new Set();
 for(let i=0;i<100;i++)for(let level=1;level<=3;level++){
  const t=P.practiceFinalFunction(id,i,level),g=t.graph;assert(C.check(t.answer,t));variants.add(t.prompt);
  if(g.group==='sign')assert.equal(pic(G.signCurve(g.code,g.parameter),0),Number(t.steps[1].answer));
  if(g.group==='vertex')assert.equal(pic({kind:'abs-linear',h:g.h,k:1,b:g.m},g.h),g.m);
  if(g.group==='reciprocal')assert(C.check('(-'+g.k+';1), ('+g.k+';1)',t));
 }
 assert(variants.size>=15);
}
console.log('PASS 19 source cards, strict versus nonnegative, original figure directions, both positive reciprocal branches, 900 repeats.');
