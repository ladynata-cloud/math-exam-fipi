'use strict';
const assert = require('node:assert/strict');
const C = require('./check.js'), G = require('./task-graphs.js'), P = require('./models.js');
const cards = require('./exercises-1144-1146.json');
assert.deepEqual(cards.map(c=>c.title),['№ 1144а','№ 1144б','№ 1144в','№ 1145 · формула','№ 1145 · значения','№ 1146 · формула','№ 1146 · значения']);
assert(cards.every(c=>c.source.page===257&&c.steps.length===3&&C.check(c.answer,c)));
for(const [i,good,bad] of [
 [0,'x ≠ 0 и x ≠ -6','x ≠ -6'], [1,'x ≥ 4','x > 4'], [2,'x ≠ -1 и x ≠ 0','x ≠ -1'],
 [3,'x*10','7x'], [4,'0 ≤ y ≤ 70','0 ≤ y ≤ 7'], [5,'6x/4','2x/3'], [6,'[0;6]','(0;6]']
]) {assert(C.check(good,cards[i]),good);assert(!C.check(bad,cards[i]),bad);}
for(const [i,t]of cards.slice(0,3).entries()){
 for(let n=-36;n<37;n++)for(const d of [1,2,3,4]){
  const x=n/d,g=t.graph,res=G.compoundDomainTrial(g.mode,g.parameter,n+'/'+d);
  const allowed=[x!==0&&x!==-6,x>=4,x!==0&&x!==-1][i];assert.equal(res.allowed,allowed);
 }
 const large=G.compoundDomainTrial(t.graph.mode,t.graph.parameter,'1000000000000');assert.equal(large.allowed,true);
}
assert.deepEqual(G.compoundDomainTrial('nested',1,'-1/2').rows.map(p=>p[1]),['-2','-1']);
assert.deepEqual(G.compoundDomainTrial('two-den',6,'1000000000000').rows.map(p=>p[1]),['6000000000000','1000000000006']);
for(const id of ['combined-expression-domain','moving-section']){
 const variants=new Set();
 for(let seed=0;seed<100;seed++)for(let level=1;level<=3;level++){
  const t=P.practiceFinalFunction(id,seed,level),g=t.graph;assert(C.check(t.answer,t));variants.add(t.prompt);
  if(g.group==='domain'){assert(!G.compoundDomainTrial(g.mode,g.parameter,g.mode==='two-root'?'0':String(-g.parameter)).allowed);}
  else {const max=g.group==='rectangle'?g.width*g.height:g.width;assert(C.check(g.mode==='range'?'0≤y≤'+max:max+'x/'+g.height,t));}
 }
 assert(variants.size>=20,variants.size);
}
console.log('PASS 7 tasks, 21 steps, two-level restrictions, physical extremes, 876 boundary cases and 600 fresh variants.');
