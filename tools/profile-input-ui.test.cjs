'use strict';
const {resolvePublicScript} = require('./public-page-script.cjs');
// Run with jsdom available (the ege-profil package declares it).
const {JSDOM}=require('jsdom'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
function open(area,hash,entries=[]){
 const file=path.join(root,'ege-profil',area,'index.html');
 const dom=new JSDOM(fs.readFileSync(file,'utf8'),{url:'https://mathexam.space/ege-profil/'+area+'/index.html#'+hash,runScripts:'outside-only',pretendToBeVisual:true});
 dom.window.scrollTo=()=>{};
 for(const [key,value] of entries)dom.window.localStorage.setItem(key,value);
 for(const script of dom.window.document.querySelectorAll('script[src]'))dom.window.eval(fs.readFileSync(resolvePublicScript(path.resolve(__dirname, '..'), path.dirname(file), script.getAttribute('src')),'utf8'));
 return dom;
}
function submit(dom,value){const w=dom.window,d=w.document;d.querySelector('#answer-form input[type=text]').value=value;d.querySelector('#answer-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));return d.querySelector('#feedback').textContent;}
function saved(dom,key){return JSON.parse(dom.window.localStorage.getItem(key));}
const circleKey='mathexam.mordkovichCircle.v1',startKey='mathexam.profileStart2027.v1';
for(const area of ['circle','start']){
 const circle=area==='circle',session=circle?'m4-1-am:independent':'vec-coordinates:independent';
 const dom=open(area,circle?'task/m4-1-am/independent':'practice/vec-coordinates/independent');
 const key=circle?circleKey:startKey;
 assert.match(submit(dom,'3π/'),/Не удалось прочитать/);assert(!saved(dom,key).sessions[session].wrong);
 if(circle){assert.match(submit(dom,'3/4π'),/^Верно/);dom.window.document.getElementById('next').click();assert(saved(dom,key).records['m4-1-am'].independent);}
 else {assert.match(submit(dom,'999999'),/Пока не сходится/);assert(saved(dom,key).sessions[session].wrong);}
 dom.window.close();
}
const invalidCompositions=[['sqrt(-4)^2',4],['(sqrt(-4))^0',1],['(1/0)^0',1]];
for(const area of ['circle','start'])for(const [expression,oldValue] of invalidCompositions){
 const circle=area==='circle',lesson=circle?'m4-1-am':'vec-coordinates';
 const session=lesson+':independent',key=circle?circleKey:startKey;
 const hash=(circle?'task/':'practice/')+lesson+'/independent';
 let dom=open(area,hash);
 try {
  // Match the actual task answer on the old parser, so this protects against
  // false success rather than merely another already-wrong numeric answer.
  const current=saved(dom,key).sessions[session];
  const answer=circle?'3π/4':String(dom.window.ProfileLessons.find(l=>l.id===lesson).tasks.find(t=>t.id===current.taskId).answer);
  const input=`(${answer})+(${expression})-${oldValue}`;
  assert.match(submit(dom,input),/Не удалось прочитать/,area+': '+expression);
  let s=saved(dom,key).sessions[session];
  assert(!s.wrong,area+' invalid notation is not a mathematical mistake');
  assert(!s.done&&!s.solved&&!(s.answers?.length),area+' invalid expression cannot complete work');
  assert(dom.window.document.getElementById('next').disabled);
  const entries=Object.keys(dom.window.localStorage).map(k=>[k,dom.window.localStorage.getItem(k)]);
  dom.window.close();dom=open(area,hash,entries);
  assert.equal(dom.window.document.querySelector('#answer-form input[type=text]').value,input,'literal draft survives reload');
  assert(dom.window.document.getElementById('next').disabled);
  assert.match(submit(dom,answer),/^Верно/,'valid correction remains accepted');
  dom.window.document.getElementById('next').click();
  const record=saved(dom,key).records[lesson];
  assert(circle?record.independent:record.independent.includes(current.taskId),'only the valid answer earns independent credit');
 } finally {dom.window.close();}
}
const dom=open('start','lesson/vec-coordinates'),d=dom.window.document;
for(const name of ['a','b']){
 const dots=d.querySelectorAll('[data-drag="'+name+'"] circle');assert.equal(dots.length,2);assert.equal(dots[0].getAttribute('r'),'10');assert.equal(dots[0].getAttribute('pointer-events'),'all');assert.equal(dots[1].getAttribute('r'),'4');
}
const input=d.querySelector('[name="prof-vector-a-0"]');input.value='1';input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));assert.equal(d.querySelector('[data-drag="a"] circle').getAttribute('cx'),'292');
dom.window.close();
console.log('PROFILE_INPUT_DOM_OK: both form handlers; 6 invalid-domain cases reject false success, retain drafts after reload and allow valid correction; numeric mistakes and vector controls preserved');
