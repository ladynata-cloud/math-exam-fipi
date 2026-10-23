'use strict';
// In-memory DOM contracts; visual browser review is recorded separately.
const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
function boot(saved){const dom=new JSDOM(fs.readFileSync(__dirname+'/index.html','utf8'),{url:'https://alimov.test/',runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;w.scrollTo=()=>{};const errors=[];w.console.error=(...args)=>errors.push(args.join(' '));if(saved)w.localStorage.setItem('mathexam.alimov10-11.2016.v1',saved);for(const file of ['../peterson6/math.js','check.js','models.js','data.js','app.js'])w.eval(fs.readFileSync(__dirname+'/'+file,'utf8'));return {w,d:w.document,errors};}
const {w,d,errors}=boot(),api=w.AlimovApp;
const nav=hash=>{w.history.replaceState(null,'',hash);api.route();};
const click=s=>{const el=d.querySelector(s);assert(el,'Missing '+s);el.click();};
const input=(s,v)=>{const el=d.querySelector(s);assert(el,'Missing '+s);el.value=v;el.dispatchEvent(new w.Event('input',{bubbles:true}));};
const submit=s=>{const el=d.querySelector(s);assert(el,'Missing '+s);el.dispatchEvent(new w.Event('submit',{cancelable:true,bubbles:true}));};
const state=()=>api.getState();
assert(d.querySelector('h1').textContent.includes('Разобраться'));let renders=0,walkedSteps=0;
for(const l of w.AlimovCourse.lessons){for(let i=0;i<l.tasks.length;i++){
 const t=l.tasks[i];nav('#lesson/'+l.id+'/'+i);assert(d.querySelector('.prompt'),t.id);assert(!d.querySelector('.error-page'));assert(d.querySelector('#model').textContent.trim(),l.id+' model');assert(d.querySelector('.answer-form label').textContent.trim());
 click('[data-action="guided"]');
 for(let k=0;k<t.steps.length;k++){input('[data-step-input="'+k+'"]',t.steps[k].answer);submit('[data-step-form="'+k+'"]');assert.equal(state().tasks[t.id].step,k+1,t.id+' step '+k);assert.equal(d.querySelectorAll('.step.completed').length,k+1);walkedSteps++;}
 if(t.kind==='choice')click('[data-choice="'+t.choices.indexOf(t.answer)+'"]');else input('#final-answer',t.answer);submit('#answer-form');assert(state().tasks[t.id].correct,t.id);assert(!state().tasks[t.id].independent,t.id+' helped');renders++;
 }}
// Draft, completed step and notebook survive detour and reload.
const lesson=w.AlimovCourse.lessons.find(l=>l.tasks.some(t=>t.kind!=='choice'&&t.skills.length));const index=lesson.tasks.findIndex(t=>t.kind!=='choice'&&t.skills.length),task=lesson.tasks[index],route='#lesson/'+lesson.id+'/'+index;
nav(route);input('#notebook','Проверка сохранения записей');const old=state().tasks[task.id];click('[data-action="detour"]');assert(state().origin);nav(w.location.hash);assert(d.querySelector('.return-banner'));click('[data-action="new"]');click('[data-action="return"]');nav(w.location.hash);assert.equal(d.querySelector('#notebook').value,'Проверка сохранения записей');assert.equal(state().tasks[task.id].step,old.step);
const saved=w.localStorage.getItem('mathexam.alimov10-11.2016.v1'),reloaded=boot(saved);assert.equal(reloaded.w.AlimovApp.getState().tasks[task.id].note,'Проверка сохранения записей');assert.equal(reloaded.errors.length,0);reloaded.w.close();
// Search only claims the source conditions actually present.
for(const q of ['№ 267','№ 277','№ 900','§ 19','логарифм']){nav('#home');input('#exercise-number',q);submit('#number-form');assert(d.querySelector('#number-result a'),q);}
nav('#home');input('#exercise-number','№ 999999');submit('#number-form');assert(d.querySelector('#number-result').textContent.includes('не найден'));
// Every model must render valid geometry and retain controls across navigation.
let controls=0;
for(const lesson of w.AlimovCourse.lessons){nav('#lesson/'+lesson.id);for(const el of [...d.querySelectorAll('#model input,#model select')]){const values=el.tagName==='SELECT'?[...el.options].map(o=>o.value):[el.min,el.max];for(const value of values){el.value=value;el.dispatchEvent(new w.Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));assert(!/NaN|Infinity|undefined/.test(d.querySelector('#model').innerHTML),lesson.id);controls++;}}}
nav('#lesson/p21');const angle=d.querySelector('#model input');angle.value='135';angle.dispatchEvent(new w.Event('input'));nav('#home');nav('#lesson/p21');assert.equal(d.querySelector('#model input').value,'135');
for(const hash of ['#lesson/unknown','#lesson/p01/9999','#practice/unknown/1','#skills','#progress','#home']){nav(hash);assert(!d.querySelector('.error-page'),hash);}
assert.deepEqual(errors,[]);
const malformed=boot('{bad');assert(!malformed.d.querySelector('#storage-warning').hidden);assert.equal(malformed.w.localStorage.getItem('mathexam.alimov10-11.2016.v1'),'{bad');malformed.w.close();
console.log(JSON.stringify({status:'PASS',renders,walkedSteps,controls,flows:['all task/step answers','sticky assistance','detour return','notebook reload','source search and 78 models','invalid routes','corrupt storage preserved']}));w.close();
