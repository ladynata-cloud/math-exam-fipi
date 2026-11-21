'use strict';
const assert=require('node:assert/strict'),C=require('./check.js'),G=require('./task-graphs.js'),M=require('./models.js');
for(const [k,b,valid,count]of [
 ['1/4','3/4',true,2],['1','3',true,1],['2','6',true,1],['-2','-6',true,1],['-1','-3',true,0],
 ['-1/2','-1,5',true,0],['0','0',false,1],['0','2',false,2],['1','0',false,Infinity],
 ['999999/1000000','2999997/1000000',true,2]]){
 const u=C.absLineIntersections(k+';'+b);assert.equal(u.intercept,valid);assert.equal(u.count,count);
 for(const n of [0,1,2])assert.equal(C.check(k+';'+b,{kind:'abs-line-example',reqCount:n}),valid&&n===count);
}
for(let seed=1;seed<=60;seed++)for(let level=1;level<=3;level++){
 const q=M.practiceSystem(seed,level),[[a,b,c],[d,e,f]]=q.graph.lines;
 assert.equal(q.answer,a*e!==b*d?'Одно решение':a*f===c*d?'Бесконечно много решений':'Нет решений');
 for(const s of q.steps)assert(C.check(s.answer,s));
}
const curve={kind:'line',k:.25,b:0,domain:[0,30]};assert.equal(G.curveValue(curve,30),7.5);assert(Number.isNaN(G.curveValue(curve,31)));
assert.equal(C.factoredPair('(5n^2-4m)(-4m-5n^2)','(4m-5n^2)(4m+5n^2)',2,2),'factored');
console.log('PASS boundary slopes ±1, origin and coincident rays, interval endpoints, alternate factors and 180 systems');
