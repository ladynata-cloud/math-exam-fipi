'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const {LearningStore}=require('../board-server/learning-store');
const contracts=require('../board-server/learning-contracts');
const remediation=require('../trainers/oge-basics/learning-contracts');
const clone=value=>JSON.parse(JSON.stringify(value));
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function until(predicate){for(let i=0;i<50;i++){if(predicate())return;await tick();}assert(predicate(),'Expected asynchronous support navigation');}
const contentId='multiplication-division/course-whole-two-digit';
const tableId='oge-basics:multiplication-division/multiplication-mixed';
function stateAt(spec,step){
  const state=remediation.create(spec.contentId,spec.seed).state;
  state.step=step;state.answers=spec.steps.slice(0,step).map(question=>String(question.answer));
  state.answer='Черновик';state.note='Моя запись к делению';
  return remediation.normalize(spec,state);
}
async function fixture(t,{role='student'}={}){
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'multiplication-support-'));
  const store=new LearningStore({filePath:path.join(directory,'learning.sqlite'),contracts});
  const passwordHash='scrypt1:'+'01'.repeat(16)+':'+'02'.repeat(32);
  const teacher=store.activate(store.bootstrap({login:'support-teacher',name:'Fixture teacher'}).invitationToken,passwordHash).account;
  const student=store.activate(store.createStudent(teacher,{login:'support-pupil',name:'Fixture pupil'}).invitationToken,passwordHash).account;
  const generated=contracts.create('oge-basics',contentId,1);
  generated.state=stateAt(generated.taskSpec,2);
  const source=store.newAttempt(student.id,teacher.id,'oge-basics',generated);
  const dom=new JSDOM(read('learning/index.html'),{url:'https://cabinet.example.test/learning/#attempt='+source.id,runScripts:'outside-only'});
  const w=dom.window,calls=[],frames=[];w.setInterval=()=>0;
  for(const file of ['learning/catalog.js','learning/route.js','learning/multiplication-support.js'])w.eval(read(file));
  w.LearningTrainerFrame=class{
    constructor(host,options){this.host=host;this.updates=[];this.update(options.attempt,{readOnly:options.readOnly});frames.push(this);}
    update(attempt,options){this.updates.push(clone({attempt,options}));}
    destroy(){} fit(){}
  };
  w.LearningDrawing=class{update(){}draw(){}destroy(){}};
  const app=read('learning/app.js'),startup=app.lastIndexOf("(async()=>{const revision=authRevision;try{try{const status=await api('/status')");
  assert(startup>0);
  w.eval(app.slice(0,startup)+`
    window.supportFixture={
      mount(who,initial){account=who;attempts=[initial];authReady=false;connected=true;return render();},
      render,
      inspect(){return {active:activeAttempt,attempts,outbox,rejected};},
      pending(state){outbox=state?[{attemptId:activeAttempt.id,body:{type:'state',opId:'fixture-pending',expectedTrainerVersion:activeAttempt.trainerVersion??activeAttempt.version,payload:{state}}}]:[];updateWorkspace();},
      mode(kind){
        if(kind==='history')workspace.history={current:clone(activeAttempt)};
        if(kind==='normal')workspace.history=null;
        if(kind==='control')activeAttempt={...activeAttempt,controller:'teacher'};
        if(kind==='offline')connected=false;
        if(kind==='archive')activeAttempt={...activeAttempt,archivedAt:'fixture-archived'};
        if(kind==='account'){account={...account,id:'different-account'};++authRevision;}
        if(kind==='auth')++authRevision;
        updateWorkspace();
      }
    };
  })();`);
  const transport={create:null};
  const response=data=>({ok:true,status:200,json:async()=>clone(data)});
  w.fetch=async(url,options)=>{
    const route=url.slice('/api/learning'.length),body=options.body?JSON.parse(options.body):null;
    calls.push({route,body});
    if(route==='/attempts'){
      const create=()=>store.createAttempt(student,body);
      return transport.create?transport.create(create):response(create());
    }
    if(route.startsWith('/attempts/'))return response(store.getAttempt(role==='student'?student:teacher,route.slice('/attempts/'.length)));
    throw Error('Unexpected fixture request '+route);
  };
  t.after(()=>{dom.window.close();store.close();fs.rmSync(directory,{recursive:true,force:true});});
  await w.supportFixture.mount(clone(role==='student'?student:teacher),clone(source));
  return {w,dom,store,student,teacher,source,calls,frames,transport,response,app:w.supportFixture,
    panel:()=>w.document.querySelector('#multiplication-step-support'),
    button:id=>[...w.document.querySelectorAll('[data-multiplication-support]')].find(button=>button.dataset.multiplicationSupport===id),
    creations:()=>calls.filter(call=>call.route==='/attempts')};
}

test('parent support opens the selected multiplication practice and returns to the exact preserved division draft',async t=>{
  const f=await fixture(t),old=clone(f.store.getAttempt(f.student,f.source.id)),history=clone(f.store.history(f.student,f.source.id));
  const panel=f.panel();assert(panel);assert.equal(panel.parentElement.id,'route-support');
  assert(panel.compareDocumentPosition(f.w.document.querySelector('#trainer-host'))&f.w.Node.DOCUMENT_POSITION_FOLLOWING,'Support is outside and above the sandboxed trainer');
  assert.equal(panel.querySelectorAll('button').length,3);
  f.button(tableId).click();f.button(tableId).click();
  await until(()=>f.w.location.hash.includes('returnTo='));
  assert.equal(f.creations().length,1);
  assert.equal(f.creations()[0].body.contentId,'multiplication-division/multiplication-mixed');
  assert.equal(f.creations()[0].body.fresh,false,'A previous unfinished support exercise can resume');
  assert.equal(f.creations()[0].body.sourceAttemptId,undefined,'Support does not replace the division condition');
  const route=new URLSearchParams(f.w.location.hash.slice(1));assert.equal(route.get('returnTo'),f.source.id);
  await f.app.render();
  assert.equal(f.panel(),null,'Multiplication practice does not recursively advertise division support');
  const back=f.w.document.querySelector('.route-return a');assert(back);assert.equal(back.getAttribute('href'),'#attempt='+f.source.id);
  f.w.history.replaceState(null,'',back.getAttribute('href'));await f.app.render();
  assert.deepEqual(f.app.inspect().active.state,old.state);
  assert.equal(f.frames.at(-1).updates.at(-1).attempt.state.answer,'Черновик');
  assert.equal(f.frames.at(-1).updates.at(-1).attempt.state.note,'Моя запись к делению');
  assert(f.panel(),'The same current product again offers support');
  assert.deepEqual(f.store.getAttempt(f.student,f.source.id),old);
  assert.deepEqual(f.store.history(f.student,f.source.id),history,'Opening support writes no hint/check/state event into the division work');
});

test('effective queued actions control the recommendations; unsaved work blocks leaving',async t=>{
  const f=await fixture(t),initial=clone(f.app.inspect().active.state);
  f.app.pending(initial);f.button(tableId).click();await tick();
  assert.equal(f.creations().length,0);assert.match(f.w.document.body.textContent,/дождитесь сохранения работы/);
  const subtraction=f.source.taskSpec.steps.findIndex(step=>step.kind==='subtract');
  f.app.pending(stateAt(f.source.taskSpec,subtraction));assert.equal(f.panel(),null,'Pending subtraction must not retain product recommendations');
  f.app.pending(null);assert(f.button(tableId));
  assert.deepEqual(f.store.getAttempt(f.student,f.source.id).state,initial,'UI selection cannot change the saved draft');
});

for(const mode of ['history','control','offline','archive','account']){
  test(mode+' cannot create support attempts through a retained old button',async t=>{
    const f=await fixture(t),button=f.button(tableId),old=clone(f.store.getAttempt(f.student,f.source.id));
    f.app.mode(mode);assert.equal(f.panel(),null);button.click();await tick();
    assert.equal(f.creations().length,0);assert.deepEqual(f.store.getAttempt(f.student,f.source.id),old);
    if(mode==='history'){f.app.mode('normal');assert(f.panel(),'Leaving history restores recommendations for the live step');}
  });
}

test('teacher observation has no pupil-practice action',async t=>{
  const f=await fixture(t,{role:'teacher'});assert.equal(f.panel(),null);assert.equal(f.creations().length,0);
});

test('a new click still works after an account check changed the auth revision without replacing the view',async t=>{
  const f=await fixture(t),stale=f.button(tableId);f.app.mode('auth');
  assert.notEqual(f.button(tableId),stale);stale.click();await tick();assert.equal(f.creations().length,0);
  f.button(tableId).click();
  await until(()=>f.w.location.hash.includes('returnTo='));assert.equal(f.creations().length,1);
});

test('failed creation restores the buttons without changing the division attempt',async t=>{
  const f=await fixture(t),old=clone(f.store.getAttempt(f.student,f.source.id));
  f.transport.create=()=>{throw Error('Fixture offline request');};
  f.button(tableId).click();await until(()=>f.creations().length===1&&!f.button(tableId).disabled);
  assert.equal(f.w.location.hash,'#attempt='+f.source.id);assert.deepEqual(f.store.getAttempt(f.student,f.source.id),old);
  f.transport.create=null;f.button(tableId).click();await until(()=>f.w.location.hash.includes('returnTo='));
  assert.equal(f.creations().length,2);
});

test('a late support response cannot navigate away from newly opened history',async t=>{
  const f=await fixture(t);let finish;
  f.transport.create=create=>{const result=create();return new Promise(resolve=>{finish=()=>resolve(f.response(result));});};
  f.button(tableId).click();await until(()=>!!finish);f.app.mode('history');finish();await tick();await tick();
  assert.equal(f.w.location.hash,'#attempt='+f.source.id);assert.equal(f.panel(),null);
  assert.equal(f.app.inspect().attempts.length,1,'Stale support response does not replace the observed work');
});

test('the real public wrapper loads contextual safe links, preserves drafts, and removes them for subtraction',async t=>{
  const requested=[],errors=[],key='mathExamBasics.divisionCourse.v1.'+contentId;
  class CheckoutResources extends ResourceLoader{
    fetch(url){
      const parsed=new URL(url);assert.equal(parsed.origin,'https://public.example.test');
      requested.push(parsed.pathname);
      return Promise.resolve(fs.readFileSync(path.join(root,parsed.pathname)));
    }
  }
  async function publicPage(saved){
    const console=new VirtualConsole();console.on('jsdomError',error=>errors.push(error.message));
    const dom=new JSDOM(read('trainers/oge-basics/multiplication-division/course-whole-two-digit.html'),{
      url:'https://public.example.test/trainers/oge-basics/multiplication-division/course-whole-two-digit.html',
      runScripts:'dangerously',resources:new CheckoutResources(),virtualConsole:console,
      beforeParse(window){if(saved)window.localStorage.setItem(key,saved);}
    });
    t.after(()=>dom.window.close());
    await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(Error('Public wrapper did not finish loading')),5000);
      dom.window.addEventListener('load',()=>{clearTimeout(timer);resolve();},{once:true});
    });
    dom.window.document.querySelector('#practice').click();return dom.window;
  }
  const w=await publicPage(),spec=remediation.create(contentId,1).taskSpec;
  const host=w.document.querySelector('#learning-remediation-root');
  function answer(question){
    const field=host.querySelector('#lm-answer');field.value=String(question.answer);
    field.dispatchEvent(new w.Event('input',{bubbles:true}));host.querySelector('#lm-check').click();
  }
  assert.equal(host.querySelector('.lm-multiplication-support'),null,'Choosing the first left-hand number needs no multiplication links');
  answer(spec.steps[0]);
  assert.equal(spec.steps[1].kind,'digit');assert(host.querySelector('.lm-multiplication-support'));
  answer(spec.steps[1]);assert.equal(spec.steps[2].kind,'product');
  const draft=host.querySelector('#lm-answer');draft.value='123';draft.dispatchEvent(new w.Event('input',{bubbles:true}));
  const before=w.localStorage.getItem(key),links=[...host.querySelectorAll('.lm-multiplication-support a')];
  assert.equal(links.length,3);
  for(const link of links){
    assert.match(link.getAttribute('href'),/^\/trainers\/oge-basics\/multiplication-division\//);
    assert.equal(link.target,'_blank');assert(link.relList.contains('noopener'));assert.equal(link.getAttribute('onclick'),null);
    assert(fs.statSync(path.join(root,new URL(link.href).pathname)).size>100);
  }
  assert.deepEqual(links.map(link=>link.getAttribute('href')),clone(w.MultiplicationSupport.forStep(spec,JSON.parse(before).state).map(link=>link.url)));
  assert.equal(w.localStorage.getItem(key),before,'Inspecting external support links changes neither the local attempt nor its draft');
  const restored=await publicPage(before);
  assert.equal(restored.document.querySelector('#lm-answer').value,'123');
  assert.equal(restored.document.querySelectorAll('.lm-multiplication-support a').length,3);
  assert.equal(restored.localStorage.getItem(key),before,'Opening the actual wrapper restores the same saved state');
  answer(spec.steps[2]);assert.equal(spec.steps[3].kind,'subtract');assert.equal(host.querySelector('.lm-multiplication-support'),null);
  assert(requested.includes('/learning/multiplication-support.js'));assert(requested.includes('/trainers/oge-basics/learning-managed.js'));
  assert.deepEqual(errors,[]);
});
