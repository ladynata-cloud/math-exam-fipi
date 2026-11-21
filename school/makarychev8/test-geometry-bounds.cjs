'use strict';
const assert=require('node:assert/strict'),C=require('./check.js'),G=require('./task-graphs.js'),ts=require('./exercises-1022-1031.json');
for(const t of ts){assert(C.check(t.answer,t),t.title);for(const s of t.steps)assert(C.check(s.answer,s),t.title);}
for(const [d,yes,no]of [['triangle-sides','3;4;5','3;4;7'],['strict-max','3;1;2','3;3;2'],['weak-max','4;4;4','3;4;2'],['tied-max','4;4;2','4;2;4']]){assert(G.admissibleSample(yes,d,3));assert(!G.admissibleSample(no,d,3));}
for(const t of ts.slice(-7)){
 const q=t.steps[0],g=t.graph;
 assert(!G.withinBounds('х',q.limits));
 assert.equal(G.withinBounds(q.limits.map(x=>x[0]).join(';'),q.limits),q.limits[0][2]);
 assert(!C.check(t.answer.replace(/[[(]/,t.answer[0]==='['?'(':'['),t),t.title);
}
console.log('PASS all proofs, valid and degenerate trials, strict and closed bounds');
