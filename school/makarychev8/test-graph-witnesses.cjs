'use strict';
const assert=require('node:assert/strict');
const graphs=require('./task-graphs.js'), check=require('./check.js'), models=require('./models.js');
const cards=require('./exercises-1103-1105.json');
assert.equal(cards.length,36);
for(const q of cards){
 assert.equal(q.source.page,247);assert(check.check(q.answer,q),q.id);
 for(const step of q.steps)assert(check.check(step.answer,step));
}
const cases=[
 ['67a',[-6,-2,4,6],[-5,1],[-6,6],[4.86,0]],
 ['67b',[-6,-4,-1,3,5],[-2.875,1.97,4],[-4,6],[.59,-2]],
 ['67c',[-6,-3,0,6],[-5.13,-1.06,2],[-5,4],[3,-1]]
];
for(const [figure,turns,zeros,range,readings] of cases){
 const g=graphs.propertyCurve({figure}),y=x=>graphs.propertyHeight(g,x);
 assert.equal(y(-3),readings[0]);assert.equal(y(1),readings[1]);
 assert.equal(Math.min(...g.nodes.map(p=>p[1])),range[0]);assert.equal(Math.max(...g.nodes.map(p=>p[1])),range[1]);
 for(const zero of zeros)assert.equal(y(zero),0);
 for(let i=1;i<turns.length;i++){
  const a=turns[i-1],b=turns[i],direction=Math.sign(y(b)-y(a));
  let last=y(a);for(let j=1;j<=100;j++){const current=y(a+(b-a)*j/100);assert.equal(Math.sign(current-last),direction);last=current;}
 }
 for(const q of cards.filter(t=>t.graph.figure===figure&&['pos','neg'].includes(t.graph.measure))){
  const ranges=check.axisRanges(q.kind==='landmark-interval'?check.landmarkInput(q.answer,g.landmarks):q.answer);
  for(let x=turns[0];x<=turns.at(-1);x+=1/16){
   const actual=ranges.some(r=>(x>r.min||x===r.min&&!r.leftOpen)&&(x<r.max||x===r.max&&!r.rightOpen));
   assert.equal(actual,q.graph.measure==='pos'?y(x)>0:y(x)<0);
  }
 }
}
const read=id=>cards.find(q=>q.id==='p43-source-'+id);
assert(check.check('[-6;a)∪(b;4)',read('1103-b-p')));
assert(!check.check('[-6;a]∪(b;4)',read('1103-b-p')));
assert(check.check('4.86',read('1103-a-value-0')));
assert(!check.check('-5',read('1103-a-value-0')));
for(const q of cards.filter(q=>q.graph.type==='source-graph-witness')){
 assert(!check.check('1;2',q));assert(!check.check(q.answer+';1',q));assert(!check.check('NaN;1;2',q));
 for(let a=-6;a<=6;a++)for(let b=-6;b<=6;b++)for(let c=-6;c<=6;c++){
  const g=q.graph,h=g.xs.map((_,i)=>[a,b,c][i%3]);
  const expected=g.mode==='peak'?b>a&&b>c:g.mode==='valley'?b<a&&b<c:h.every(v=>v!==0);
  assert.equal(check.check(h.join(';'),q),expected,q.id);
 }
}
const modes=new Set();for(let seed=0;seed<120;seed++){
 const q=models.practiceWitness(seed,1+seed%4);modes.add(q.graph.mode);assert(check.check(q.answer,q));
}
assert.deepEqual([...modes].sort(),['peak','valley','zeros']);
console.log('PASS 36 cards, 3 original graphs, signs, readings, piecewise monotonicity and 10985 freely chosen polygons.');
