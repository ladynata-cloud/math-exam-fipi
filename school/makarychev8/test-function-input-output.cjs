'use strict';
const assert=require('node:assert/strict'),G=require('./task-graphs'),C=require('./check'),M=require('./models'),ts=require('./exercises-1063-1068.json');
for(const t of ts){assert(C.check(t.answer,t));for(const q of t.steps)assert(C.check(q.answer,q));}
const by=t=>ts.find(q=>q.title===t),reciprocal=by('№ 1068б').graph;assert.equal(G.functionValueAt(reciprocal,'5'),null);assert.equal(G.functionValueAt(reciprocal,'-1'),'0');
assert.equal(G.functionValueAt(by('№ 1063в').graph,'1/3'),'29/3');assert.equal(G.functionValueAt(by('№ 1064, f(1,5)').graph,'1 1/2'),'1/2');
for(let k=0;k<60;k++)for(let l=1;l<=3;l++){const t=M.practiceFunction(k,l),g=t.graph;assert(C.check(t.answer,t));if(l===1)assert.equal(G.functionValueAt(g,g.at),t.answer);if(l===2)assert.equal(G.functionValueAt(g,t.answer),String(g.target));if(l===3){const roots=t.answer.split(';');assert(roots.length===2&&roots[1]!==roots[0]);for(const v of roots)assert.equal(G.functionValueAt(g,v),'0');}}
console.log('PASS exact input/output, denominator exceptions and 180 generated polynomial function tasks');
