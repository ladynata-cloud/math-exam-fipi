'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..');
function surface(t,entry,{hash='',query='',prepare,skip=()=>false}={}){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(fs.readFileSync(path.join(root,entry),'utf8'),{url:'https://mathexam.space/'+entry+query+hash,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
 const w=dom.window;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 if(prepare)prepare(w);
 for(const script of w.document.querySelectorAll('script[src]')){
  const url=new URL(script.src);if(url.pathname.startsWith('/assets/')||skip(url.pathname))continue;
  w.eval(fs.readFileSync(path.join(root,url.pathname),'utf8'));
 }
 const f={w,q:s=>w.document.querySelector(s),click:s=>{assert(f.q(s),s);f.q(s).click();},fill(s,v){const e=f.q(s);assert(e,s);e.value=String(v);e.dispatchEvent(new w.Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));},submit(){f.q('form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));},storage(){return JSON.stringify(Object.fromEntries(Object.keys(w.localStorage).map(k=>[k,w.localStorage.getItem(k)])));}};
 t.after(()=>{w.close();assert.deepEqual(errors,[]);});return f;
}
const copy=v=>JSON.parse(JSON.stringify(v));
for(const board of [false,true])test('logarithms: blank choices/numbers do not consume an attempt, including a shared room '+board,t=>{
 const f=surface(t,'trainers/college-logarithms/index.html',{query:board?'?board=1':''});
 for(const task of f.w.LogCourseData.tasks){
  f.w.LogCourseApp.select(task.id);
  for(let stage=0;stage<task.steps.length;stage++){
   const step=task.steps[stage];
   f.fill('#answer',step.kind==='choice'?'':' \u00a0 ');
   const before=copy(f.w.LogCourseApp.snapshot()),saved=f.storage();
   f.click('#check');f.click('#check');
   assert.deepEqual(copy(f.w.LogCourseApp.snapshot()),before,task.id+' step '+stage);
   assert.equal(f.storage(),saved);assert.equal(f.w.document.activeElement,f.q('#answer'));
   assert.match(f.q('#feedback').textContent,/Сначала/);
   f.fill('#answer',step.kind==='point'?step.answer.join('; '):step.answer);f.click('#check');
   assert.equal(f.w.LogCourseApp.snapshot().state.stage,stage+1);assert.equal(f.w.LogCourseApp.snapshot().state.errors,0);
  }
 }
});
for(const board of [false,true])test('functions: incomplete fields/coordinates preserve first-try credit, zero and explicit empty sets work '+board,t=>{
 const f=surface(t,'trainers/college-functions/index.html',{query:board?'?board=1':''});
 if(!board)f.click('#test-mode');
 const snap=()=>copy(f.w.CollegeFunctionsApp.snapshot()),task=f.w.CollegeFunctionsData.tasks.find(x=>x.id===snap().taskId),E=f.w.CollegeFunctionsEngine;
 function incomplete(selector,button){
  f.fill(selector,' \u00a0 ');const before=snap(),saved=f.storage();f.click(button);f.click(button);
  assert.deepEqual(snap(),before);assert.equal(f.storage(),saved);assert.equal(f.w.document.activeElement,f.q(selector));assert.match(f.q('#feedback').textContent,/Заполните|Сначала|Введите/);
 }
 function check(values){for(const [key,value]of Object.entries(values))f.fill('[data-answer="'+key+'"]',value);f.click('#check-step');}
 incomplete('#answer-domain','#check-step');check({domain:E.formatSet(task.domain)});
 // Filled preceding rows stay intact and the first missing row receives focus.
 task.points.forEach((p,i)=>f.fill('[data-answer="y'+i+'"]',E.formatNumber(p.y)));
 incomplete('[data-answer="y1"]','#check-step');f.fill('[data-answer="y1"]',E.formatNumber(task.points[1].y));f.click('#check-step');
 assert.equal(snap().attempt.stage,2);
 for(const point of task.points){f.fill('#plot-x',point.x);incomplete('#plot-y','#place-point');f.fill('#plot-y',point.y);f.click('#place-point');}
 incomplete('#answer-range','#check-step');check({range:E.formatSet(task.range)});
 incomplete('#answer-zeros','#check-step');check({zeros:task.zeros.length?task.zeros.join('; '):'нет'});
 f.fill('#answer-positive',E.formatSet(task.positive));incomplete('#answer-negative','#check-step');check({negative:E.formatSet(task.negative)});
 f.fill('#answer-up',E.formatIntervals(task.up));f.fill('#answer-down',E.formatIntervals(task.down));incomplete('#answer-constant','#check-step');check({constant:E.formatIntervals(task.constant||[])});
 const before=snap();f.click('#check-step');assert.deepEqual(snap(),before);assert.equal(f.w.document.activeElement,f.q('#answer-parity'));
 check({parity:task.parity});assert.equal(snap().attempt.completed,true);assert.equal(snap().attempt.errors,0);
 if(!board)assert.match(f.q('#progress-count').textContent,/1 самостоятельно/);
});
test('workshop: blank submissions cannot create failed events or disqualify an independent answer',t=>{
 const f=surface(t,'school/index.html',{hash:'#lesson/fraction'});f.click('[data-cmd="mode"][data-value="check"]');
 const key=f.w.WorkshopState.KEY,before=f.w.localStorage.getItem(key);
 for(const blank of ['','   ','\u00a0']){f.fill('#answer',blank);f.q('#answer-form').dispatchEvent(new f.w.Event('submit',{cancelable:true,bubbles:true}));assert.equal(f.w.localStorage.getItem(key),before);assert.equal(f.w.document.activeElement,f.q('#answer'));}
 const saved=JSON.parse(before),task=f.w.WorkshopMath.generate('fraction',saved.last.seed);
 f.fill('#answer',f.w.WorkshopMath.fmt(task.answer));assert.equal(f.q('#answer-required'),null);
 f.q('#answer-form').dispatchEvent(new f.w.Event('submit',{cancelable:true,bubbles:true}));
 const state=JSON.parse(f.w.localStorage.getItem(key));assert.equal(state.events.length,saved.events.length+1);assert.equal(state.events.at(-1).attempt,1);assert.equal(state.events.at(-1).independent,true);
});
test('workshop: genuine wrong answers still count and blank correction leaves the error history unchanged',t=>{
 const f=surface(t,'school/index.html',{hash:'#lesson/fraction'});f.click('[data-cmd="mode"][data-value="check"]');f.fill('#answer','-123456');f.q('#answer-form').dispatchEvent(new f.w.Event('submit',{cancelable:true}));
 const key=f.w.WorkshopState.KEY,before=f.w.localStorage.getItem(key);assert.equal(JSON.parse(before).events.at(-1).correct,false);
 f.fill('#answer','');f.q('#answer-form').dispatchEvent(new f.w.Event('submit',{cancelable:true}));assert.equal(f.w.localStorage.getItem(key),before);
});
for(const id of ['multiplication-division/course-whole-simple','multiplication-division/course-column-three-by-two'])test('managed arithmetic: blank submission explains the next action without a server event '+id,t=>{
 const server=require('../board-server/learning-contracts');let adapter;const events=[];
 const f=surface(t,'trainers/oge-basics/'+id+'.html',{query:'?learning=1',skip:s=>s.endsWith('/learning-loader.js'),prepare(w){w.MathExamRemediationManaged=true;const main=w.document.createElement('main');main.id='learning-remediation-root';w.document.body.append(main);w.MathExamLearning={register:x=>adapter=x};}});
 adapter.subscribe(e=>events.push(copy(e)));const envelope=server.create('oge-basics',id,1);adapter.applyState({...copy(envelope),readOnly:false});
 const before=copy(adapter.getState());f.click('#lm-check');f.click('#lm-check');assert.deepEqual(copy(adapter.getState()),before);assert.equal(events.length,0);assert.match(f.q('#lm-answer-required').textContent,/Сначала/);assert.equal(f.w.document.activeElement,f.q('#lm-answer'));
 f.fill('#lm-answer',envelope.taskSpec.steps[0].answer);assert.equal(f.q('#lm-answer-required'),null);f.click('#lm-check');assert(events.some(e=>e.kind==='check'));assert.equal(adapter.getState().step,1);
 adapter.applyState({...copy(envelope),readOnly:true});const n=events.length;f.click('#lm-check');assert.equal(events.length,n);assert.equal(f.q('#lm-answer-required'),null);
 if(id.endsWith('course-whole-simple')){
  const lesson=server.create('oge-basics','order-of-operations',1);lesson.state.view='learn';adapter.applyState({...copy(lesson),readOnly:false});
  const start=copy(adapter.getState()),eventCount=events.length;f.click('#lm-check');
  assert.deepEqual(copy(adapter.getState()),start);assert.equal(events.length,eventCount);assert.match(f.q('#lm-answer-required').textContent,/выбери ответ/);assert.equal(f.w.document.activeElement,f.q('[data-choice]'));
  f.click('[data-choice="'+lesson.taskSpec.lessons[0].question.answer+'"]');assert.equal(f.q('#lm-answer-required'),null);f.click('#lm-check');assert.equal(adapter.getState().lessonChecked[0],true);
 }
});
