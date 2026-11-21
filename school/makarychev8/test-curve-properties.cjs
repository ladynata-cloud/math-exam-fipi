'use strict';
const assert=require('node:assert/strict');
const G=require('./task-graphs.js'),C=require('./check.js'),models=require('./models.js'),cards=require('./exercises-1100-1102.json');
assert.equal(cards.length,24);let count=0;
for(const q of cards){assert(C.check(q.answer,q),q.id);for(const s of q.steps)assert(C.check(s.answer,s));}
const expect={
 64:{zeros:[-5,-3,1,4],turns:[-7,-4,-1,2,5],lo:-4,hi:6},
 65:{zeros:[-3],turns:[-5,0,2,5],lo:-4,hi:6},
 66:{zeros:[-8,-3,4,8],turns:[-10,-5,0,6,10],lo:-8,hi:6}
};
for(const [figure,answer]of Object.entries(expect)){
 const g=G.propertyCurve({figure}),height=x=>G.readingHeight(g.nodes,x);
 const {zeros,turns,lo,hi}=answer;assert.equal(Math.min(...g.nodes.map(p=>p[1])),lo);assert.equal(Math.max(...g.nodes.map(p=>p[1])),hi);
 for(const z of zeros)assert.equal(height(z),0);
 for(let i=1;i<turns.length;i++){
  const a=turns[i-1],b=turns[i],d=Math.sign(height(b)-height(a));let prev=height(a);
  for(let j=1;j<=100;j++){const x=a+(b-a)*j/100,y=height(x);assert(d>0?y>prev:y<prev);assert(y>=lo&&y<=hi);prev=y;count++;}
 }
 for(const q of cards.filter(t=>String(t.graph.figure)===figure&&['neg','pos'].includes(t.graph.measure)&&!t.id.endsWith('-peer'))){
  const ranges=C.axisRanges(C.systemInput(q.answer,'x'));
  for(let j=g.xRange[0]*32;j<=g.xRange[1]*32;j++){const x=j/32,y=height(x),inSet=ranges.some(r=>(x>r.min||x===r.min&&!r.leftOpen)&&(x<r.max||x===r.max&&!r.rightOpen));assert.equal(inSet,q.graph.measure==='neg'?y<0:y>0);count++;}
 }
 assert(Number.isNaN(height(g.xRange[0]-1))&&Number.isNaN(height(g.xRange[1]+1)));
}
for(let seed=0;seed<120;seed++){const task=models.practiceCurveProperties(seed,1+seed%3),shape=G.propertyCurve(task.graph),ranges=C.axisRanges(C.systemInput(task.answer,'x'));
 for(let x=shape.xRange[0];x<=shape.xRange[1];x+=.25){const y=G.readingHeight(shape.nodes,x),contains=ranges.some(r=>(x>r.min||x===r.min&&!r.leftOpen)&&(x<r.max||x===r.max&&!r.rightOpen));assert.equal(contains,task.graph.measure==='pos'?y>0:y<0);count++;}
 assert(C.check(task.answer,task));
}
console.log('PASS '+count+' signs, strict boundaries, turning points, maxima and regenerated samples.');
