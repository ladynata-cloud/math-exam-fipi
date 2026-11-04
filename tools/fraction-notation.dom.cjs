'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'ege-baza/path');
const html=fs.readFileSync(dir+'/index.html','utf8');
function mount(){const dom=new JSDOM(html,{url:'https://mathexam.space/ege-baza/path/index.html#lesson=grade7-b-fraction-product-cancel',runScripts:'outside-only'});const w=dom.window;w.scrollTo=()=>{};for(const src of [...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1].split('?')[0])){if(src.includes('learning-bridge')||src.includes('practice-entry')||src==='managed.js')continue;w.eval(fs.readFileSync(path.resolve(dir,src),'utf8'));}return {dom,w,$:s=>w.document.querySelector(s)};}
const f=mount(),M=f.w.PathPracticeView.math;
for(const text of ['1 1/7 · 7/6','−2/3 + 5/8','Ответ: 0/5','12/17']){const el=f.w.document.createElement('p');el.innerHTML=M(text);assert.equal(el.textContent,text);assert(el.querySelector('.math-fraction .numerator'));assert(el.querySelector('.math-fraction .denominator'));}
for(const text of ['https://example.com/2/3','19/10/2026','x2/3'])assert(!M(text).includes('math-fraction'));
assert(!M('<img src=x onerror=alert(1)> 2/3').includes('<img'));
assert(f.$('.task .math-fraction'));f.$('[data-stage="2"]').click();assert(f.$('.task .math-fraction'));
assert.equal(f.$('#answer').placeholder,'Введи число или дробь');assert(f.$('#fraction-input-help .math-fraction'));
const stored=JSON.parse(f.w.localStorage.getItem('mathexam.ege-baza.path.v1'));assert(!JSON.stringify(stored).includes('math-fraction'));
f.dom.window.close();console.log('FRACTION_NOTATION_DOM_OK: mixed/signed fractions, escaping, URL/date boundaries, public steps and unchanged saved data');
// The cabinet uses the same formatting while preserving its complete state contract.
{
 const f=mount(),w=f.w;let bridge;w.MathExamLearning={register(v){bridge=v;}};
 w.history.replaceState(null,'','?learning=1');w.eval(fs.readFileSync(dir+'/managed.js','utf8'));
 const id='grade7-b-fraction-product-cancel',seed=269,task=w.PathData.task(id,seed),spec={trainerId:'ege-path',contentId:id,id,seed,contentVersion:1,task};
 bridge.applyState({taskSpec:spec,state:null,readOnly:false});assert(f.$('.task .math-fraction'));
 f.$('[data-stage="2"]').click();const initial=JSON.stringify(bridge.getState());
 assert(f.$('.callout .math-fraction'));f.$('#hint').click();
 f.$('#answer').value=w.PathData.answerText(task.steps[0]);f.$('#answer').dispatchEvent(new w.Event('input',{bubbles:true}));f.$('#answerForm').dispatchEvent(new w.Event('submit',{cancelable:true}));
 assert.equal(bridge.getState().work.step,1);assert(f.$('.steps .math-fraction'));
 const saved=w.JSON.parse(JSON.stringify(bridge.getState()));bridge.applyState({taskSpec:spec,state:saved,readOnly:true});assert.equal(JSON.stringify(bridge.getState()),JSON.stringify(saved));assert(f.$('.steps .math-fraction'));assert(!initial.includes('math-fraction'));
 saved.view.feedback='<img src=x onerror=unsafe()> 2/3';saved.view.feedbackKind='bad';bridge.applyState({taskSpec:spec,state:saved,readOnly:true});assert(!f.$('#feedback img'));assert.equal(f.$('#feedback').textContent,saved.view.feedback);assert(f.$('#feedback .math-fraction'));f.dom.window.close();
}
console.log('FRACTION_NOTATION_MANAGED_OK');
