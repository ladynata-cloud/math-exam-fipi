'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const {resolvePublicScript}=require('./public-page-script.cjs');
const root=path.resolve(__dirname,'..'),file=path.join(root,'ege-profil/start/index.html');
const KEY='mathexam.profileStart2027.v1';

function page(lesson,mode='independent',scoped=true,seed){
 const dom=new JSDOM(fs.readFileSync(file,'utf8'),{
  url:'https://mathexam.space/ege-profil/start/index.html#practice/'+lesson+'/'+mode,
  runScripts:'outside-only',pretendToBeVisual:true
 });
 const w=dom.window,d=w.document;
 w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 d.body.classList.toggle('profile-journey-page',scoped);
 if(seed)w.localStorage.setItem(KEY,seed);
 for(const script of d.querySelectorAll('script[src]'))w.eval(fs.readFileSync(resolvePublicScript(root,path.dirname(file),script.getAttribute('src')),'utf8'));
 return dom;
}
function saved(w,id,mode='independent'){return JSON.parse(w.localStorage.getItem(KEY)).sessions[id+':'+mode];}
function input(w,value){const e=w.document.getElementById('answer');e.value=String(value);e.dispatchEvent(new w.Event('input',{bubbles:true}));}
function before(w,a,b){return !!(a.compareDocumentPosition(b)&w.Node.DOCUMENT_POSITION_FOLLOWING);}

test('public applied practice keeps the answer before duplicated model data and retains drafts/help across reload',()=>{
 const id='applied-loan-linear';let dom=page(id),w=dom.window,d=w.document;
 try{
  const condition=d.querySelector('.condition-panel .task-condition'),model=d.getElementById('task-model'),form=d.getElementById('answer-form');
  const taskId=saved(w,id).taskId,task=w.ProfileLessons.find(l=>l.id===id).tasks.find(t=>t.id===taskId);
  assert(model.querySelector('.applied-model svg'),'drawing remains available');
  assert(model.querySelector('table'),'data table remains available');
  assert.equal(model.parentElement.className,'current-question');
  assert(before(w,condition,form),'full condition remains before question and answer');
  assert(before(w,form,model),'answer is reachable before diagram and repeated data');
  input(w,'31/7');
  model.querySelector('[data-model-action="explain"]').click();
  assert.equal(saved(w,id).assisted,true,'moving model does not bypass help accounting');
  assert.equal(saved(w,id).draft,'31/7');
  const persisted=w.localStorage.getItem(KEY),conditionHTML=condition.innerHTML;
  w.close();dom=page(id,'independent',true,persisted);w=dom.window;d=w.document;
  assert.equal(d.querySelector('#answer').value,'31/7');
  assert.equal(saved(w,id).taskId,taskId);
  assert.equal(d.querySelector('.condition-panel .task-condition').innerHTML,conditionHTML,'original condition is not shortened or replaced');
  input(w,task.answer);d.getElementById('answer-form').dispatchEvent(new w.Event('submit',{cancelable:true}));
  assert.match(d.getElementById('feedback').textContent,/Верно/);
  d.getElementById('next').click();
  const record=JSON.parse(w.localStorage.getItem(KEY)).records[id];
  assert.equal(record.independent.length,0,'a correct answer after model help remains assisted');
 }finally{w.close();}
});

test('scoped layout preserves diagram-first geometry and does not reorder other course wrappers',()=>{
 for(const [id,scoped]of [['applied-loan-linear',false],['geo-right',true]]){
  const dom=page(id,'guided',scoped),w=dom.window,d=w.document;
  try{
   const model=d.getElementById('task-model'),form=d.getElementById('answer-form');
   assert(model.closest('.condition-panel'),id+': drawing remains in its condition panel');
   assert(before(w,model,form),id+': original reading order retained');
   input(w,11);d.getElementById('hint').click();
   assert.equal(d.getElementById('answer').value,'11');
   assert.equal(saved(w,id,'guided').draft,'11');
   assert.equal(d.getElementById('task-model'),model,'help does not remount the drawing');
  }finally{w.close();}
 }
});
