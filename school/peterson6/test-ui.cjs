'use strict';
// In-memory DOM verification. This is not a browser or visual layout test.
const {JSDOM}=require('jsdom');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const errors=[], dom=new JSDOM(fs.readFileSync(path.join(__dirname,'index.html'),'utf8'),{url:'https://peterson.test/',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,d=w.document;w.scrollTo=()=>{};w.console.error=(...e)=>errors.push(e.join(' '));
for(const f of ['math.js','models.js','data.js','app.js'])w.eval(fs.readFileSync(path.join(__dirname,f),'utf8'));
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
 const t=l.tasks[i];assert(d.querySelector('.answer-form label').textContent.trim());
 if(t.kind==='choice')assert.equal(d.querySelectorAll('.choices button').length,t.choices.length);else assert(d.querySelector('#final-answer'));
 assert(!d.querySelector('.error-page'));rendered++;
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
 nav('#practice/'+s.id+'/'+level);assert(d.querySelector('#final-answer'));click('[data-action="guided"]');assert(d.querySelector('[data-step-input="0"], [data-action="step-choice"][data-step="0"]'));click('[data-action="step-hint"]');click('[data-action="reveal"]');assert(d.querySelectorAll('.help').length>=2);practices++;
}
let equationTasks=0,equationSteps=0;
for(const l of w.PetersonCourse.lessons)for(const [i,t]of l.tasks.entries())if(t.methodVersion===2){
 nav('#lesson/'+l.id+'/'+i);click('[data-action="guided"]');
 for(const [j,q]of t.steps.entries()){
  if(q.kind==='choice')click('[data-action="step-choice"][data-step="'+j+'"][data-choice="'+q.choices.indexOf(q.answer)+'"]');
  else input('[data-step-input="'+j+'"]',q.answerFormat==='decimal'?w.PetersonMath.decimal(q.answer):q.answer);
  submit('[data-step-form="'+j+'"]');assert.equal(state().tasks[t.id].step,j+1,t.id+' step '+j);
  assert.equal(d.querySelectorAll('.step.completed').length,j+1,'all completed steps remain visible');equationSteps++;
 }
 if(t.kind==='choice')click('[data-choice="'+t.choices.indexOf(t.answer)+'"]');
 else input('#final-answer',t.answerFormat==='decimal'?w.PetersonMath.decimal(t.answer):t.answer);
 submit('#answer-form');assert(state().tasks[t.id].correct,t.id+' final');assert(!state().tasks[t.id].independent,t.id+' guided is assisted');equationTasks++;
}
assert.equal(equationTasks,98);assert.equal(equationSteps,491);
assert.equal(errors.length,0,errors.join('\n'));
console.log(JSON.stringify({ok:true,renderedTasks:rendered,practiceScreens:practices,equationTasks,equationSteps,flows:'answer check, format constraint, guided number/choice steps, persistent detour + return, notebook, choice, number search, progress, skip link',visualBrowserQA:false}));
dom.window.close();
}
run().catch(e=>{console.error(e);dom.window.close();process.exitCode=1;});
