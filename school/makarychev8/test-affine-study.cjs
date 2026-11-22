'use strict';
const assert=require('node:assert/strict'),C=require('./check.js'),G=require('./task-graphs.js'),P=require('./models.js'),M=require('../peterson6/math.js');
const rows=require('./exercises-1114-1118.json');assert.equal(rows.length,40);
for(const q of rows){assert(C.check(q.answer,q),q.id);for(const s of q.steps)assert(C.check(s.answer,s));assert.equal(q.source.page,q.id.includes('1118')?251:250);}
let n=0;const slopes=[[3/2,-3,2],[-3/5,5,25/3],[8/5,0,0],[-2/5,0,0],[-7/10,350,500],[30,10,-1/3],[13,-78,6]];
for(const q of rows.filter(t=>['positive','negative'].includes(t.graph.feature))){
 const g=q.graph,k=M.parse(g.k),slope=k.n/k.d,base=slopes.find(([a,b])=>slope===a&&g.b===b);
 assert(base);const ranges=C.axisRanges(q.answer);
 for(const x of [base[2],base[2]-1/7,base[2]+1/7,...Array.from({length:200},(_,i)=>(i-100)/3)]){
  const y=x===base[2]?0:base[0]*x+base[1],present=ranges.some(r=>(x>r.min||x===r.min&&!r.leftOpen)&&(x<r.max||x===r.max&&!r.rightOpen));assert.equal(present,g.feature==='positive'?y>0:y<0,q.id);n++;
 }
}
for(const q of rows.filter(t=>t.kind==='own-affine-points')){
 const g=q.graph,k=M.parse(g.k);
 for(let x=-15;x<16;x++)for(let z=-9;z<10;z++){
  const coord=(arg,delta)=>'('+arg+';'+(k.n*arg+g.b*k.d+delta)+'/'+k.d+')',valid=coord(x,0)+', '+coord(z,0),wrong=coord(x,1)+', '+coord(z,0);
  assert.equal(C.check(valid,q),x!==z);assert(!C.check(wrong,q));n+=2;
 }
}
for(let seed=0;seed<100;seed++)for(const id of P.lineSkills.map(s=>s.id)){const q=P.practiceLineStudy(id,seed,1+seed%3);assert(C.check(q.answer,q));}
console.log('PASS '+n+' affine signs and independent point pairs, negative slopes, open roots, genuine arbitrary coordinates and new samples.');
