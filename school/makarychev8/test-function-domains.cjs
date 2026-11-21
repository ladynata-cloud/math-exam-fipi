'use strict';
const assert=require('node:assert/strict'),G=require('./task-graphs.js'),C=require('./check.js'),Models=require('./models.js'),cards=require('./exercises-1069-1075.json');
const get=(n,s)=>cards.find(t=>t.id===`p42-source-${n}-${s}`);let checks=0;
for(const t of cards){assert(C.check(t.answer,t),t.title);for(const step of t.steps)assert(C.check(step.answer,step),t.title+' step');checks++;}
for(const [n,s,expected]of [[1071,'a',()=>true],[1071,'b',()=>true],[1071,'c',x=>x!==5],[1071,'d',x=>x!==-1&&x!==4],[1071,'e',()=>true],[1071,'f',x=>x>=5],[1073,'a',()=>true],[1073,'b',x=>x!==-1],[1073,'c',x=>x>=-9],[1073,'d',x=>x<=3]]){
 const t=get(n,s),ranges=C.axisRanges(t.answer);for(let i=-80;i<=80;i++){
  const x=i/4,allowed=expected(x),trial=G.domainAt(t.graph,i+'/4');assert.equal(trial.allowed,allowed,t.title+' '+x);
  assert.equal(ranges.some(r=>(x>r.min||x===r.min&&!r.leftOpen)&&(x<r.max||x===r.max&&!r.rightOpen)),allowed);checks+=2;
 }
}
for(let a=-2;a<=2;a++)for(let b=-3;b<=3;b++)for(let c=-2;c<=2;c++)for(let d=-14;d<=14;d++){
 const v=[a,b,c,d].join(';'),aTask=get(1072,'a'),bTask=get(1072,'b');assert.equal(C.check(v,aTask),c===0&&d!==0);assert.equal(C.check(v,bTask),c!==0&&7*c+d===0);checks+=2;
}
assert(C.check('3/2;0;2/3;-14/3',get(1072,'b')));assert(!C.check('1 2;0;1;-7',get(1072,'b')));
assert(C.check('4/2;-3/3;-4/2',get(1074,'b')));assert(!C.check('2;-1;0',get(1074,'b')));assert(C.check('0.5;-1.5;-3',get(1074,'a')));
for(let i=-40;i<=40;i++){const x=i/4;for(const [s,ok]of [['a',x!==-3],['b',x!==0&&x!==-2]]){const r=G.domainAt(get(1074,s).graph,i+'/4');assert.equal(r.allowed,ok);if(ok)assert(Math.abs(r.y-(s==='a'?(x-3)/2:2/x-1))<1e-10);checks++;}}
for(let seed=1;seed<=80;seed++)for(let l=1;l<=3;l++){const t=Models.practiceDomain(seed,l);assert(C.check(t.answer,t));assert(!C.check('∅',t));checks+=2;}
for(const v of ['-1','0','abc','1 5'])assert(!C.check(v,{kind:'positive-probe'}));console.log('PASS '+checks+' domain, construction and generated checks on all 23 source tasks.');
