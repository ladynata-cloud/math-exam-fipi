'use strict';
// Synthetic pupils and the real cabinet action queue/store; no production data.
const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const {LearningStore}=require('../board-server/learning-store');
const contracts=require('../board-server/learning-contracts');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
const clone=value=>JSON.parse(JSON.stringify(value));
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function until(predicate){for(let i=0;i<50;i++){if(predicate())return;await tick();}assert(predicate(),'Expected cabinet action');}

async function fixture(t){
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'legacy-geometry-helper-'));
 const store=new LearningStore({filePath:path.join(directory,'learning.sqlite'),contracts});
 const passwordHash='scrypt1:'+'01'.repeat(16)+':'+'02'.repeat(32);
 const teacher=store.activate(store.bootstrap({login:'geometry-teacher',name:'Fixture teacher'}).invitationToken,passwordHash).account;
 const pupil=store.activate(store.createStudent(teacher,{login:'geometry-pupil',name:'Fixture pupil'}).invitationToken,passwordHash).account;
 const generated=contracts.create('ege-path','grade7-r-point-membership',17);
 generated.state.work.draft='Мой ответ';generated.state.work.note='Моя запись';
 const attempt=store.newAttempt(pupil.id,teacher.id,'ege-path',generated);
 const dom=new JSDOM(read('learning/index.html'),{url:'https://cabinet.example.test/learning/#attempt='+attempt.id,runScripts:'outside-only'}),w=dom.window;
 w.setInterval=()=>0;w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
 for(const file of ['learning/catalog.js','learning/route.js','learning/geometry-object-labels.js'])w.eval(read(file));
 const contexts=[],calls=[],refreshes=[];
 w.LearningAssistant={mount(host,context){contexts.push(context);const dispose=()=>{};dispose.refresh=()=>refreshes.push(context.localTask?.());return dispose;}};
 w.LearningTrainerFrame=class{update(){}destroy(){}};w.LearningDrawing=class{update(){}destroy(){}};
 const transport={hold:null,reject:false};
 const response=(data,status=200)=>({ok:status===200,status,json:async()=>clone(data)});
 w.fetch=async(url,options)=>{
  const route=url.slice('/api/learning'.length),body=options.body?JSON.parse(options.body):null;calls.push({route,body});
  if(route.endsWith('/actions')){
   if(transport.hold)await transport.hold;
   if(transport.reject)return response({error:'LEARNING_FORBIDDEN'},403);
   try{return response(store.action(pupil,attempt.id,body));}catch(error){return response({error:error.code},error.status);}
  }
  if(route==='/attempts/'+attempt.id)return response(store.getAttempt(pupil,attempt.id));
  throw Error('Unexpected fixture request '+route);
 };
 const app=read('learning/app.js'),startup=app.lastIndexOf("(async()=>{const revision=authRevision;try{try{const status=await api('/status')");assert(startup>0);
 w.eval(app.slice(0,startup)+`
  window.geometryFixture={
   mount(who,initial){account=who;attempts=[initial];authReady=false;connected=true;return render();},
   inspect(){return {activeAttempt,outbox};},
   state(value){return action(activeAttempt.id,'state',{state:value});},
   check(value){return action(activeAttempt.id,'check',{state:value,details:{answer:activeAttempt.taskSpec.task.a,scope:'final'}});},
   mode(kind){
    if(kind==='history')workspace.history={current:clone(activeAttempt)};
    if(kind==='history-loading')workspace.historyLoading=true;
    if(kind==='control')activeAttempt.controller='teacher';
    if(kind==='offline')connected=false;
    if(kind==='archive')activeAttempt.archivedAt='fixture-archive';
    if(kind==='account')account={...account,id:'other-fixture-pupil'};
    if(kind==='auth-revision')++authRevision;
    if(kind==='auth-busy')authMutationBusy=true;
    if(kind==='quick-login')quickLoginBusy=true;
    if(kind==='identity')identityLocked=true;
    if(kind==='route')history.replaceState(null,'','#home');
    if(kind==='route-serial')++routeNumber;
    if(kind==='task')activeAttempt.taskSpec={...activeAttempt.taskSpec,task:{...activeAttempt.taskSpec.task,q:'Different saved condition'}};
    if(kind==='workspace')workspace.id='different-attempt';
    if(kind==='step')activeAttempt.state.work.step=1;
    if(kind==='pending-control')outbox.push({attemptId:activeAttempt.id,body:{type:'control',payload:{controller:'teacher'}}});
    updateWorkspace();
   },
   preview(summary){clearAssistant();workspace=null;activeAttempt=null;assignments=[{id:'fixture-assignment',attempt:summary}];history.replaceState(null,'','#assignment=fixture-assignment');mountCabinetAssistant('assignment',new URLSearchParams('assignment=fixture-assignment'),routeNumber);},
   skip(params){clearAssistant();mountCabinetAssistant('attempt',new URLSearchParams(params),routeNumber);},
   clear(){clearAccountView();}
  };
 })();`);
 t.after(()=>{dom.window.close();store.close();fs.rmSync(directory,{recursive:true,force:true});});
 await w.geometryFixture.mount(clone(pupil),clone(attempt));assert.equal(contexts.length,1);
 return {w,store,pupil,attempt,generated,calls,refreshes,transport,app:w.geometryFixture,context:()=>contexts.at(-1),contexts,
  hints:()=>calls.filter(call=>call.body?.type==='hint'),saved:()=>store.getAttempt(pupil,attempt.id)};
}

test('saved geometry projection uses source steps, readable choices and the actually selected object',async t=>{
 const f=await fixture(t),original=clone(f.saved().taskSpec),context=f.context(),before=clone(context.localTask());
 assert.equal(before.question,original.task.q);assert.equal(before.stepIndex,0);assert.equal(before.steps[0].explanation,original.task.steps[0].why);assert.equal(before.steps[0].answer,'Да');assert.equal(before.steps[1].answer,'Нет');assert.deepEqual(before.selectedObjects,[]);
 const state=clone(f.saved().state);state.work.model={kind:'grade7-construction',selected:'AB',built:[],revealed:0};
 assert.equal(await f.app.state(state),true);
 const selected=clone(context.localTask());assert.equal(selected.selectedObjects.length,1);assert.equal(selected.selectedObjects[0].label,'Отрезок AB');assert.match(selected.selectedObjects[0].description,/Отрезок AB/);
 state.work.answers=[original.task.steps[0].a];state.work.step=1;assert.equal(await f.app.state(state),true);assert.equal(context.localTask().stepIndex,1);
 assert(f.refreshes.some(value=>value?.stepIndex===1),'Saved progress refreshes the mounted assistant');assert.deepEqual(f.saved().taskSpec,original);assert.equal(f.hints().length,0);
});

test('help waits for the persisted hint acknowledgment and preserves drafts and source task',async t=>{
 const f=await fixture(t),before=clone(f.saved()),task=f.context().localTask();let release,settled=false;
 f.transport.hold=new Promise(resolve=>release=resolve);
 const request=f.context().onBeforeLocalAsk({mode:'hint',stepIndex:task.stepIndex,taskId:task.id}).then(value=>{settled=true;return value;});
 await until(()=>f.hints().length===1);assert.equal(settled,false);assert.equal(f.saved().assistance.hints,false);
 assert.deepEqual(f.hints()[0].body.payload,{step:0});release();assert.equal(await request,true);
 assert.equal(f.saved().assistance.hints,true);assert.deepEqual(f.saved().state,before.state);assert.deepEqual(f.saved().taskSpec,before.taskSpec);
 assert.equal(f.store.history(f.pupil,f.attempt.id).events.filter(event=>event.type==='hint').length,1);
});

test('invalid task/step requests and assignment previews cannot record phantom help',async t=>{
 const f=await fixture(t),context=f.context(),task=context.localTask();
 assert.equal(await context.onBeforeLocalAsk({stepIndex:1,taskId:task.id}),false);assert.equal(await context.onBeforeLocalAsk({stepIndex:0,taskId:'another-task'}),false);
 f.app.preview({id:f.attempt.id,trainerId:'ege-path',contentId:'grade7-r-point-membership'});
 assert.equal(f.context().localTask(),null);assert.match(f.context().localTaskUnavailable,/Открыть тренажёр/);
 assert.equal(await f.context().onBeforeLocalAsk({stepIndex:0,taskId:task.id}),false);assert.equal(f.hints().length,0);
});

for(const mode of ['history','history-loading','control','pending-control','offline','archive','account','auth-revision','auth-busy','quick-login','identity','route','route-serial','task','workspace']){
 test(mode+' revokes a retained legacy helper context without recording help',async t=>{
  const f=await fixture(t),context=f.context(),task=context.localTask();f.app.mode(mode);
  assert.equal(context.localTask(),null);assert.equal(await context.onBeforeLocalAsk({stepIndex:task.stepIndex,taskId:task.id}),false);assert.equal(f.hints().length,0);
 });
}

test('server rejection does not authorize disclosure',async t=>{
 const f=await fixture(t),task=f.context().localTask();f.transport.reject=true;
 assert.equal(await f.context().onBeforeLocalAsk({stepIndex:task.stepIndex,taskId:task.id}),false);assert.equal(f.saved().assistance.hints,false);
});

test('changing routes while hint persistence is pending rejects the late result',async t=>{
 const f=await fixture(t),context=f.context(),task=context.localTask();let release;f.transport.hold=new Promise(resolve=>release=resolve);
 const request=context.onBeforeLocalAsk({stepIndex:task.stepIndex,taskId:task.id});await until(()=>f.hints().length===1);f.app.mode('route');release();assert.equal(await request,false);
});

test('assistance affects a later result while help after an independent result preserves that credit',async t=>{
 for(const helpedBefore of [true,false]){
  const f=await fixture(t),context=f.context(),task=context.localTask(),state=clone(f.saved().state);
  if(helpedBefore)assert.equal(await context.onBeforeLocalAsk({stepIndex:task.stepIndex,taskId:task.id}),true);
  state.work.step=f.generated.taskSpec.task.steps.length;state.work.answers=f.generated.taskSpec.task.steps.map(step=>step.a);state.work.done=true;
  assert.equal(await f.app.check(state),true);assert.equal(f.saved().outcome,helpedBefore?'hinted':'independent');
  const completed=context.localTask();assert.equal(completed.stepIndex,state.work.step-1);
  assert.equal(await context.onBeforeLocalAsk({stepIndex:completed.stepIndex,taskId:completed.id}),true);
  assert.equal(f.saved().outcome,helpedBefore?'hinted':'independent');assert.equal(f.saved().assistance.hints,true);
 }
});

test('exam/preview/native routes retain the existing assistant exclusion',async t=>{
 const f=await fixture(t),count=f.contexts.length;
 for(const params of ['attempt='+f.attempt.id+'&run=fixture-run','attempt='+f.attempt.id+'&preview=fixture-pupil','atanasyan-course'])f.app.skip(params);
 assert.equal(f.contexts.length,count);
});
