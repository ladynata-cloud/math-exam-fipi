'use strict';
const assert=require('node:assert/strict'),C=require('./check.js'),G=require('./task-graphs.js'),Models=require('./models.js'),cards=require('./exercises-1080-1087.json');let checks=0;
assert.equal(cards.length,36);
for(const t of cards){assert(C.check(t.answer,t),t.title);for(const step of t.steps)assert(C.check(step.answer,step),t.title+' step');if(t.kind==='system-single')assert(C.axisRanges(t.answer));}
for(const n of [-5,-1,0,2,7])for(const d of [1,2,3]){const value=n+'/'+d;assert(C.systemInput('x≠'+value,'x'));assert(C.equalAxisSets(C.systemInput('x≠'+value+' и x≠'+value,'x'),C.systemInput('x!='+value,'x')));checks+=2;}
assert(C.equalAxisSets(C.systemInput('x≠4 и x≠−1','x'),'(-∞;-1)∪(-1;4)∪(4;+∞)'));for(const v of ['x≠5 0','x≠','x!==0','x≠1/0','x≠0 и y≠1'])assert.equal(C.systemInput(v,'x'),null);
const get=(n,s)=>cards.find(t=>t.id===`p42-source-${n}-${s}`);
assert(C.check('y≠0',get(1080,'d-range')));assert(!C.check('x≠0',get(1080,'d-range')));
for(const t of cards){const g=t.graph;for(let i=-30;i<=100;i++){const x=i/3,expected=(!g.segment||(g.leftOpen?x>g.segment[0]:x>=g.segment[0])&&x<=g.segment[1])&&(g.shape!=='sqrt'||x>=0)&&(g.shape!=='reciprocal'||x!==0);assert.equal(G.featureAllowed(g,x),expected,t.title);if(!expected)continue;const m=Number(g.k.includes('/')?g.k.split('/').reduce((a,b)=>a/b):g.k),c=Number(g.b.includes('/')?g.b.split('/').reduce((a,b)=>a/b):g.b),y=G.featureY(g.shape,m,c,x);assert(Number.isFinite(y));if(g.mode==='range'){const ranges=C.axisRanges(t.answer);assert(ranges.some(r=>(y>r.min||!r.leftOpen&&y===r.min)&&(y<r.max||!r.rightOpen&&y===r.max)),t.title+' '+x);}
if(g.shape==='bounded-rational')assert(y>=0&&y<1);if(g.shape==='triangle')assert(y>40&&y<=100);checks++;}}
for(let seed=1;seed<150;seed++)for(let level=1;level<=3;level++){const t=Models.practiceShapes(seed,level);assert(C.check(t.answer,t));checks++;}
console.log('PASS '+checks+' exact domain, range, learner construction and new-data checks.');
