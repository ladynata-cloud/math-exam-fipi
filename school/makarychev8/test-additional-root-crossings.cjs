'use strict';
const assert = require('node:assert/strict');
const check = require('./check.js');
const graphs = require('./task-graphs.js');
const models = require('./models.js');
const math = require('../peterson6/math.js');
const cards = require('./exercises-1161-1163.json');
assert.equal(cards.length, 7);
assert.equal(cards.reduce((n,card) => n+card.steps.length, 0), 21);
assert(cards.every(t => t.source.page===259 && check.check(t.answer,t)));
const [order,...rest] = cards;
assert(check.check('-5;0;0,5;0,7;1',order));
assert(!check.check('1;0;0,5;0,7;-5',order));
assert(!check.check('-5;0;0,25;0,7;1',order));
assert.equal(graphs.curveValue({kind:'reflected-root',shift:1},36),-5);
assert(Number.isNaN(graphs.curveValue({kind:'reflected-root',shift:1},-1)));
for (const [index,left,right] of [[0,'below','above'],[1,'below','above'],[2,'below','below'],[3,'above','below']]) {
 const card=rest[index],g=card.graph;
 assert.equal(graphs.radicalLineTrial(g,math.parse('-1')).status,'outside');
 assert.equal(graphs.radicalLineTrial(g,math.parse(String(g.window[0]))).status,left);
 assert.equal(graphs.radicalLineTrial(g,math.parse(String(g.window[1]))).status,right);
}
assert.equal(graphs.radicalLineTrial(rest[0].graph,math.parse('25/16')).status,'equal');
const plot=cards.at(-2),slope=cards.at(-1);
assert(check.check('(-1/2;-2),(5;1/5)',plot));
for(const [raw,status] of [['(-3/4;-4/3),(1;1)','hole'],['(-1;1),(1;1)','height-1'],['(-1;-1),(-2;-1/2)','branch'],['(0;0),(1;1)','axis-1']]){
 assert.equal(graphs.puncturedPoints(plot.graph,check.pointGroups(raw)).status,status);
 assert(!check.check(raw,plot));
}
for(const [k,n] of [['-1',0],['0',0],['1',2],['16/9',1],['16/8',2]])assert.equal(graphs.puncturedIntersections(slope.graph,math.parse(k)).count,n);
assert.deepEqual(graphs.puncturedIntersections(slope.graph,math.parse('16/9')).points,[[.75,4/3]]);
for(const id of ['rank-reflected-roots','cross-line-root','punctured-root-slope']){
 const variants=new Set();
 for(let seed=0;seed<100;seed++)for(let level=1;level<=3;level++){
  const t=models.practiceFinalFunction(id,seed,level),g=t.graph;variants.add(t.prompt);assert(check.check(t.answer,t),t.prompt);
  if(g.group==='rank'){
   const direct=g.xs.map(s=>math.parse(s)).map(r=>g.shift-Math.sqrt(r.n/r.d)).sort((a,b)=>a-b);
   assert.deepEqual(t.answer.split(';').map(Number),direct);
  }
  if(g.group==='cross'){
   const [a,d]=g.slope,b=g.intercept,delta=d*d-4*a*b*d;
   const ts=delta<0?[]:[(d+Math.sqrt(delta))/(2*a),(d-Math.sqrt(delta))/(2*a)];
   assert.equal(ts.some(t=>t>=0),t.answer==='Есть общая точка');
  }
  if(g.group==='hole'){
   const result=graphs.puncturedIntersections(g,math.parse(t.answer));assert.equal(result.count,1);
   assert.equal(Math.sign(result.points[0][0]),-Math.sign(g.hole[0]));
  }
 }
 assert(variants.size>=15);
}
console.log('PASS seven original tasks, 21 steps, radical-line signs, punctured graph, slope and 900 new-data repeats.');
