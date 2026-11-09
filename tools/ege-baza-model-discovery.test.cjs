/* Actual model scripts in JSDOM; browser layout is checked separately. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');let checks=0;
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
function fixture(id,seed=1,saved){
 const dom=new JSDOM('<main><div id="model"></div></main>',{url:'https://model.test/',runScripts:'outside-only'}),w=dom.window;
 w.structuredClone=x=>w.JSON.parse(JSON.stringify(x));w.matchMedia=()=>({matches:true});
 for(const file of ['data.js','practice.js','equation-practice.js','models.js','practice-view.js','managed-state.js'])w.eval(fs.readFileSync(path.join(root,'ege-baza/path',file),'utf8'));
 const t=w.PathData.task(id,seed),el=w.document.querySelector('#model');let last;
 const session=w.PathModels.mount(el,t,{state:saved?w.JSON.parse(JSON.stringify(saved)):undefined,onChange:s=>{last=s;}});
 const $=selector=>el.querySelector(selector),input=(selector,text,event='input')=>{$(selector).value=text;$(selector).dispatchEvent(new w.Event(event,{bubbles:true}));};
 const state=()=>JSON.parse(JSON.stringify(session.getState()));
 const validate=s=>w.PathManagedState.model(w.JSON.parse(JSON.stringify(s)),t);
 const view=()=>({text:el.textContent,inputs:[...el.querySelectorAll('input,select')].map(x=>[x.id,x.value]),svg:[...el.querySelectorAll('svg')].map(x=>x.innerHTML)});
 const restore=()=>{const before=state(),visible=view();validate(before);const copy=fixture(id,seed,before);eq(copy.state(),before,'semantic model state restores');eq(copy.view(),visible,'model feedback, current input and diagram restore');copy.dom.window.close();};
 return {dom,w,t,el,$,input,session,state,validate,restore,view,last:()=>last};
}
for(const id of ['practice-percent-part','practice-percent-whole','practice-percent-change']){
 for(const seed of [0,1,7,25,83]){
  const f=fixture(id,seed);f.$('[data-base="whole"]').click();f.input('#modelPrediction','50');f.$('#checkPrediction').click();
  eq(f.$('#predictionRead').textContent.startsWith('Верно.'),f.t.model.whole/2===50,'50% not automatically 50 units');
  f.input('#modelPrediction',String(f.t.model.whole/2));eq(f.$('#predictionRead').textContent,'','editing clears previous judgement');f.$('#checkPrediction').click();
  eq(f.$('#predictionRead').textContent.startsWith('Верно.'),true);eq(f.state().percent,50);f.restore();
  for(const n of [0,100]){f.input('#percentSlide',n);eq(f.$('#percentRead').textContent,`${n}% от ${f.t.model.whole} = ${f.w.PathData.F(f.t.model.whole*n/100)}. Целое остаётся тем же.`);eq(f.$('#predictionRead').textContent,'','exploration clears previous judgement');f.validate(f.state());}
  f.$('[data-base="whole"]').click();eq(f.state().percent,100,'reselecting correct whole preserves exploration');f.restore();f.dom.window.close();
 }
}
{
 const f=fixture('scale');
 for(const [answer,pattern] of [['1/2',/доля высоты/],['1/4',/доля площади/],['1/8',/^Верно/],['0,125',/^Верно/],['',/Введи число/],['1/0',/Введи число/]]){f.input('#modelPrediction',answer);f.$('#checkPrediction').click();assert.match(f.$('#predictionRead').textContent,pattern);checks++;f.restore();}
 for(const [selector,k] of [['#thirdHeight',1/3],['#halfHeight',.5]]){f.$(selector).click();eq(f.state().cut,k,'exact preset ratio');assert(f.$('#modelread').textContent.includes('Объём: k³='+(k===1/3?'1/27':'1/8')));checks++;eq(f.$('#predictionRead').textContent,'');f.restore();}
 for(const k of [.1,.9]){f.input('#cut',k);eq(f.state().cut,k);f.validate(f.state());assert(!/NaN|Infinity/.test(f.el.textContent));checks++;}
 const good=f.state();for(const change of [s=>s.discovery.extra=1,s=>s.discovery.answer='x'.repeat(81),s=>s.discovery.checkedAnswer=4,s=>s.discovery.checkedAnswer='different',s=>s.cut=0,s=>s.cut=1]){const bad=JSON.parse(JSON.stringify(good));change(bad);assert.throws(()=>f.validate(bad));checks++;}
 delete good.discovery;f.validate(good);checks++;const box=fixture('box');assert.throws(()=>box.validate({...box.state(),discovery:{answer:'',checkedAnswer:null}}));checks++;box.dom.window.close();f.dom.window.close();
}
for(const [id,selector,check,read,source] of [['practice-fraction-percent','data-share','#checkShares','#modelFeedback','selected'],['practice-ratio-parts','data-ratio','#checkRatio','#ratioRead','chosen']]){
 const f=fixture(id),n=source==='selected'?f.t.model.fractions[0][0]:f.t.model.a;
 for(let i=0;i<n;i++)f.$(`[${selector}="${i}"]`).click();f.$(check).click();assert(f.$(read).textContent.length);checks++;
 f.$(`[${selector}="0"]`).click();eq(f.$(read).textContent,'','changed construction has no stale success');eq(f.state().checked,false);f.restore();f.dom.window.close();
}
{
 const f=fixture('practice-digits-multiple');f.$('#checkDigits').click();assert(f.$('#digitRead').textContent.length);checks++;f.input('[data-place="0"]','1','change');eq(f.$('#digitRead').textContent,'','changed digits have no stale judgement');eq('checkedDigits'in f.state(),false);f.restore();f.dom.window.close();
}
console.log(`EGE_BAZA_MODEL_DISCOVERY_OK: ${checks} checks; percentages 0/50/100, k²/k³ and exact thirds, equivalent fractions, restored predictions, strict optional state, stale feedback repair.`);
