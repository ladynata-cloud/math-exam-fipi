'use strict';
const assert=require('node:assert/strict'),M=require('../peterson6/math.js'),G=require('./task-graphs.js'),C=require('./check.js'),Models=require('./models.js'),cards=require('./exercises-1093-1096.json');assert.equal(cards.length,18);let checks=0;
for(const t of cards){assert(C.check(t.answer,t),t.id);for(const s of t.steps)assert(C.check(s.answer,s),t.id+' step');}
for(let n=-20;n<=170;n++)for(let d=1;d<=60;d++){const a=G.tripValue(n+'/'+d),x=n/d;if(x<0||x>2.5)assert.equal(a,null);else{const current=x<7/6?'away':x<=1.5?'stop':'return';assert.equal(a.stage,current);const q=M.parse(a.s);assert(Math.abs(q.n/q.d-G.tripCurve(x))<1e-10);}checks++;}
for(const [t,stage,s]of [['7/6','stop','35/2'],['3/2','stop','35/2'],['5/2','return','11/2'],['1.4','stop','35/2'],['2','return','23/2']]){const r=G.tripValue(t);assert.equal(r.stage,stage);assert(M.equal(r.s,s));}
const roots=cards.filter(t=>t.graph.mode==='equation');for(const t of roots){for(const f of t.kind==='set'?t.answer.split(';'):t.kind==='number'?[t.answer]:[]){const r=G.rootEstimate(f);assert(Number.isFinite(r));const evalCoeff=cs=>cs.reduceRight((a,c)=>{const q=M.parse(c);return a*r+q.n/q.d;},0);assert(Math.abs(evalCoeff(t.graph.left)-evalCoeff(t.graph.right))<1e-8);checks++;}}
for(const v of ['-√2','−sqrt(2)'])assert.equal(G.rootEstimate(v),-Math.sqrt(2));assert(Number.isNaN(G.rootEstimate('√2 0')));
for(let seed=1;seed<120;seed++)for(let l=1;l<=3;l++){const t=Models.practiceTripEquation(seed,l);assert(C.check(t.answer,t));for(const v of t.answer.split(';')){const x=Number(v),coef=t.graph.left.map(Number);assert.equal(coef[0]+coef[1]*x+x*x,0);}checks+=3;}
console.log('PASS '+checks+' trip boundaries, exact values, quadratic roots and new-data checks.');
