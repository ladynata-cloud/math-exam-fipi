'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const base=root+'/geometry-merzlyak/assets/';
global.GeoTasks=require(base+'tasks.js');
const T=require(base+'extra-tasks.js');
const kinds=new Set([...fs.readFileSync(base+'tasks.js','utf8').matchAll(/case\s*'([^']+)'/g),...fs.readFileSync(base+'extra-tasks.js','utf8').matchAll(/case\s*'([^']+)'/g)].map(m=>m[1]));
let checks=0;
// Every current task family: a correct answer, including an accepted spelling,
// must never be turned into a misconception diagnosis. Unknown input is neutral.
for(const kind of kinds)for(let seed=0;seed<140;seed++){
 const t=T.task(kind,seed);
 assert.ok(T.equalTask(t,T.format(t.answer)));
 assert.equal(T.diagnose(kind,t,T.format(t.answer)),null);
 for(const [i,s] of t.steps.entries()){
  assert.ok(T.equalTask(t,T.format(s.answer),i));
  assert.equal(T.diagnose(kind,t,T.format(s.answer),i),null);
  assert.equal(T.diagnose(kind,t,'не знаю',i),null);
  checks+=3;
 }
 for(const bad of ['','   ','не знаю','<script>','sqrt(','1/0','9999999999999999',null,undefined,{},NaN]){
  assert.equal(T.diagnose(kind,t,bad),null);
  checks++;
 }
 for(const index of [-1,1.5,t.steps.length,'0'])assert.equal(T.diagnose(kind,t,'0',index),null);
 assert.equal(T.diagnose('unknown',t,'123'),null);
 checks+=7;
}

const covered=new Set();
function expect(kind,t,value,code,index=null){
 const text=T.format(value),result=T.diagnose(kind,t,text,index);
 // A proposed error can coincide with a correct answer for special parameters.
 if(T.equalTask(t,text,index)){assert.equal(result,null);return false;}
 assert.ok(result,`${kind}: ${text} at ${index}`);
 assert.equal(result.code,code);
 assert.ok(result.message.length>30);
 assert.ok(!/ты (сделал|взял|забыл)|ответ[:=]/i.test(result.message));
 covered.add(kind);checks++;
 return true;
}
let exteriorCollisions=0;
for(let seed=0;seed<140;seed++){
 let t=T.task('adjacent',seed);
 expect('adjacent',t,180-t.answer,'adjacent-vs-vertical');
 expect('adjacent',t,180-t.answer,'adjacent-vs-vertical',1);
 assert.equal(T.diagnose('adjacent',t,T.format(180-t.answer),0),null);
 t=T.task('triangle-angle',seed);
 if(!expect('triangle-angle',t,t.steps[0].answer,'interior-vs-exterior'))exteriorCollisions++;
 expect('triangle-angle',t,t.answer,'interior-step',0);
 t=T.task('area-triangle',seed);
 expect('area-triangle',t,t.steps[0].answer,'triangle-area-half');
 expect('area-triangle',t,t.answer,'triangle-area-product-step',0);
 t=T.task('area-parallelogram',seed);
 const a=2*(2+seed%7),h=3+(seed*3)%5,side=h+2;
 assert.equal(t.answer,a*h);
 expect('area-parallelogram',t,a*side,'height-vs-side');
 expect('area-parallelogram',t,side,'height-vs-side',0);
 t=T.task('area',seed);
 const squareMetres=(2+seed%7)*(3+(seed*3)%5);
 expect('area',t,squareMetres,'area-unit-square');
 expect('area',t,squareMetres*100,'area-unit-square');
 expect('area',t,100,'area-unit-square',1);
 assert.equal(T.diagnose('area',t,'100',0),null);
 t=T.task('pythagoras',seed);
 expect('pythagoras',t,t.answer*t.answer,'length-vs-square');
 expect('pythagoras',t,t.answer,'square-step',0);
 t=T.task('circle-equation',seed);
 expect('circle-equation',t,[2+seed%7,3+(seed*3)%5],'circle-centre-sign');
 expect('circle-equation',t,-t.answer[1],'circle-centre-sign',1);
 assert.equal(T.diagnose('circle-equation',t,T.format([-t.answer[0],-t.answer[1]])),null);
 t=T.task('vector-scale',seed);
 expect('vector-scale',t,-t.answer,'length-sign');
 for(const [i,s]of t.steps.entries())expect('vector-scale',t,-s.answer,'length-sign',i);
 t=T.task('trig-circle',seed);
 expect('trig-circle',t,-t.answer,'cosine-quadrant-sign');
 expect('trig-circle',t,-t.steps[0].answer,'square-sign',0);
 t=T.task('similarity-definition',4*seed+1);
 const k=t.meta.large[0]/t.meta.small[0];
 expect('similarity-definition',t,t.meta.small[1]/k,'scale-direction');
 expect('similarity-definition',t,t.meta.small[1]*k*k,'linear-vs-area-scale');
 expect('similarity-definition',t,1/k,'scale-direction',0);
 assert.equal(T.diagnose('similarity-definition',t,T.format(t.meta.small[1]/k),0),null);
 t=T.task('similarity-definition',4*seed+2);
 expect('similarity-definition',t,t.meta.angle*t.meta.k,'angle-vs-length-scale');
 t=T.task('similarity-definition',4*seed+3);
 expect('similarity-definition',t,'да','angle-vs-length-scale');
}
assert.equal(covered.size,10);
assert.ok(exteriorCollisions>0,'The right-angle collision must be exercised.');

// Only this undirected side accepts the reversed spelling. General string
// comparison and a directed vector or ordered triangle remain ordered.
const side=T.task('similarity-definition',0);
for(const answer of ['FE','EF','ef',' EF ']){
 assert.ok(T.equalTask(side,answer));
 assert.ok(T.equalTask(side,answer,2));
 assert.equal(T.diagnose('similarity-definition',side,answer),null);
 assert.equal(T.diagnose('similarity-definition',side,answer,2),null);
}
for(const answer of ['DE','DF','AB'])assert.equal(T.equalTask(side,answer),false);
assert.equal(T.equalTask(side,'EF',0),false);
assert.equal(T.equal('AB','BA'),false);
assert.equal(T.equalTask({answer:'AB',steps:[]},'BA'),false);
assert.equal(T.equalTask({answer:'ABC',steps:[]},'ACB'),false);
assert.equal(T.equalTask(side,'FE',-1),false);
assert.equal(T.equalTask(side,'FE',1.5),false);
assert.equal(T.equalTask(null,'FE'),false);
// Malformed tasks and known-value collisions produce no spurious diagnosis.
assert.equal(T.diagnose('adjacent',null,'90'),null);
assert.equal(T.diagnose('adjacent',{answer:90,steps:[{},{}]},'90'),null);
assert.equal(T.diagnose('vector-scale',{answer:0,steps:[]},'0'),null);
assert.equal(T.diagnose('area-parallelogram',{answer:10,steps:[{},{}],meta:{base:2,height:5,side:5}},'10'),null);
console.log(JSON.stringify({status:'PASS',supportedFamilies:covered.size,allTaskFamilies:kinds.size,checks,exteriorCollisions,contextualSideAliases:true}));
