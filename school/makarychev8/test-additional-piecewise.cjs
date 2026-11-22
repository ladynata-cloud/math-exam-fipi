'use strict';
const assert = require('node:assert/strict');
const check = require('./check.js');
const graphs = require('./task-graphs.js');
const models = require('./models.js');
const math = require('../peterson6/math.js');
const cards = require('./exercises-1164.json');
const card = (part, mode) => cards.find(t=>t.id==='p45-source-1164-'+part+'-'+mode);
assert.equal(cards.length,20);
assert.equal(cards.reduce((n,t)=>n+t.steps.length,0),42);
assert(cards.every(t=>t.source.page===259 && check.check(t.answer,t)));
const a=card('a','graph'),b=card('b','graph');
assert.equal(graphs.piecewiseLocation(a.graph,1),'left');
assert.equal(graphs.piecewiseHeight(a.graph,-2),4);
assert.equal(graphs.piecewiseHeight(a.graph,9),3);
assert.equal(graphs.piecewiseHeight(b.graph,2),1);
assert.equal(graphs.piecewiseHeight(b.graph,2.5),0);
assert.equal(graphs.piecewiseHeight(b.graph,3),-1);
assert(Number.isNaN(graphs.piecewiseHeight(b.graph,3.00000001)));
assert(check.check('(-1/2;1/4),(0;0) | (9/4;3/2),(16;4)',a));
assert(check.check('(-1/2;9/4),(1;0) | (9/4;1/2),(11/4;-1/2)',b));
for(const [input,status]of [['(0;1),(1;0) | (2;1),(3;-1)','domain'],['(0;1),(1;0) | (5/2;0),(5/2;0)','repeat'],['(0;1),(1;0) | (5/2;1),(3;-1)','height'],['(0;1),(1;0) | (4;-3),(3;-1)','domain']])assert.equal(graphs.piecewiseMarks(b.graph,check.pointGroups(input)).status,status);
for(const [part,mode,yes,no] of [['a','decrease','x≤0','x≤1'],['a','positive','(-∞;0)∪(0;+∞)','(-∞;+∞)'],['b','range','y≥-1','y≥0'],['b','negative','(5/2;3]','[5/2;3]'],['b','zeros','[1;1]∪[2,5;2,5]','[1;5/2]'],['b','decrease','(-∞;1]∪[2;3]','(-∞;1]'],['b','extrema','-1;нет','0;1']]){
  const t=card(part,mode);assert(check.check(yes,t));assert(!check.check(no,t));
}
for(const id of ['build-piecewise-branches','study-piecewise-values']){
 const variants=new Set();
 for(let seed=0;seed<100;seed++)for(let level=1;level<=3;level++){
  const t=models.practiceFinalFunction(id,seed,level),g=t.graph;assert(check.check(t.answer,t),t.prompt);variants.add(t.prompt);
  assert.equal(graphs.piecewiseHeight(g,g.vertex),0);assert.equal(graphs.piecewiseHeight(g,g.join),1);
  if(g.last!==null){assert.equal(graphs.piecewiseLocation(g,g.last),'right');assert.equal(graphs.piecewiseLocation(g,g.last+.001),'outside');}
  if(g.mode==='graph')assert.equal(graphs.piecewiseMarks(g,check.pointGroups(t.answer)).points.length,4);
  if(g.mode==='range'){
   const near=Math.min(0,g.last===null?0:graphs.piecewiseHeight(g,g.last));
   assert(check.check('y≥'+near,t));
  }
 }
 assert(variants.size>=15);
}
console.log('PASS two original piecewise definitions, 20 cards, 42 steps, arbitrary points, endpoint ownership, monotonicity, sign and 600 practice variants.');
