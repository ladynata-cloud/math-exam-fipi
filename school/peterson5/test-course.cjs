'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');const base=__dirname;
const src=f=>fs.readFileSync(path.join(base,f),'utf8');
function runtime(hash,saved){const dom=new JSDOM(src('index.html'),{url:'https://mathexam.space/school/peterson5/'+hash,runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;w.scrollTo=()=>{};if(saved)w.localStorage.setItem('mathexam.peterson5.v1',JSON.stringify(saved));for(const f of ['math.js','models.js','data.js','app.js'])w.eval(src(f));return dom;}
const dom=runtime('#home'),w=dom.window,D=w.PetersonCourse,M=w.PetersonMath;
assert.equal(D.lessons.length,43);assert.equal(D.lessons.filter(l=>l.part===1).length,24);assert.equal(D.lessons.filter(l=>l.part===2).length,19);
assert.equal(M.skills.length,28);assert(!M.check('18/10','9/5',D.lessons[24].tasks[2].answerFormat));assert(!M.check('002,900200','2,9002',D.lessons[35].tasks[2].answerFormat));assert(M.check('2.9002','2,9002',D.lessons[35].tasks[2].answerFormat));const ids=new Set();let tasks=0,manual=0,steps=0;
const transfers={
 'p01-t01':['letter-product',1],'p01-t02':['letter-product',2],
 'p28-t02':['unlike-fraction-subtract',1],
 'p40-t02':['decimal-place-subtract',1],'p40-t03':['decimal-place-subtract',2]
};
const additions={'p28-t01':['fraction-add',1],'p28-t03':['fraction-add',1],'p40-t01':['decimal-add',1]};
// These seeds render the textbook's same 12x, 7ac and 1/4 − 1/5 with new wording.
const sameConditionSeeds={'p01-t01':174,'p01-t02':7691,'p28-t02':415};
function atPreviousSeed(source){
 const collision=sameConditionSeeds[source.id];if(!collision)return;
 const [skill,level]=transfers[source.id];
 assert.equal(M.generate(skill,collision,level).answer,source.answer,'fixture must reproduce the textbook answer');
 return {version:1,tasks:{},practice:{[skill+':'+level]:{seed:collision-1}}};
}
function submitFinal(w,t,value){
 const doc=w.document;
 if(t.kind==='choice'){
  const index=t.choices.indexOf(value);assert(index>=0,value);doc.querySelector('[data-choice="'+index+'"]').click();
 }else{
  const field=doc.getElementById('final-answer');field.value=value;field.dispatchEvent(new w.Event('input',{bubbles:true}));
 }
 doc.getElementById('answer-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
}
function checkTransfer(w,source,destination){
 const [skill,level]=destination,api=w.PetersonApp,original=api.getState().tasks[source.id],route=w.location.hash;
 const action=w.document.querySelector('[data-action="independent-check"]');
 assert(action,source.id+' transfer action');action.click();api.route();
 assert.equal(w.location.hash,'#practice/'+skill+'/'+level);
 const state=api.getState(),seed=state.practice[skill+':'+level].seed,key='practice:'+skill+':'+level+':'+seed;
 const practice=w.PetersonMath.generate(skill,seed,level);
 assert.notEqual(practice.prompt,source.prompt);
 if(sameConditionSeeds[source.id])assert.notEqual(seed,sameConditionSeeds[source.id],'fresh wording of the textbook example is still familiar');
 assert.equal(state.tasks[key].attempts,0);assert.equal(state.tasks[key].assisted,false);
 submitFinal(w,practice,practice.answer);
 assert.equal(api.getState().tasks[key].independent,true,key);
 w.document.querySelector('[data-action="return"]').click();api.route();
 assert.equal(w.location.hash,route);
 assert.deepEqual(api.getState().tasks[source.id],original,'transfer must not write an answer for '+source.id);
 return key;
}
const visited=new Set();
for(const l of D.lessons){assert(l.theory.length>=2,l.id);assert(l.model,l.id);assert(l.skills.every(id=>M.skills.some(x=>x.id===id)),l.id);assert(l.tasks.length>=3,l.id);
 for(const [index,t] of l.tasks.entries()){
  assert(!ids.has(t.id));ids.add(t.id);tasks++;assert.equal(t.source.part,l.part);assert(t.source.verified,t.id);assert(t.source.page>=l.page,t.id);assert(t.steps.length>=2,t.id);assert(t.finalLabel,t.id);assert(['number','choice','manual'].includes(t.kind),t.id);
  if(t.kind==='choice'){assert(t.choices.includes(t.answer),t.id);assert.equal(t.choices.length,new Set(t.choices).size,t.id);}
  else if(t.kind==='number')assert(M.check(t.answer,t.answer,t.answerFormat),t.id+' expected answer form');
  const r=runtime('#lesson/'+l.id+'/'+index,atPreviousSeed(t)),doc=r.window.document;assert(!doc.body.textContent.includes('Не удалось открыть'),t.id);assert(doc.getElementById('problem').textContent.includes(t.prompt.split(' ')[0]),t.id);
  const help=doc.querySelector('[data-action="guided"]');help.click();
  let firstTransfer;
  if(transfers[t.id]){
   assert.equal(r.window.PetersonApp.getState().tasks[t.id].attempts,0);
   firstTransfer=checkTransfer(r.window,t,transfers[t.id]);visited.add(t.id);
  }
  for(let i=0;i<t.steps.length;i++){
   const q=t.steps[i];const input=doc.querySelector('[data-step-input="'+i+'"]');
   if(typeof q!=='string'&&q.answer!==undefined){assert(input,t.id+' step '+i);input.value=q.answer;input.dispatchEvent(new r.window.Event('input',{bubbles:true}));doc.querySelector('[data-step-form="'+i+'"]').dispatchEvent(new r.window.Event('submit',{bubbles:true,cancelable:true}));}
   else{const b=doc.querySelector('[data-action="continue-step"],[data-action="next-step"]');assert(b,t.id+' continue '+i);b.click();}
   steps++;
  }
  if(t.kind==='manual'){manual++;const note=doc.getElementById('notebook');note.value='Моё рассуждение записано в тетради.';note.dispatchEvent(new r.window.Event('input',{bubbles:true}));doc.querySelector('[data-action="reviewed"]').click();assert(!r.window.PetersonApp.getState().tasks[t.id].correct,t.id+' manual credit');}
  else {
   submitFinal(r.window,t,t.answer);
   const result=r.window.PetersonApp.getState().tasks[t.id];assert(result.correct,t.id);assert(!result.independent,t.id+' hint provenance');
  }
  if(additions[t.id]){checkTransfer(r.window,t,additions[t.id]);visited.add(t.id);}
  if(t.id==='p28-t02')assert.notEqual(checkTransfer(r.window,t,transfers[t.id]),firstTransfer,'fresh question after the original was answered');
  r.window.close();
 }
}
assert.equal(visited.size,Object.keys(transfers).length+Object.keys(additions).length);
// An existing correct answer of zero is a valid old result, even though this
// particular exercise is an unsuitable new example of unlike-denominator subtraction.
const legacyKey='practice:fraction-subtract:1:1';
const legacy={version:1,tasks:{[legacyKey]:{value:'0',attempts:1,correct:true,independent:true,assisted:false}},
 practice:{'fraction-subtract:1':{seed:1}},last:{hash:'#practice/fraction-subtract/1'}};
const reader=runtime('#lesson/p28/1',legacy),api=reader.window.PetersonApp;
assert.equal(api.getState().tasks[legacyKey].independent,true);
const source=D.lessons.find(l=>l.id==='p28').tasks[1];
submitFinal(reader.window,source,'1/20');
assert.equal(api.getState().tasks[source.id].independent,true,'a pupil can first answer the original without help');
const imported=api.validateState(api.getState());
assert.equal(imported.tasks[legacyKey].independent,true);
assert.equal(imported.tasks[source.id].independent,true);
// Moving the same coefficient past the same letters does not introduce a new product.
const repeatedProduct={version:1,practice:{},tasks:{}};
const productKeys=[89,149].map(seed=>'practice:letter-product:2:'+seed);
const firstProduct=M.generate('letter-product',89,2),secondProduct=M.generate('letter-product',149,2);
assert.notEqual(firstProduct.prompt,secondProduct.prompt);assert.equal(firstProduct.answer,secondProduct.answer);
for(const key of productKeys)repeatedProduct.tasks[key]={value:firstProduct.answer,correct:true,attempts:1,assisted:false,independent:true};
const restored=api.validateState(repeatedProduct);
assert.equal(restored.tasks[productKeys[0]].independent,true);
assert.equal(restored.tasks[productKeys[1]].correct,true);assert.equal(restored.tasks[productKeys[1]].independent,false);
reader.window.close();
assert.equal(tasks,131);assert(manual>0);dom.window.close();console.log(JSON.stringify({ok:true,topics:43,tasks,manual,guidedSteps:steps,skills:M.skills.length,verifiedTransfers:visited.size,gate:'PETERSON5_CONTENT_JOURNEYS_OK'}));
