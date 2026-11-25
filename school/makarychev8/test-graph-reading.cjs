'use strict';
const assert=require('node:assert/strict'),C=require('./check.js'),G=require('./task-graphs.js'),Models=require('./models.js'),cards=require('./exercises-1076-1079.json');let checks=0;
assert.equal(cards.length,21);assert.equal(cards.filter(t=>t.source.type==='authored').length,2);
for(const t of cards){assert(C.check(t.answer,t),t.title);for(const s of t.steps)assert(C.check(s.answer,s),t.title+' step');}
for(const [mode,expected] of [['abs-positive',()=>true],['abs-den',x=>Math.abs(x)!==2],['abs-rad',x=>Math.abs(x)>=1],['abs-piece',x=>x<=.5]]){
 const t=cards.find(t=>t.graph.mode===mode),ranges=C.axisRanges(t.answer);
 for(let i=-90;i<=90;i++)for(let den=1;den<=6;den++){const x=i/den,trial=G.absDomainTrial(mode,i+'/'+den);assert.equal(trial.allowed,expected(x));assert.equal(ranges.some(r=>(x>r.min||x===r.min&&!r.leftOpen)&&(x<r.max||x===r.max&&!r.rightOpen)),expected(x));checks+=2;}
}
const graph=cards.find(t=>t.graph.chart==='g').graph.nodes;for(let i=0;i<graph.length;i++){assert.equal(G.readingHeight(graph,graph[i][0]),graph[i][1]);if(!i)continue;const [a,y]=graph[i-1],[b,z]=graph[i];let prev=y;for(let k=1;k<=180;k++){const value=G.readingHeight(graph,a+(b-a)*k/180);assert(value>=Math.min(y,z)-1e-9&&value<=Math.max(y,z)+1e-9);assert((value-prev)*(z-y)>=-1e-9);prev=value;checks+=2;}}
for(const [x,y]of [[-4,-3],[-1,-2],[1,3],[5,3],[1.4,4],[4.6,4],[-5,0],[0,0],[-3,-4],[3,6]])assert.equal(G.readingHeight(graph,x),y);
assert(Number.isNaN(G.readingHeight(graph,5.1)));assert(Number.isNaN(G.readingHeight(graph,-6.2)));
const days=cards.find(t=>t.graph.chart==='weather').graph.nodes;assert.equal(days.find(p=>p[0]===2)[1],747);assert.equal(days.find(p=>p[0]===5)[1],751);assert.equal(days.find(p=>p[0]===9)[1],752);assert.equal(days.reduce((a,b)=>a[1]>b[1]?a:b)[0],4);
for(let seed=1;seed<=150;seed++)for(let level=1;level<=3;level++){const t=Models.practiceReadings(seed,level);assert(C.check(t.answer,t));assert.equal(Number(t.answer),t.graph.mode==='argmax'?t.graph.nodes.reduce((a,b)=>a[1]>b[1]?a:b)[0]:t.graph.nodes[t.graph.argument-1][1]);checks+=2;}
console.log('PASS '+checks+' independent graph, family-domain and new-data checks.');
