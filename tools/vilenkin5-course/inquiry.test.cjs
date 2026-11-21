/* Real DOM model interactions. No independent mastery is awarded by a laboratory. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const repo=path.resolve(__dirname,'../..');
function boot(grade,key,saved={}){
 const dom=new JSDOM('<!doctype html><html><head></head><body><div id="host"></div></body></html>',{runScripts:'outside-only'}),w=dom.window;
 for(const file of ['math.js','labs.js'])w.eval(fs.readFileSync(path.join(repo,`courses/vilenkin-${grade}-part-1/${file}`),'utf8'));
 let snapshot=null,calls=0;
 const host=w.document.getElementById('host'),destroy=w.mountLab(host,key,{state:saved,onChange:s=>{snapshot=JSON.parse(JSON.stringify(s));calls++;}});
 return {w,host,destroy,get snapshot(){return snapshot},get calls(){return calls},close(){destroy();w.close()}};
}
const form=x=>x.host.querySelector('[class$="-inquiry"]');
const field=x=>form(x).querySelector('input');
const visual=x=>x.host.querySelector('[class$="-visual"]');
function type(x,value){field(x).value=value;field(x).dispatchEvent(new x.w.Event('input',{bubbles:true}));}
function submit(x,value){if(value!==undefined)type(x,value);form(x).dispatchEvent(new x.w.Event('submit',{bubbles:true,cancelable:true}));}
function control(x,index,value){const inputs=x.host.querySelectorAll('[class$="-controls"] input,[class$="-controls"] select');inputs[index].value=String(value);inputs[index].dispatchEvent(new x.w.Event('input',{bubbles:true}));return inputs[index];}
let modelFlows=0;
for(const [grade,key,answer] of [[5,'place','307'],[5,'scale','30'],[5,'multiply','24'],[5,'remainder','3'],[5,'area','28'],[6,'percent','20'],[6,'common','12'],[6,'part','24'],[6,'ratio','2/3'],[6,'scale','4000']]){
 const x=boot(grade,key);assert(form(x),`${grade}/${key}`);assert(visual(x).hidden,'model calculation hidden before prediction');
 const before=x.calls;submit(x,'  ');assert.equal(x.snapshot.inquirySeen,0);assert(visual(x).hidden);assert.equal(x.calls,before+1,'only draft input saved, no attempt');
 submit(x,'1/0');assert.equal(x.snapshot.inquirySeen,0);assert(visual(x).hidden,'invalid rational does not reveal');
 submit(x,answer);assert(!visual(x).hidden);assert(form(x).textContent.includes('Прогноз подтвердился'));assert.equal(x.snapshot.inquiryFirst,answer);
 for(const [name,value] of Object.entries(x.snapshot)){assert(/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name));assert(typeof value==='number'||typeof value==='string'&&value.length<=100,'existing flat saved-model contract');}if(grade===6){const C=require(path.join(repo,'courses/vilenkin-6-part-1/learning-contracts.js'));const lesson=[1,2,3,4,5].flatMap(n=>JSON.parse(fs.readFileSync(path.join(repo,`courses/vilenkin-6-part-1/data/lessons-${n}.json`),'utf8'))).find(l=>l.lab===key);const attempt=C.create('lesson-'+lesson.id,31);attempt.state.lesson.lab=x.snapshot;assert.deepEqual(C.normalize(attempt.taskSpec,attempt.state).lesson.lab,x.snapshot,'managed contract preserves every prediction field');}const saved=JSON.stringify(x.snapshot),count=x.calls;submit(x,'999');assert.equal(x.calls,count);assert.equal(JSON.stringify(x.snapshot),saved,'double submission and editing disabled input do not overwrite first prediction');
 const y=boot(grade,key,JSON.parse(saved));assert(!visual(y).hidden);assert.equal(field(y).value,answer);assert(form(y).textContent.includes('Прогноз подтвердился'),'roundtrip recomputes feedback from same parameters');
 const oldField=field(y);oldField.focus();const slider=y.host.querySelector('[class$="-controls"] input[type=range]');
 if(slider){slider.focus();slider.value=slider.value===slider.max?slider.min:slider.max;slider.dispatchEvent(new y.w.Event('input',{bubbles:true}));assert.equal(y.w.document.activeElement,slider,'slider remains mounted and focused');assert.equal(field(y),oldField,'prediction field remains mounted');assert(visual(y).hidden);assert.equal(y.snapshot.inquiryFirst,'');assert.equal(y.snapshot.inquirySeen,0);}
 x.close();y.close();modelFlows++;
}
// Exact fractions and comma notation are preserved rather than rounded.
{
 const x=boot(6,'ratio');submit(x,'0,6666667');assert(form(x).textContent.includes('не совпал'));assert.equal(x.snapshot.inquiryFirst,'0,6666667');control(x,0,3);submit(x,'0,5');assert(form(x).textContent.includes('подтвердился'));x.close();
}
// Same percentage of a different whole: first prediction cannot leak into the new condition.
{
 const x=boot(6,'percent');submit(x,'20');control(x,0,120);assert(visual(x).hidden);assert.equal(x.snapshot.inquiryFirst,'');assert(form(x).textContent.includes('120'));submit(x,'30');assert(form(x).textContent.includes('подтвердился'));assert.equal(x.snapshot.total,120);assert.equal(x.snapshot.p,25);x.close();
}
// Non-prediction workshops remain available; reveal without an answer never invents a first attempt.
{
 const x=boot(6,'part');control(x,0,'pyramid');assert(form(x).hidden);assert(!visual(x).hidden);control(x,0,'main');assert(!form(x).hidden);assert(visual(x).hidden);form(x).querySelector('button[type=button]').click();assert.equal(x.snapshot.inquiryFirst,'');assert.equal(x.snapshot.inquirySeen,1);assert(form(x).textContent.includes('без прогноза'));
 const old=form(x);const calls=x.calls;x.destroy();old.dispatchEvent(new x.w.Event('submit',{cancelable:true}));assert.equal(x.calls,calls,'detached model cannot mutate after cleanup');x.w.close();
}
// All saved prediction fields fit the pre-existing flat laboratory contract.
{
 const x=boot(6,'common');type(x,'12');assert(Object.keys(x.snapshot).length<=30);for(const [k,v] of Object.entries(x.snapshot)){assert(/^[a-zA-Z][a-zA-Z0-9_]*$/.test(k));assert(typeof v==='number'||typeof v==='string'&&v.length<=100);}
 const forged={...x.snapshot,inquirySeen:1,inquiryFirst:'12',a:7};const y=boot(6,'common',forged);assert(visual(y).hidden,'parameter/context mismatch cannot restore stale disclosure');x.close();y.close();
}
console.log(`VILENKIN_INQUIRY_PASS: ${modelFlows} model flows, exact answers, first prediction, restore, keyboard, stale-context and cleanup.`);
