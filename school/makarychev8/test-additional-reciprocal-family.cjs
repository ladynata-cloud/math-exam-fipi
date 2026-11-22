'use strict';
const assert=require('node:assert/strict');
const C=require('./check.js'),G=require('./task-graphs.js'),P=require('./models.js');
const cards=require('./exercises-1170-1171.json');
assert.equal(cards.length,6);assert.equal(cards.reduce((n,t)=>n+t.steps.length,0),18);assert(cards.every(t=>t.source.page===260&&C.check(t.answer,t)));
assert(C.check('-2/5;-5/2;-10;5;15',cards[0]));assert.equal(G.reciprocalFamilyMarks(cards[0].graph,'0;1;4;-2;-6').status,'zero');assert.equal(G.reciprocalFamilyMarks(cards[0].graph,'2;1/2;2;-1;3').status,'height-3');
assert.equal(cards[1].answer,cards[1].choices[0]);
const a=cards[2],b=cards[4];
assert(C.check('(-1/2;2),(1/5;-5) | (3/2;-3/2),(-4;4)',a));assert(C.check('(-1/2;-4),(4;1/2) | (-1;0),(3;4)',b));
for(const [input,reason] of [['(1;2),(2;1) | (0;1),(2;3)','curve-branch'],['(-1;-2),(1;2) | (0;1),(0;1)','repeat'],['(-1;-2),(1;2) | (0;1),(2;4)','line']])assert.equal(G.reciprocalLineMarks(b.graph,C.pointGroups(input)).status,reason);
for(const t of [cards[3],cards[5]]){const [a,b]=G.parseIntegerPairs(t.answer);assert(C.check('('+b.join(';')+'),('+a.join(';')+')',t));assert(!C.check('('+b.join(';')+')',t));}
for(const id of ['build-reciprocal-family','compare-reciprocal-size','construct-reciprocal-line','intersect-reciprocal-line']){
 const variants=new Set();for(let seed=0;seed<100;seed++)for(let level=1;level<=3;level++){
  const q=P.practiceFinalFunction(id,seed,level),g=q.graph;variants.add(q.prompt);assert(C.check(q.answer,q));
  if(g.mode==='meet'){const pts=G.parseIntegerPairs(q.answer);assert.equal(pts.length,2);for(const [x,y]of pts){assert.equal(x*y,g.k);assert.equal(g.m*x+g.b,y);}}
  if(g.group==='four'&&g.mode==='draw')assert.equal(G.reciprocalFamilyMarks(g,q.answer).points.length,4);
 }assert(variants.size>=15);
}
console.log('PASS four prescribed hyperbolas, both pairs of intersections, arbitrary rational constructions and 1200 repeated trials.');
