'use strict';
// In-memory DOM verification. This is not a browser or visual layout test.
const {JSDOM}=require('jsdom');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const errors=[], dom=new JSDOM(fs.readFileSync(path.join(__dirname,'index.html'),'utf8'),{url:'https://peterson.test/',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,d=w.document;w.scrollTo=()=>{};w.console.error=(...e)=>errors.push(e.join(' '));
for(const f of ['math.js','continuation-models.js','models.js','data.js','app.js'])w.eval(fs.readFileSync(path.join(__dirname,f),'utf8'));
const state=()=>w.PetersonApp.getState(),tick=()=>new Promise(r=>setTimeout(r,10));
function nav(hash){w.history.replaceState(null,'',hash);w.PetersonApp.route();}
function click(selector){const el=d.querySelector(selector);assert(el,'Missing '+selector);el.click();}
function input(selector,value){const el=d.querySelector(selector);assert(el,'Missing '+selector);el.value=value;el.dispatchEvent(new w.Event('input',{bubbles:true}));}
function submit(selector){const el=d.querySelector(selector);assert(el,'Missing '+selector);el.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));}
async function run(){
assert(d.querySelector('h1').textContent.includes('Разобраться'));
let rendered=0;
for(const l of w.PetersonCourse.lessons)for(let i=0;i<l.tasks.length;i++){
 nav('#lesson/'+l.id+'/'+i);assert(d.querySelector('.prompt'),l.id+' '+i+' failed');assert(d.querySelector('#model').textContent.trim());
 const t=l.tasks[i];if(t.kind==='manual'){assert(d.querySelector('.manual-work'));assert(!d.querySelector('#final-answer'));}else{assert(d.querySelector('.answer-form label').textContent.trim());if(t.kind==='choice')assert.equal(d.querySelectorAll('.choices button').length,t.choices.length);else assert(d.querySelector('#final-answer'));}if(t.figure){assert(d.querySelector('#task-figure').textContent.trim()||d.querySelector('#task-figure svg'),t.id+' required figure');assert.equal(d.querySelector('#task-figure').closest('details'),null,'required figure remains visible');}
 assert(!d.querySelector('.error-page'));assert.doesNotMatch(d.querySelector('#main').textContent,/\{\{(?:frac|mix|mathfrac):/,t.id+' initial source/theory');rendered++;
}
nav('#lesson/p08/0');click('[data-action="guided"]');input('[data-step-input="0"]','1/2');submit('[data-step-form="0"]');assert.equal(state().tasks['p08-t01'].step,0,'decimal format required');
input('[data-step-input="0"]','0,5');submit('[data-step-form="0"]');assert.equal(state().tasks['p08-t01'].step,1);assert(d.querySelector('.recorded').textContent.includes('0,5'));
input('#final-answer','0,86');input('#notebook','Проверка черновика: 0,36 + 0,5');
const skill=d.querySelector('[data-action="detour"]').dataset.skill;click('[data-action="detour"]');await tick();assert(w.location.hash.includes('#practice/'+skill));assert(state().origin);assert(d.querySelector('.return-banner'));
const original=state().tasks['p08-t01'];assert.equal(original.value,'0,86');assert.equal(original.step,1);assert(original.assisted);
click('[data-action="new"]');assert(state().origin);click('[data-action="return"]');await tick();assert.equal(w.location.hash,'#lesson/p08/0');assert.equal(d.querySelector('#final-answer').value,'0,86');assert.equal(d.querySelector('#notebook').value,'Проверка черновика: 0,36 + 0,5');assert.equal(d.querySelectorAll('.step.completed').length,1);
submit('#answer-form');assert(state().tasks['p08-t01'].correct);assert(!state().tasks['p08-t01'].independent);
nav('#lesson/p01/0');const t=w.PetersonCourse.lessons[0].tasks[0],choice=t.choices.indexOf(t.answer);click('[data-choice="'+choice+'"]');submit('#answer-form');assert(state().tasks[t.id].independent);click('[data-action="hint"]');assert(state().tasks[t.id].independent,'later hints preserve earned independent result');
const before=w.location.hash;click('a.skip');assert.equal(w.location.hash,before);assert.equal(d.activeElement.id,'main');
nav('#home');input('#exercise-number','177');submit('#number-form');assert(d.querySelector('#number-result').textContent.includes('страница 47'));assert(d.querySelector('#number-result a[href="#lesson/p08/0"]'));
nav('#progress');assert(d.querySelector('.progress-table'));assert(d.querySelector('#import-file'));
let practices=0;
for(const s of w.PetersonMath.skills)for(let level=1;level<=3;level++){
 nav('#practice/'+s.id+'/'+level);assert(d.querySelector('#final-answer'));click('[data-action="guided"]');assert(d.querySelector('[data-step-input="0"]'));click('[data-action="step-hint"]');click('[data-action="reveal"]');assert(d.querySelectorAll('.help').length>=2);practices++;
}
// Inspect every actual step, hint and success explanation in an isolated session.
// This keeps the earlier independent-credit and detour checks unmodified.
const fullDom=new JSDOM(fs.readFileSync(path.join(__dirname,'index.html'),'utf8'),{url:'https://peterson-render.test/',runScripts:'outside-only',pretendToBeVisual:true}),fw=fullDom.window,fd=fw.document;
fw.scrollTo=()=>{};fw.console.error=(...e)=>errors.push(e.join(' '));
for(const file of ['math.js','continuation-models.js','models.js','data.js','app.js'])fw.eval(fs.readFileSync(path.join(__dirname,file),'utf8'));
const node=selector=>{const el=fd.querySelector(selector);assert(el,'Missing '+selector);return el;};
const enter=(selector,value)=>{const el=node(selector);el.value=value;el.dispatchEvent(new fw.Event('input',{bubbles:true}));};
const send=selector=>node(selector).dispatchEvent(new fw.Event('submit',{bubbles:true,cancelable:true}));
const clearTokens=id=>assert.doesNotMatch(node('#main').textContent,/\{\{(?:frac|mix|mathfrac):/,id+' rendered math');
function answerValue(q){if(q.answerFormat==='decimal'||q.answerFormat==='canonical-decimal')return fw.PetersonMath.decimal(q.answer);if(q.answerFormat==='mixed-number'){const r=fw.PetersonMath.parse(q.answer),n=Math.abs(Number(r.n)),den=Number(r.d),whole=Math.floor(n/den),rem=n%den;return (r.n<0?'-':'')+(rem?whole+' '+rem+'/'+den:whole);}return String(q.answer);}
let tokenChecked=0;
try{for(const lesson of fw.PetersonCourse.lessons)for(let index=0;index<lesson.tasks.length;index++){
 const task=lesson.tasks[index];fw.history.replaceState(null,'','#lesson/'+lesson.id+'/'+index);fw.PetersonApp.route();clearTokens(task.id);node('[data-action="hint"]').click();clearTokens(task.id+' hint');
 if(task.steps.length){node('[data-action="guided"]').click();for(let i=0;i<task.steps.length;i++){const step=task.steps[i];clearTokens(task.id+' step '+i);if(step.kind==='instruction'||typeof step==='string')node('[data-action="instruction"]').click();else{node('[data-action="step-hint"][data-step="'+i+'"]').click();node('[data-action="reveal"][data-step="'+i+'"]').click();clearTokens(task.id+' step help '+i);enter('[data-step-input="'+i+'"]',answerValue(step));send('[data-step-form="'+i+'"]');}assert.equal(fw.PetersonApp.getState().tasks[task.id].step,i+1,task.id+' accepted step '+i);clearTokens(task.id+' completed step '+i);}}
 if(task.kind!=='manual'){if(task.kind==='choice')node('[data-choice="'+task.choices.indexOf(task.answer)+'"]').click();else enter('#final-answer',answerValue(task));send('#answer-form');assert.equal(fw.PetersonApp.getState().tasks[task.id].correct,true,task.id+' final explanation');clearTokens(task.id+' final explanation');}tokenChecked++;
}}finally{fullDom.window.close();}
assert.equal(tokenChecked,rendered);assert.equal(errors.length,0,errors.join('\n'));
console.log(JSON.stringify({ok:true,renderedTasks:rendered,practiceScreens:practices,tokenCheckedTaskJourneys:tokenChecked,flows:'answer check, format constraint, guided steps, persistent detour + return, notebook, choice, number search, progress, skip link',visualBrowserQA:false}));
dom.window.close();
}
run().catch(e=>{console.error(e);dom.window.close();process.exitCode=1;});
