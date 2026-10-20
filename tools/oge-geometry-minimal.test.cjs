'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..');
const cases=[
 [16,'circle','#ans','#check','trTask.ans','render();'],
 [17,'quadrilaterals','#ans','#chk','CUR.ans','renderTrain(true);'],
 [18,'grid','#ansIn','#chkBtn','TR.task.ans','nextTrainTask();drawTrain();'],
 [23,'geometry-calculations','.train-host .ans-inp','.train-host .ans-row button',null,null],
 [24,'proofs',null,null,null,null],
 [25,'geometry',null,null,null,'newTrainTask(TYPES[1].id);']
];
async function load(n,name,query='',saved=[]){
 const errors=[];const logs=[];const virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',e=>errors.push(e));virtualConsole.on('log',m=>logs.push(m));
 const html=fs.readFileSync(path.join(root,`trainers/oge-task${n}-${name}.html`),'utf8');
 const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:`https://mathexam.space/trainers/oge-task${n}-${name}.html${query}`,virtualConsole,beforeParse(w){saved.forEach(([key,value])=>w.localStorage.setItem(key,value));}});
 await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));
 assert.deepEqual(errors.map(e=>e.message),[],'page boots without errors');
 return {dom,w:dom.window,d:dom.window.document,errors,logs};
}
const storage=w=>Array.from({length:w.localStorage.length},(_,i)=>{const key=w.localStorage.key(i);return [key,w.localStorage.getItem(key)];});
for(const [n,name,input,check,answer,next] of cases){
 test(`№${n}: task first, optional help, original navigation and keyboard controls`,async()=>{
  const {dom,w,d,errors}=await load(n,name);
  try{
   const settings=d.querySelector('#courseSettings');assert.ok(settings);assert.equal(settings.open,false);
   assert.ok(settings.querySelector('.tabs'),'original mode controls available in settings');
   assert.ok(d.querySelector('svg'),'condition drawing retained');
   const hint=d.querySelector('#courseHintToggle'),panel=d.querySelector('#courseHintPanel');assert.ok(hint);assert.equal(hint.textContent,'Хочешь подсказку?');assert.equal(panel.hidden,true);assert.equal(hint.getAttribute('aria-expanded'),'false');
   const before=storage(w);hint.click();assert.equal(panel.hidden,false);assert.equal(hint.getAttribute('aria-expanded'),'true');hint.click();assert.equal(panel.hidden,true);assert.deepEqual(storage(w),before,'opening/closing help is not an answer or mistake');
   assert.equal(d.querySelectorAll('#courseHintToggle').length,1);assert.equal(d.querySelectorAll('#courseHintPanel').length,1);
   if(input&&answer){
    const ans=d.querySelector(input);const v=w.eval(answer);ans.value=String(v);d.querySelector(check).click();
    assert.match((d.querySelector('#fb')||d.querySelector('.fb')).textContent,/Верно/);
   }
   if(next){w.eval(next);assert.equal(d.querySelector('#courseHintPanel').hidden,true);assert.equal(d.querySelectorAll('#courseHintToggle').length,1);}
   assert.deepEqual(errors.map(e=>e.message),[]);
  }finally{dom.window.close();}
 });
 test(`№${n}: selftest keeps persistent progress untouched`,async()=>{
  const {dom,w,logs}=await load(n,name,'?selftest=1');
  try{assert.equal(w.localStorage.length,0);assert.ok(logs.some(s=>s===`OGE${n}_SELFTEST_OK`),logs.join('\n'));}finally{dom.window.close();}
 });
}
test('№23: optional laboratory works on exactly the displayed problem',async()=>{
 const {dom,w,d,errors}=await load(23,'geometry-calculations');
 try{
  w.eval("trainMode='solo';buildTask(document.querySelector('.train-host'),{sub:'rhombH',p:{DH:3,CH:2},exp:4},'train',function(){});");
  const text=d.querySelector('.q-text').textContent;d.querySelector('#courseHintToggle').click();
  Array.from(d.querySelectorAll('#courseHintPanel button')).find(b=>b.textContent==='Решать по шагам').click();
  assert.equal(d.querySelector('.q-text').textContent,text);
  assert.ok(d.querySelector('.step-recog .choice-btn'));
  assert.ok(d.querySelector('.minimal-part2-note'));
  assert.deepEqual(errors.map(e=>e.message),[]);
 }finally{dom.window.close();}
});
test('№24: accepted proof steps stay visible and preserve proof grading',async()=>{
 const {dom,w,d,errors}=await load(24,'proofs');
 try{
  const hints=w.eval('ST.hints');d.querySelector('#courseHintToggle').click();assert.equal(w.eval('ST.hints'),hints);
  w.eval("pickCard({type:'s',i:0})");assert.equal(w.eval('ST.placed'),1);assert.equal(d.querySelectorAll('.chain .citem').length,1);
  w.eval("pickCard({type:'s',i:1})");assert.equal(d.querySelectorAll('.chain .citem').length,2);
  assert.match(d.querySelector('.givens').textContent,/Доказать/);assert.deepEqual(errors.map(e=>e.message),[]);
 }finally{dom.window.close();}
});
test('№25: same task enters guided steps and keeps typed final answers',async()=>{
 const {dom,w,d,errors}=await load(25,'geometry');
 try{
  const initial=w.eval('trS.id'),answer=d.querySelector('[data-ai]');answer.value='12';
  d.querySelector('#courseHintToggle').click();Array.from(d.querySelectorAll('#courseHintPanel button')).find(b=>b.textContent==='Решать по шагам').click();
  assert.equal(w.eval('trS.id'),initial);assert.equal(w.eval('trS.gmode'),true);assert.equal(d.querySelector('[data-ai]').value,'12');assert.ok(d.querySelector('#courseHintPanel .guidebox'));assert.deepEqual(errors.map(e=>e.message),[]);
 }finally{dom.window.close();}
});
test('№23: switching to guidance retains input and prior shown/missed provenance',async()=>{
 const {dom,w,d}=await load(23,'geometry-calculations');
 try{
  w.eval("buildTask(document.querySelector('.train-host'),{sub:'rhombH',p:{DH:3,CH:2},exp:4},'train',function(){});");
  w.creditCalls=0;w.logCalls=[];w.eval('CP.solvedOne=()=>{window.creditCalls++};CP.mlog=(type,ok)=>window.logCalls.push(ok)');
  const input=d.querySelector('.train-host > .card > .ans-row input');input.value='7';
  d.querySelector('.train-host > .card > .ans-row button').click();
  d.querySelector('#courseHintToggle').click();
  const step=Array.from(d.querySelectorAll('.tools button')).find(b=>b.textContent.includes('Шаг за шагом'));step.click();
  const start=d.querySelector('[data-guided-start]');start.click();
  assert.equal(input.value,'7');assert.equal(input.disabled,true);assert.equal(start.disabled,true);
  assert.equal(d.querySelectorAll('.q-text').length,1,'condition stays only once');
  // Independent completion must remain blocked after showing a computed step.
  const recognition=Array.from(d.querySelectorAll('.step-recog .choice-btn')).find(b=>b.textContent.startsWith('Сторона ромба ='));recognition.click();
  for(const answer of ['5','4']){const current=d.querySelector('.ladder .step:not(.done)');current.querySelector('input').value=answer;current.querySelector('.ans-row button').click();}
  assert.equal(w.creditCalls,0,'shown result cannot turn into independently solved');assert.deepEqual(Array.from(w.logCalls),[false],'earlier mistake is not replaced by clean success');
 }finally{dom.window.close();}
});
test('№23: terminal shown or solved tasks cannot restart a clean guided attempt',async()=>{
 for(const result of ['shown','solved']){
  const {dom,w,d}=await load(23,'geometry-calculations');try{
   w.eval("buildTask(document.querySelector('.train-host'),{sub:'rhombH',p:{DH:3,CH:2},exp:4},'train',function(){});");d.querySelector('#courseHintToggle').click();
   if(result==='shown')Array.from(d.querySelectorAll('.tools button')).find(b=>b.textContent.includes('Сдаюсь')).click();
   else{d.querySelector('.train-host > .card > .ans-row input').value='4';d.querySelector('.train-host > .card > .ans-row button').click();}
   const start=d.querySelector('[data-guided-start]');assert.equal(start.disabled,true);start.click();assert.equal(d.querySelector('.step-recog'),null);
  }finally{dom.window.close();}
 }
});
test('№24: using a hint preserves the open help and highlighting',async()=>{
 const {dom,w,d}=await load(24,'proofs');try{
  d.querySelector('#courseHintToggle').click();d.querySelector('button[onclick="useHint()"]').click();
  assert.equal(d.querySelector('#courseHintPanel').hidden,false);assert.equal(d.querySelector('#courseHintToggle').getAttribute('aria-expanded'),'true');assert.ok(d.querySelector('.hintglow'));
 }finally{dom.window.close();}
});

test('№24: review deep link gets minimal help and retains its open task queue',async()=>{
 const first=await load(24,'proofs');first.w.eval('CP.mlog(curTask().id,false)');const saved=storage(first.w);const id=first.w.eval('curTask().id');first.dom.window.close();
 const second=await load(24,'proofs','?mode=review',saved);try{assert.equal(second.w.eval('ST.review'),true);assert.equal(second.w.eval('ST.queue[0]'),id);assert.ok(second.d.querySelector('#courseHintToggle'));assert.equal(second.d.querySelector('#courseHintPanel').hidden,true);}finally{second.dom.window.close();}
});
