'use strict';
const assert=require('node:assert/strict');
const C=require('./check.js'),G=require('./task-graphs.js'),P=require('./models.js');
const cards=require('./exercises-1147-1149.json'),find=Suffix=>cards.find(t=>t.id.endsWith(Suffix));
assert.equal(cards.length,9);assert.equal(cards.reduce((n,t)=>n+t.steps.length,0),23);
for(const t of cards)assert(t.source.page===257&&C.check(t.answer,t));
assert(C.check('2;1',find('quadrants')));assert(!C.check('1;4',find('quadrants')));
assert(C.check('60+12*(t-5)',find('1148-back')));assert(!C.check('60-12*(t-5)',find('1148-back')));
const trip=find('1148-graph');
assert.deepEqual(G.tripStops(trip.graph),[[0,0],[3,60],[5,60],[10,120]]);
assert(C.check('(0;0), (3;60), (5;60), (10;120)',trip));
assert(!C.check('(0;0), (3;60), (5;60), (10;0)',trip));
const free=find('1149-build');
for(const answer of ['(-3;0),(4;6)','(-3;6),(4;0)','(-3;3),(-1/3;0),(1/3;6),(4;2)','(-3;4),(-2;6),(-1;0),(1;2),(2;2),(4;1)'])assert(C.check(answer,free));
for(const [answer,status]of [
 ['(-4;6),(4;0)','domain'],['(-3;0),(0;6),(0;5),(4;6)','order'],['(-3;1),(4;6)','range'],['(-3;2),(0;-1),(4;6)','outside']
])assert.equal(G.graphKnots(free.graph,C.pointGroups(answer)).status,status);
for(const id of ['rational-axis-location','boat-cumulative-path','graph-full-range']){
 const prompts=new Set();
 for(let i=0;i<100;i++)for(let lev=1;lev<=3;lev++){
  const t=P.practiceFinalFunction(id,i,lev),g=t.graph;prompts.add(t.prompt);assert(C.check(t.answer,t));
  if(g.group==='boat'){const d=g.distance/g.downstream,r=d+g.rest+g.distance/g.upstream;assert(C.check('(0;0), ('+d+';'+g.distance+'), ('+(d+g.rest)+';'+g.distance+'), ('+r+';'+2*g.distance+')',t));}
  if(g.group==='free')assert(C.check('('+g.left+';'+g.low+'), (0;'+g.high+'), ('+g.right+';'+g.low+')',t));
  if(g.group==='rational')assert(C.check(g.c+'/'+g.k,t));
 }
 assert(prompts.size>=30);
}
console.log('PASS positive fraction, three time formulas, cumulative return, free polygonal examples, strict abscissas and full image, 900 regenerated cases.');
