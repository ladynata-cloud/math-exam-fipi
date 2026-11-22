'use strict';
const assert=require('node:assert/strict'),G=require('./task-graphs.js'),C=require('./check.js'),Models=require('./models.js'),cards=require('./exercises-1088-1092.json');assert.equal(cards.length,24);let checks=0;
for(const t of cards){assert(C.check(t.answer,t),t.title);for(const s of t.steps)assert(C.check(s.answer,s),t.title);}
const a=Math.sqrt(8/3),hi=32*Math.sqrt(6)/9;
for(let i=-180;i<=180;i++){const x=i/60,fx=G.behaviorHeight('cubic-range',x);assert(Math.abs(fx-(x*x*x-8*x))<1e-12);assert(fx>=-hi-1e-9&&fx<=hi+1e-9);assert(Math.abs((hi-fx)-(2*a-x)*(x+a)**2)<1e-9);assert(Math.abs((hi+fx)-(x+2*a)*(x-a)**2)<1e-9);checks+=4;}
assert(Math.abs(G.behaviorHeight('cubic-range',-a)-hi)<1e-12);assert(Math.abs(G.behaviorHeight('cubic-range',a)+hi)<1e-12);
for(let i=-90;i<=360;i++){const x=i/60,v=G.behaviorHeight('reciprocal-range',x);assert(Math.abs(v-4/(x+2))<1e-10&&v>=.5&&v<=8);checks++;}
for(let i=-100;i<=1600;i++){const t=i/10,r=G.tankTrial(t);if(t<0||t>150)assert.equal(r,null);else{const stage=t<40?'raise':t<=60?'hold':'cool';assert.equal(r.stage,stage);assert(Math.abs(r.value-(stage==='raise'?20+2*t:stage==='hold'?100:140-2*t/3))<1e-10);}checks++;}
let prev=0;for(let i=0;i<=1200;i++){const t=i/100,v=G.behaviorHeight('river',t);assert(t<=6?v>=prev-1e-10:v<=prev+1e-10);prev=v;checks++;}assert.equal(prev,4);
const build=cards.find(t=>t.id.endsWith('1092-build'));assert(!C.check('20;100;95;40',build));assert(!C.check('20;1 00;100;40',build));assert(C.check('20;100.0;200/2;40',build));
for(let s=1;s<=85;s++)for(let level=1;level<=3;level++){const t=Models.practiceBehavior(s,level);assert(C.check(t.answer,t));assert.deepEqual(t.graph.customNodes.map(p=>String(p[1])),t.graph.tableValues);checks+=2;}console.log('PASS '+checks+' levels, continuity, piece boundaries, outside cases, generated data and exact cubic extrema.');
