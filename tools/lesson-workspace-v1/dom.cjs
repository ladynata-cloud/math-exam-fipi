'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'../..');
const catalog=require(path.join(root,'learning/catalog'));
const html=fs.readFileSync(path.join(root,'learning/index.html'),'utf8');
const source=fs.readFileSync(path.join(root,'learning/app.js'),'utf8');
const teacher={id:'fixture_teacher',role:'teacher',name:'Fixture teacher'};
const pupil={id:'fixture_pupil',role:'student',name:'Fixture pupil',login:'fixture.pupil',profile:{course:'school',version:1}};
const other={...pupil,id:'fixture_other',name:'Fixture other',login:'fixture.other'};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(t){
 const dom=new JSDOM(html,{url:'https://cabinet.example/learning/#students',runScripts:'outside-only'}),w=dom.window,calls=[];
 Object.defineProperty(w.document,'hidden',{value:false,configurable:true});
 w.setInterval=()=>0;w.HTMLDialogElement.prototype.close=function(){this.open=false;};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 w.LearningCatalog=catalog;
 for(const file of ['lesson-workspace.js','teaching.js'])w.eval(fs.readFileSync(path.join(root,'learning',file),'utf8'));
 const startup=source.lastIndexOf("(async()=>{const revision=authRevision;try{try{const status=await api('/status')");assert(startup>0);
 w.eval(source.slice(0,startup)+`window.fixtureApp={set(person,people=[],savedLessons=[]){account=person;students=people;assignments=[];attempts=[];lessons=savedLessons;authReady=false;},render,mountWork(attempt,lesson){dispose();activeAttempt=attempt;activeLesson=lesson;mountWorkspace(attempt,{lesson:!!lesson,learnerId:attempt.learnerId});},lessonDialog,lessonAssignmentDialog,lessonAction,poll,remember,openContent,clearAccountView,getLessons:()=>lessons,setActiveLesson:value=>{activeLesson=value;},getActiveLesson:()=>activeLesson};})();`);
 let response=async url=>url.endsWith('/report')?{report:{student:pupil,attempts:[],positions:[]}}:url.endsWith('/profile')?{profile:pupil.profile}:url.endsWith('/ai-drafts')?{drafts:[]}:url.endsWith('/parent-access')?{parentAccess:{exists:false}}:{plan:{items:[]}};
 w.fetch=async(url,options={})=>{calls.push({url,options});const data=await response(url,options);return{ok:true,status:200,json:async()=>data};};
 w.fixtureApp.set(teacher,[pupil,other]);t.after(()=>w.close());
 return{w,calls,main:w.document.getElementById('main'),respond:fn=>{response=fn;},async go(route){w.history.replaceState(null,'','#'+route);await w.fixtureApp.render();await tick();}};
}
test('actual pupil card opens lesson with only that pupil; selecting materials makes no mutation',async t=>{
 const f=fixture(t);await f.go('student='+pupil.id);
 const start=f.main.querySelector('[data-student-start-lesson]');assert(start);start.click();
 const form=f.w.document.getElementById('lesson-form');assert(form);
 assert.deepEqual([...form.querySelectorAll('[name=student]:checked')].map(input=>input.value),[pupil.id]);
 const search=form.querySelector('[data-lesson-material-search]');search.value='equations-linear';search.dispatchEvent(new f.w.Event('input'));
 form.querySelector('[data-lesson-material-result="path:equations-linear"]').click();
 assert.equal(form.querySelectorAll('[data-lesson-materials] li').length,1);
 assert(f.calls.every(call=>!call.options.method),'Preparing a lesson must not create pupil work');
});
test('explicit start sends exact selected condition and intended pupil then opens that seat',async t=>{
 const f=fixture(t),lesson={id:'fixture_lesson',title:'Fixture',version:0,seats:[{learnerId:pupil.id,attemptId:null,materials:[]}]};
 f.respond(async()=>({lesson}));
 f.w.fixtureApp.lessonDialog({learnerIds:[pupil.id],materials:[{trainerId:'ege-path',contentId:'equations-linear',seed:734}]});
 const form=f.w.document.getElementById('lesson-form');
 form.dispatchEvent(new f.w.Event('submit',{cancelable:true,bubbles:true}));form.dispatchEvent(new f.w.Event('submit',{cancelable:true,bubbles:true}));await tick();
 assert.equal(f.calls.length,1);assert.equal(f.calls[0].url,'/api/learning/lessons');
 const sent=JSON.parse(f.calls[0].options.body);
 assert.deepEqual(sent.learnerIds,[pupil.id]);assert.deepEqual(sent.materials,[{trainerId:'ege-path',contentId:'equations-linear',seed:734}]);assert(sent.opId);
 assert.equal(f.w.location.hash,'#lesson=fixture_lesson&student=fixture_pupil');
});
test('account switch fences a pending lesson response and detached form handlers',async t=>{
 const f=fixture(t);let resolve;f.respond(()=>new Promise(done=>{resolve=done;}));
 f.w.fixtureApp.lessonDialog({learnerIds:[pupil.id]});const form=f.w.document.getElementById('lesson-form');
 form.dispatchEvent(new f.w.Event('submit',{cancelable:true}));await tick();
 f.w.fixtureApp.clearAccountView();f.w.fixtureApp.set(other,[]);f.w.history.replaceState(null,'','#home');
 resolve({lesson:{id:'must_not_open',seats:[]}});await tick();
 assert.equal(f.w.location.hash,'#home');assert.equal(f.w.fixtureApp.getLessons().length,0);
 form.dispatchEvent(new f.w.Event('submit',{cancelable:true}));await tick();assert.equal(f.calls.length,1);
});
test('catalog offers private rehearsal before any assignment mutation and preserves source route',async t=>{
 const f=fixture(t);await f.go('course');await f.w.fixtureApp.openContent('path:equations-linear');
 assert(f.w.document.querySelector('[data-content-rehearse]'));assert.equal(f.calls.length,0);
 f.w.document.querySelector('[data-content-rehearse]').click();
 const params=new f.w.URLSearchParams(f.w.location.hash.slice(1));assert.equal(params.get('rehearsal'),'new');assert.equal(params.get('trainer'),'ege-path');assert.equal(params.get('content'),'equations-linear');assert.equal(params.get('back'),'course');
 assert.equal(f.calls.length,0);
});
test('actual pupil home shows latest owned lesson entry without claiming live teacher presence',async t=>{
 const f=fixture(t);f.w.fixtureApp.set(pupil,[],[{id:'old_lesson',title:'Old',createdAt:1000},{id:'new_lesson',title:'Fixture lesson',createdAt:2000}]);
 await f.go('home');const link=f.main.querySelector('#lesson-join-link');assert(link);assert.equal(link.getAttribute('href'),'#lesson=new_lesson');assert.match(f.main.querySelector('#lesson-join-entry').textContent,/Fixture lesson/);
 assert.equal(f.calls.length,0);
});

test('an older lesson poll cannot reverse a confirmed material switch',async t=>{
 const f=fixture(t),initial={id:'fixture_lesson',version:0,seats:[{learnerId:pupil.id,attemptId:'material_a'}]},latest={...initial,version:1,seats:[{learnerId:pupil.id,attemptId:'material_b'}]};
 f.w.fixtureApp.setActiveLesson(initial);let release;
 f.respond((url,options)=>options.method==='POST'?{lesson:latest}:new Promise(resolve=>{release=resolve;}));
 const polling=f.w.fixtureApp.poll();await tick();
 await f.w.fixtureApp.lessonAction('attach',{learnerId:pupil.id,attemptId:'material_b'});
 assert.equal(f.w.fixtureApp.getActiveLesson().version,1);release(initial);await polling;
 assert.equal(f.w.fixtureApp.getActiveLesson().version,1);assert.equal(f.w.fixtureApp.getActiveLesson().seats[0].attemptId,'material_b');
});
test('older embedded attempt snapshots cannot overwrite confirmed work in a lesson',t=>{
 const f=fixture(t),old={id:'material_a',version:2,state:{answer:'old'}},latest={id:'material_a',version:3,state:{answer:'saved'}};
 f.w.fixtureApp.setActiveLesson({id:'fixture_lesson',version:0,seats:[{learnerId:pupil.id,attemptId:old.id,attempt:old}],presentation:{attempt:old},common:null});
 f.w.fixtureApp.remember(latest);f.w.fixtureApp.remember(old);
 const lesson=f.w.fixtureApp.getActiveLesson();assert.equal(lesson.seats[0].attempt.state.answer,'saved');assert.equal(lesson.presentation.attempt.version,3);
});

test('a lost add-material acknowledgement keeps its form usable across polls and retries the same operation',async t=>{
 const f=fixture(t);
 // The cabinet application and its form/queue handlers are real. Only canvas
 // and child-frame rendering are omitted from this DOM race regression.
 f.w.LearningTrainerFrame=class{update(){}destroy(){}fit(){}};
 f.w.LearningDrawing=class{update(){}destroy(){}draw(){}};
 const a={id:'material_a',learnerId:pupil.id,teacherId:teacher.id,trainerId:'ege-path',contentId:'equations-linear',version:0,
  state:{},strokes:[],controller:'student',outcome:'started',assistance:{teacher:false,hints:false}};
 const b={...a,id:'material_b',contentId:'percent'};
 const initial={id:'fixture_lesson',title:'Fixture',version:0,seats:[{learnerId:pupil.id,name:pupil.name,attemptId:a.id,attempt:a,
  materials:[{attemptId:a.id,title:'A'}]}],presentation:{target:null}};
 const updated={...initial,version:1,seats:[{...initial.seats[0],attemptId:b.id,attempt:b,
  materials:[...initial.seats[0].materials,{attemptId:b.id,title:'B'}]}]};
 let committed=false,posts=0;
 f.respond(async(url,options)=>{
  if(options.method==='POST'){
   posts++;committed=true;
   if(posts===1)throw new f.w.TypeError('Synthetic lost acknowledgement after commit');
   return{lesson:updated,duplicate:true};
  }
  return committed?updated:initial;
 });
 await f.go('lesson='+initial.id+'&student='+pupil.id);
 f.w.fixtureApp.lessonAssignmentDialog([pupil.id]);
 const form=f.w.document.getElementById('lesson-assignment-form'),search=form.querySelector('[data-lesson-material-search]');
 search.value='percent';search.dispatchEvent(new f.w.Event('input'));
 form.querySelector('[data-lesson-material-result="path:percent"]').click();
 form.dispatchEvent(new f.w.Event('submit',{cancelable:true,bubbles:true}));await tick();await tick();
 assert.equal(posts,1);assert.equal(f.w.fixtureApp.getActiveLesson().seats[0].attemptId,b.id);
 assert.equal(f.w.document.getElementById('modal').open,true,'Uncertain acknowledgement keeps the same reviewable form');
 const beforePoll=f.calls.length;await f.w.fixtureApp.poll();
 assert.equal(f.calls.length,beforePoll,'Background polling cannot invalidate the connected retry form');
 form.dispatchEvent(new f.w.Event('submit',{cancelable:true,bubbles:true}));await tick();await tick();
 assert.equal(posts,2,'Retry reaches the API instead of silently returning through a stale route guard');
 const requests=f.calls.filter(call=>call.options.method==='POST').map(call=>JSON.parse(call.options.body));
 assert.equal(requests[1].opId,requests[0].opId);assert.equal(requests[1].expectedVersion,requests[0].expectedVersion);
 assert.deepEqual(requests[1].payload,requests[0].payload);
 assert.equal(f.w.document.getElementById('modal').open,false);assert.equal(form.isConnected,false);
 assert.equal(f.w.fixtureApp.getActiveLesson().seats[0].attemptId,b.id);
});

test('authored LCM lesson has one secondary-tools panel and keeps control and catalogue navigation visible',t=>{
 const f=fixture(t),item=catalog.items.find(row=>row.unitKind==='author-supplement'&&row.unitId===1008);assert(item);
 f.w.LearningTrainerFrame=class{update(){}destroy(){}fit(){}};
 f.w.LearningDrawing=class{update(){}destroy(){}draw(){}};
 const attempt={id:'lcm_fixture',trainerId:item.trainerId,contentId:item.contentId,learnerId:pupil.id,teacherId:teacher.id,taskSpec:{unitId:1008},state:{},strokes:[],version:0,controller:'student',outcome:'started'};
 const lesson={id:'lcm_lesson',title:'LCM lesson',version:0,seats:[{learnerId:pupil.id,name:pupil.name,attemptId:attempt.id,attempt,materials:[{attemptId:attempt.id,title:item.title}]}],presentation:{target:null}};
 f.w.fixtureApp.mountWork(attempt,lesson);
 assert.equal(f.main.querySelectorAll('.lesson-session-tools,.lcm-workspace-tools').length,1);
 assert(f.main.querySelector('#trainer-control').closest('.workspace-heading'));
 assert(f.main.querySelector('#show-history').closest('.lesson-session-tools'));
 assert.equal(f.main.querySelector('#workspace-vilenkin-catalog').closest('details'),null);
 f.w.fixtureApp.mountWork(attempt,null);
 assert.equal(f.main.querySelectorAll('.lcm-workspace-tools').length,1);
 assert(f.main.querySelector('#trainer-control').closest('.lcm-workspace-tools'),'Standalone course keeps its established controls');
});
