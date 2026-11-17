'use strict';
const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
const KEY='mathexam.makarychev7.2024.v1';
function boot(saved,hash='#home'){
 const dom=new JSDOM(fs.readFileSync(__dirname+'/index.html','utf8'),{url:'https://makarychev.test/'+hash,runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,d=w.document,errors=[];w.scrollTo=()=>{};w.console.error=(...x)=>errors.push(x.join(' '));if(saved)w.localStorage.setItem(KEY,JSON.stringify(saved));for(const file of ['../peterson6/math.js','check.js','models.js','data.js','app.js'])w.eval(fs.readFileSync(__dirname+'/'+file,'utf8'));
 return {w,d,api:w.MakarychevApp,errors,close:()=>w.close(),nav(hash){w.history.replaceState(null,'',hash);w.MakarychevApp.route();},input(selector,value){const el=d.querySelector(selector);assert(el,selector);el.value=value;el.dispatchEvent(new w.Event('input',{bubbles:true}));return el;},click(selector){const el=d.querySelector(selector);assert(el,selector);el.click();return el;},submit(selector){d.querySelector(selector).dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));},state(){return JSON.parse(JSON.stringify(w.MakarychevApp.getState()));}};
}
function answer(rt,value){rt.input('#final-answer',value);rt.submit('#answer-form');}
let rt=boot(),lessons=rt.w.MakarychevCourse.lessons;
// Equivalent values in the wrong requested form can be revised before the first mathematical attempt.
const fractionRun=boot(null,'#lesson/p01/0');
// The preview and the completed step use the same leading-sign handling as the checker.
for(const [entry,whole,num,den] of [['− 1 1/2','-1','1','2'],['– 2 1/3','-2','1','3']]){
 fractionRun.input('#final-answer',entry);
 const shown=fractionRun.d.querySelector('#answer-preview .mixed');
 assert.equal(shown.firstChild.textContent,whole);
 assert.deepEqual(Array.from(shown.querySelectorAll('.fra > span'),node=>node.textContent),[num,den]);
}
const display=fractionRun.api.displayValue;
assert.equal(display('− 1 1/2','decimal'),'-1,5');
assert.equal(display('− 3 / 8'),'{{frac:-3:8}}');
assert.equal(display('(a − b) / (a + b)'),'{{frac:a-b:a+b}}');
for(const draft of ['4,2','42/10','4 1/5']){
 answer(fractionRun,draft);
 const item=fractionRun.state().tasks['p01-t01'];
 assert.match(item.feedback,/Значение верное/);
 assert.equal(item.attempts,0);
 assert.equal(item.learning.firstAnswer,null);
}
answer(fractionRun,'21/5');
assert(fractionRun.state().tasks['p01-t01'].independent);
fractionRun.nav('#lesson/p01/1');
fractionRun.input('#notebook','Сравню расстояния до нуля.');
fractionRun.nav('#lesson/p01/0');
fractionRun.click('[data-action="fresh-topic"]');
assert.equal(fractionRun.w.location.hash,'#lesson/p01/2','A card with notebook work is already familiar');
// A detour from a review must restore that review, even after a reload on the practice route.
const repeatRoute='#review/p01/0/2';
fractionRun.nav(repeatRoute);
fractionRun.input('#notebook','Черновик повтора');
fractionRun.click('[data-action="detour"]');
const detourRun=boot(fractionRun.state(),fractionRun.w.location.hash);
detourRun.click('[data-action="return"]');
assert.equal(detourRun.w.location.hash,repeatRoute);
detourRun.nav(repeatRoute);
assert.equal(detourRun.d.querySelector('#notebook').value,'Черновик повтора');
assert(detourRun.state().tasks['p01-t01'].independent);
detourRun.close();
const stepRun=boot(null,'#lesson/p01/1');
stepRun.click('[data-action="guided"]');
stepRun.input('[data-step-input="0"]','3,42');
stepRun.submit('[data-step-form="0"]');
// The second step asks for −3.24. The pupil writes the same value as a mixed number.
stepRun.input('[data-step-input="1"]','− 3 6/25');
stepRun.submit('[data-step-form="1"]');
const shownStep=stepRun.d.querySelector('.step:nth-of-type(2) .recorded .mixed');
assert(shownStep);
assert.equal(shownStep.firstChild.textContent,'-3');
assert.deepEqual(Array.from(shownStep.querySelectorAll('.fra > span'),node=>node.textContent),['6','25']);
stepRun.close();
fractionRun.close();
// Existing task and step mathematics are checked separately. These are state/UI contracts.
const lesson=lessons.find(l=>l.tasks.some(t=>t.kind==='number'&&!t.answerFormat&&Number(t.answer)!==0)),index=lesson.tasks.findIndex(t=>t.kind==='number'&&!t.answerFormat&&Number(t.answer)!==0),task=lesson.tasks[index],route='#lesson/'+lesson.id+'/'+index;
rt.nav(route);assert.equal(rt.d.querySelector('.prompt').nextElementSibling.id,'answer-form','Initial answer directly follows the full condition');assert(rt.d.documentElement.classList.contains('m7-task-page'));answer(rt,'');assert.equal(rt.state().tasks[task.id].attempts,0);answer(rt,'a malformed number');assert.equal(rt.state().tasks[task.id].attempts,0);assert.equal(rt.state().tasks[task.id].learning.firstAnswer,null);
answer(rt,'99999991');answer(rt,task.answer);let record=rt.state().tasks[task.id];assert.equal(record.attempts,2);assert.equal(record.independent,false);assert.equal(record.assisted,false);assert.equal(record.learning.firstAnswer.value,'99999991');assert.equal(record.learning.events.filter(e=>e.kind==='answer').length,2);assert(rt.d.querySelector('.learning-next').textContent.includes('Исправлено самостоятельно'));assert(rt.d.querySelector('[data-action="fresh-topic"]'));
let saved=rt.state();rt.close();rt=boot(saved,route);assert.equal(rt.state().tasks[task.id].learning.firstAnswer.value,'99999991');assert.equal(rt.state().tasks[task.id].completion.at,saved.tasks[task.id].completion.at);rt.close();
// Legacy unknown remains unknown across repeated sanitation; explicit evidence is retained.
rt=boot();let raw={version:1,tasks:{[task.id]:{correct:true,independent:true,attempts:1,value:task.answer}},practice:{}};let safe=rt.api.validateState(raw);assert.equal(safe.tasks[task.id].independent,false);assert.equal(safe.tasks[task.id].provenanceKnown,false);safe=rt.api.validateState(safe);assert.equal(safe.tasks[task.id].provenanceKnown,false);
raw.tasks[task.id].assisted=false;safe=rt.api.validateState(raw);assert.equal(safe.tasks[task.id].independent,true);raw.tasks[task.id].learning={model:{started:true,prediction:'my prediction'}};safe=rt.api.validateState(raw);assert.equal(safe.tasks[task.id].independent,false,'Recorded model use disqualifies unsnapshotted independence');raw.tasks[task.id].completion={attempts:1,assisted:false,independent:true};safe=rt.api.validateState(raw);assert.equal(safe.tasks[task.id].independent,true,'Model opened after a valid completion does not rewrite first success');
// Every topic gets its family-specific investigation; drafting a prediction is not help.
let cycles=0;
for(const l of lessons){rt.nav('#lesson/'+l.id+'/0');assert(rt.d.querySelector('.m7-investigation textarea'),l.id);}
for(const family of rt.w.MakarychevModels.modelIds){const l=lessons.find(l=>l.model===family);rt.nav('#lesson/'+l.id+'/0');const t=l.tasks[0];rt.input('.m7-investigation textarea','Думаю, что условие изменит только выбранную величину');assert.equal(rt.state().tasks[t.id].assisted,false);rt.click('.m7-investigation button');assert.equal(rt.state().tasks[t.id].assisted,true);const control=rt.d.querySelector('#model input[type="number"]');assert(control);control.value=control.value===control.max?control.min:control.max;control.dispatchEvent(new rt.w.Event('input',{bubbles:true}));const choose=rt.d.querySelector('[aria-label="Как объяснить наблюдение"]');choose.value=String(rt.w.MakarychevModels.investigations[family].answer);choose.dispatchEvent(new rt.w.Event('change',{bubbles:true}));const check=Array.from(rt.d.querySelectorAll('.m7-investigation button')).find(x=>x.textContent==='Проверить объяснение');assert(!check.disabled);check.click();assert(rt.d.querySelector('#model').textContent.includes('Объяснение верно'));assert.equal(rt.state().tasks[t.id].correct,false);const before=rt.state().tasks[t.id].learning.model;rt.nav('#lesson/'+l.id+'/0');assert.deepEqual(Array.from(rt.d.querySelectorAll('#model input[type="range"],#model .m7-controls select'),x=>x.value),before.controls);assert.equal(rt.d.querySelector('#model input[type="number"]').value,rt.d.querySelector('#model input[type="range"]').value);const changed=rt.d.querySelector('#model input[type="range"]');changed.value=changed.value===changed.max?changed.min:changed.max;changed.dispatchEvent(new rt.w.Event('input',{bubbles:true}));assert.equal(rt.state().tasks[t.id].learning.model.checked,false);cycles++;}
const replay=boot(null,'#lesson/p16/0');
replay.input('.m7-investigation textarea','Изменится высота точки на оси y');
replay.click('.m7-investigation button');
const offset=replay.d.querySelectorAll('#model input[type="number"]')[2];
offset.value='2';offset.dispatchEvent(new replay.w.Event('input',{bubbles:true}));
const explanation=replay.d.querySelector('[aria-label="Как объяснить наблюдение"]');
explanation.value='0';explanation.dispatchEvent(new replay.w.Event('change',{bubbles:true}));
replay.click('.m7-investigation:last-child button');
const functionInquiry=replay.w.MakarychevModels.investigations.function;
const observed=replay.d.querySelector('.m7-investigation:last-child [role="status"]').textContent;
assert(observed.includes(functionInquiry.retry));
assert(!observed.includes(functionInquiry.why));
replay.close();
// Equation operation stage survives route reload. Button preset in systems is stored.
const eq=lessons.find(l=>l.model==='equation');rt.nav('#lesson/'+eq.id+'/0');const model=rt.d.querySelector('[data-equation-stage]');const number=rt.d.querySelector('#model input[type="number"]');number.value='2';number.dispatchEvent(new rt.w.Event('input',{bubbles:true}));const buttons=Array.from(model.querySelectorAll('button'));buttons[0].click();buttons[1].click();assert.equal(rt.state().tasks[eq.tasks[0].id].learning.model.stage,2);rt.nav('#lesson/'+eq.id+'/0');assert.equal(rt.d.querySelector('[data-equation-stage]').dataset.equationStage,'2');
const system=lessons.find(l=>l.model==='system');rt.nav('#lesson/'+system.id+'/0');const preset=Array.from(rt.d.querySelectorAll('#model button')).find(b=>b.textContent.includes('Совпадающие'));assert(preset);preset.click();const controls=rt.state().tasks[system.tasks[0].id].learning.model.controls;rt.nav('#lesson/'+system.id+'/0');assert.deepEqual(rt.state().tasks[system.tasks[0].id].learning.model.controls,controls);
// Repeat answers go into a separate record, retain original evidence, and never count as new mastery.
const original=rt.state().tasks[task.id];rt.nav('#review/'+lesson.id+'/'+index+'/1');answer(rt,task.answer);const review=rt.state().tasks['review:'+task.id+':1'];assert(review.correct);assert.equal(review.independent,false);assert.equal(review.repeated,true);assert.deepEqual(rt.state().tasks[task.id],original);saved=rt.state();let reloaded=boot(saved,'#review/'+lesson.id+'/'+index+'/1');assert(reloaded.state().tasks['review:'+task.id+':1'].correct);assert.equal(reloaded.state().tasks['review:'+task.id+':1'].independent,false);assert.deepEqual(reloaded.state().tasks[task.id],original);reloaded.close();
// Due uses latest topic completion, not any old event. No dates are invented for legacy rows.
const old=Date.now()-6*86400000,now=Date.now();raw={version:1,tasks:{},practice:{}};for(const t of lesson.tasks.slice(0,2))raw.tasks[t.id]={value:t.answer,correct:true,attempts:1,assisted:false,independent:true,completion:{attempts:1,assisted:false,independent:true,at:old}};raw.tasks[lesson.tasks[1].id].completion.at=now;reloaded=boot(raw,'#progress');assert(!reloaded.d.querySelector('main').textContent.includes('Повторить после паузы'));reloaded.close();
// Same-origin embedded demonstration must never read or overwrite personal data.
const personal=JSON.stringify(rt.state());rt.w.localStorage.setItem(KEY,personal);const iframe=rt.d.createElement('iframe');rt.d.body.append(iframe);const fw=iframe.contentWindow,fd=fw.document;fd.open();fd.write(fs.readFileSync(__dirname+'/index.html','utf8'));fd.close();fw.scrollTo=()=>{};fw.location.hash=route;for(const file of ['../peterson6/math.js','check.js','models.js','data.js','app.js'])fw.eval(fs.readFileSync(__dirname+'/'+file,'utf8'));assert.equal(fw.MakarychevApp.demoMode,true);assert(!fw.MakarychevApp.getState().tasks[task.id].correct);fd.querySelector('[data-action="hint"]').click();const fi=fd.querySelector('#final-answer');fi.value=task.answer;fi.dispatchEvent(new fw.Event('input',{bubbles:true}));fd.querySelector('#answer-form').dispatchEvent(new fw.Event('submit',{bubbles:true,cancelable:true}));assert(fw.MakarychevApp.getState().tasks[task.id].correct);assert.equal(fw.MakarychevApp.getState().tasks[task.id].independent,false);assert.equal(rt.w.localStorage.getItem(KEY),personal);assert(fd.querySelector('.demo-notice').textContent.includes('личный прогресс не меняется'));fw.location.hash='#progress';fw.MakarychevApp.route();assert(fd.querySelector('[data-action=export]').hidden);assert(fd.querySelector('label[for=import-file]').hidden);iframe.remove();
assert.deepEqual(rt.errors,[]);console.log(JSON.stringify({status:'PASS',topics:lessons.length,investigationFamilies:cycles,contracts:['format is not an attempt','immutable first answer','correction vs help','legacy unknown','prediction then model then explanation','numeric-slider sync','model reload and stale explanation','equation stage and system preset','separate repeat records','latest five-day topic date']}));rt.close();
