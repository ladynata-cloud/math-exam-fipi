'use strict';
const assert=require('node:assert/strict');
const C=require('./check.js'), G=require('./task-graphs.js'),P=require('./models.js');
const cards=require('./exercises-1131-1135.json');
const card=(n,tag)=>cards.find(t=>t.id==='p45-source-'+n+'-'+tag);
assert.equal(cards.length,14);
for(const t of cards){assert.equal(t.source.page,254);assert(C.check(t.answer,t));for(const s of t.steps)assert(C.check(s.answer,s));}
for(const [tag,k] of [['positive',3],['negative',-4]]){
 const t=card(1131,'plot-'+tag);
 for(let n=1;n<=12;n++){
  assert(C.check('(-'+n+'/2;'+(-2*k)+'/'+n+'), (1/'+n+';'+k*n+')',t));
  assert(!C.check('(1;'+k+'), (2;'+k+'/2)',t));
  assert(!C.check('(0;0), (1;'+k+')',t));
 }
}
assert(C.check('0',card(1132,'pair')));
const pair=card(1132,'construction');
assert(C.check('(-2;-0,5), (4;1/4) | (-4;-1/2), (1/2;4)',pair));
assert(!C.check('(-2;-0,5), (4;1/4) | (-4;-1/4), (1/2;2)',pair));
for(const t of cards.filter(t=>t.graph.mode==='height')){
 const x=Number(t.answer==='1/2'?0.5:-0.5);assert.equal(4/x,t.graph.level);
}
for(const t of cards.filter(t=>['above','below'].includes(t.graph.mode))){
 const ranges=C.axisRanges(t.answer);
 for(let i=-120;i<=120;i++){
  const x=i/20,above=t.graph.mode==='above',wanted=x!==0&&(above?4/x>t.graph.level:4/x<t.graph.level);
  assert.equal(ranges.some(r=>(x>r.min||x===r.min&&!r.leftOpen)&&(x<r.max||x===r.max&&!r.rightOpen)),wanted);
 }
}
for(const t of cards.filter(t=>t.graph.mode==='sum')){
 const {form,k}=t.graph;
 for(let i=0;i<100;i++){
  const x=(form==='negative'?-100+i:i)/8,y=x+1/8;
  const value=a=>form==='negative'?-a+Math.sqrt(-a):form==='linear'?5*a+Math.sqrt(a):a*a+Math.sqrt(a);
  assert.equal(G.sumOfRoot(form,k,x),value(x));
  assert.equal(G.sumOfRoot(form,k,x)<G.sumOfRoot(form,k,y),form!=='negative');
 }
}
for(let i=-32;i<96;i++){
 const x=i/4,first=(x+1)/10-x/6,second=x/10+(1-x)/30;
 assert.equal(3*(i+4)-5*i<=3*i+4-i,x>=0.5);
 assert(Math.abs(30*(first-second)-(2-4*x))<1e-10);
 assert.equal((8*i-2*(i+20))<6*i-(i-20),x<15);
}
const system=card(1135,'intersection');assert(C.check('[0,5;15)',system));assert(!C.check('(1/2;15]',system));
for(const {id} of P.finalFunctionSkills){
 const variants=new Set();
 for(let seed=1;seed<=40;seed++)for(const level of [1,2,3]){
  const q=P.practiceFinalFunction(id,seed,level);assert(C.check(q.answer,q));variants.add(q.prompt);
  if(q.graph.mode==='sum'&&q.graph.form==='negative')assert.equal(G.sumOfRoot('negative',q.graph.k,-4),4*q.graph.k+2);
 }
 assert(variants.size>=8,id);
}
console.log('PASS 14 source cards, 36 steps, arbitrary fractional points on both branches, range membership, roots, 480 practice samples, and printed inequality boundaries.');
