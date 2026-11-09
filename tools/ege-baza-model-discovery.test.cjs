/* Actual model scripts in JSDOM; browser layout is checked separately. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');let checks=0;
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
function fixture(id,seed=1,saved,learningDiscovery=true){
 const dom=new JSDOM('<main><div id="model"></div></main>',{url:'https://model.test/',runScripts:'outside-only'}),w=dom.window;
 w.structuredClone=x=>w.JSON.parse(JSON.stringify(x));w.matchMedia=()=>({matches:true});
 for(const file of ['data.js','practice.js','equation-practice.js','models.js','practice-view.js','managed-state.js'])w.eval(fs.readFileSync(path.join(root,'ege-baza/path',file),'utf8'));
 const t=w.PathData.task(id,seed),el=w.document.querySelector('#model');let last;
 const session=w.PathModels.mount(el,t,{learningDiscovery,state:saved?w.JSON.parse(JSON.stringify(saved)):undefined,onChange:s=>{last=s;}});
 const $=selector=>el.querySelector(selector),input=(selector,text,event='input')=>{$(selector).value=text;$(selector).dispatchEvent(new w.Event(event,{bubbles:true}));};
 const state=()=>JSON.parse(JSON.stringify(session.getState()));
 const validate=s=>w.PathManagedState.model(w.JSON.parse(JSON.stringify(s)),t);
 const view=()=>({text:el.textContent,inputs:[...el.querySelectorAll('input,select')].map(x=>[x.id,x.value]),svg:[...el.querySelectorAll('svg')].map(x=>x.innerHTML)});
 const restore=()=>{const before=state(),visible=view();validate(before);const copy=fixture(id,seed,before,learningDiscovery);eq(copy.state(),before,'semantic model state restores');eq(copy.view(),visible,'model feedback, current input and diagram restore');copy.dom.window.close();};
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
// Deployed cabinet backends and older board participants accept only the original
// model fields. Exercise actual controllers, not an opt-in fixture alone.
function legacyModel(value){
 if(!value)return;
 const fields=value.kind==='solid'?['kind','angle','tilt','cut']:['kind','base','experiment','percent'];
 eq(Object.keys(value).sort(),fields.sort(),'managed/board payload retains the pre-discovery field set');
}
function controller(mode,id,saved){
 const file=mode==='board'?'trainers/ege-baza-13.html':'ege-baza/path/index.html';
 const dom=new JSDOM(fs.readFileSync(path.join(root,file),'utf8'),{url:'https://controller.test/'+file+(mode==='managed'?'?learning=1':'')+'#lesson='+id,runScripts:'outside-only'}),w=dom.window,d=w.document,events=[];
 w.structuredClone=x=>w.JSON.parse(JSON.stringify(x));w.TextEncoder=TextEncoder;w.matchMedia=()=>({matches:true});w.HTMLElement.prototype.scrollIntoView=()=>{};
 for(const key of ['localStorage','sessionStorage'])Object.defineProperty(w,key,{get(){throw Error('Shared controllers must not access personal storage');}});
 let adapter;
 w.MathExamLearning={register(api){adapter=api;api.subscribe(event=>events.push(JSON.parse(JSON.stringify(event))));}};
 w.MathExamBoard={register(){}};
 for(const script of d.querySelectorAll('script[src]')){
  const name=new URL(script.src).pathname;
  if(['/trainers/learning-bridge.js','/trainers/board-bridge.js'].includes(name)||name.startsWith('/assets/assistant/'))continue;
  w.eval(fs.readFileSync(path.join(root,name),'utf8'));
 }
 if(mode==='managed'){
  const spec=w.JSON.parse(JSON.stringify({trainerId:'ege-path',contentVersion:1,id,contentId:id,seed:17,task:w.PathData.task(id,17)}));
  adapter.applyState({taskSpec:spec,state:saved?w.JSON.parse(JSON.stringify(saved)):null,readOnly:false});
  if(!saved)d.querySelector('[data-stage="1"]').click();
 }else{
  adapter=w.__bazaBoard;
  if(saved)adapter.applyState(w.JSON.parse(JSON.stringify(saved)));
  for(const name of ['taskHelp','taskModel']){const el=d.querySelector('#'+name);el.open=true;el.dispatchEvent(new w.Event('toggle'));}
 }
 const state=()=>JSON.parse(JSON.stringify(adapter.getState())),model=()=>mode==='board'?state().work.ui.model:state().work.model;
 const input=(selector,value)=>{const el=d.querySelector(selector);el.value=String(value);el.dispatchEvent(new w.Event('input',{bubbles:true}));};
 return {dom,w,d,events,state,model,input};
}
for(const [mode,id] of [['managed','scale'],['managed','practice-percent-part'],['managed','practice-percent-whole'],['managed','practice-percent-change'],['board','scale']]){
 const f=controller(mode,id);
 if(id==='scale'){
  f.d.querySelector('#halfHeight').click();eq(f.model().cut,.5);f.d.querySelector('#thirdHeight').click();eq(f.model().cut,1/3);f.input('#cut',.9);eq(f.model().cut,.9);
 }else{
  f.d.querySelector('[data-base="whole"]').click();f.input('#percentSlide',0);eq(f.model().percent,0);f.input('#percentSlide',100);eq(f.model().percent,100);
 }
 eq(f.d.querySelector('#modelPrediction'),null,'shared controllers do not offer a personal-only prediction');legacyModel(f.model());
 for(const event of f.events)legacyModel(event.state.work.model);
 const before=f.state(),copy=controller(mode,id,before);eq(copy.state(),before,'existing controller state restores without new fields');eq(copy.d.querySelector('#modelPrediction'),null);legacyModel(copy.model());
 copy.dom.window.close();f.dom.window.close();
}
for(const id of ['scale','practice-percent-whole']){
 const f=fixture(id,1,undefined,false);if(id.startsWith('practice-percent'))f.$('[data-base="whole"]').click();
 eq(f.$('#modelPrediction'),null,'model discovery requires an explicit opt-in');legacyModel(f.state());f.restore();f.dom.window.close();
}
console.log(`EGE_BAZA_MODEL_DISCOVERY_OK: ${checks} checks; personal predictions/restoration, strict optional state, stale feedback repair; actual managed/board controllers retain legacy model payloads without personal discovery.`);
