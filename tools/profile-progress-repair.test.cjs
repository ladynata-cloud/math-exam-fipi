'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const State=require('../ege-profil/start/state.js'),Checkpoint=require('../ege-profil/start/checkpoint.js'),Check=require('../ege-profil/start/checks.js');
const Report=require('../ege-profil/progress-code.js');
const lessons=['geometry','stereo','algebra','probability','equations','functions','applied','finance','readiness'].flatMap(n=>require('../ege-profil/start/'+n+'-data.js'));
const catalog=require('../ege-profil/start/calm-data.js');
const ordered=catalog.exams.map(e=>lessons.find(l=>l.id===e.entry)).concat(lessons.filter(l=>!catalog.exams.some(e=>e.entry===l.id)));
function memory(entries=[]){const values=new Map(entries);return {values,getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};}
function round(cp){let c=cp.startRound(true);while(!c.complete){assert(!c.unavailable);cp.submit(String(c.task.answer),Check.check,c.token);c=cp.next(cp.current().token);}assert.equal(cp.snapshot().summary.independent,13);}
function finish(state,l,flags={}){const s=state.start(l.id,'independent',true),t=l.tasks.find(t=>t.id===s.taskId);s.answers=[String(t.answer)];Object.assign(s,flags);state.finish(l.id,'independent',s);return s;}

test('three perfect mixed rounds credit all 13 entry lessons without relabelling seen conditions',()=>{
 const storage=memory(),state=State.create(lessons,storage),cp=Checkpoint.create(ordered,storage,state);
 for(let n=0;n<3;n++)round(cp);
 for(const e of catalog.exams){const l=lessons.find(l=>l.id===e.entry);assert.equal(state.record(l.id).independent.length,3);assert(state.canAdvance(l.id));const repeat=finish(state,l);assert(repeat.familiar);assert.equal(state.record(l.id).independent.length,3);assert.equal(state.record(l.id).recovered.length,1);}
 const again=State.create(lessons,storage);Checkpoint.create(ordered,storage,again);
 for(const e of catalog.exams)assert.equal(again.record(e.entry).attempts,4,'reload never duplicates checkpoint attempts');
});

test('validated historical first submissions migrate once; assistance, familiar metadata, forged answers and invalid IDs never earn credit',()=>{
 const storage=memory([['mathExamCourseProgress.v1','{"legacy":"untouched"}']]),oldState=State.create(lessons,storage);
 delete oldState.creditCheckpoint;const oldCP=Checkpoint.create(ordered,storage,oldState);round(oldCP);
 const saved=storage.getItem(Checkpoint.KEY),before=JSON.parse(saved),target=before.round.items[0];
 assert.equal(oldState.record(target.lessonId).independent.length,0);
 for(const [expected,mutate] of [[1,()=>{}],[0,i=>{i.assisted=true;}],[0,i=>{i.familiar=true;}],[0,i=>{i.draft='999999';}],[0,i=>{i.taskId='unknown-task';}]]){
   const data=JSON.parse(saved);for(const r of [data.round,...data.history])mutate(r.items[0]);
   const raw=JSON.stringify(data),fixture=memory([[Checkpoint.KEY,raw],['mathExamCourseProgress.v1','{"legacy":"untouched"}']]);
   const state=State.create(lessons,fixture);Checkpoint.create(ordered,fixture,state);const count=state.record(target.lessonId).independent.length;
   assert.equal(count,expected);
   if(expected){assert(state.data.seen[target.taskId]);assert.notEqual(state.start(target.lessonId,'independent').taskId,target.taskId,'historical credit restores exposure, never creates a fake new task');}
   Checkpoint.create(ordered,fixture,state);assert.equal(state.record(target.lessonId).independent.length,count);
   assert.equal(fixture.getItem(Checkpoint.KEY),raw,'migration never rewrites checkpoint evidence');
   assert.equal(fixture.getItem('mathExamCourseProgress.v1'),'{"legacy":"untouched"}');
 }
});

test('narrow catalogs preserve unknown lessons, tasks, sessions and private fields without admitting them into mastery',()=>{
 const l=lessons[0],old={version:1,records:{'future-lesson':{draft:'private record'},[l.id]:{guided:['future-guided'],independent:['future-independent'],attempts:0,privateNote:'keep'}},seen:{'future-task':3},sessions:{'future-lesson:independent':{taskId:'future-task',draft:'private draft'},[l.id+':guided']:{taskId:l.tasks[0].id,step:0,started:'2026-01-01T00:00:00.000Z',draft:'77',answers:[],privateDraftNote:'keep me'}},privateMeta:{note:'retain'}};
 const storage=memory([[State.KEY,JSON.stringify(old)]]),state=State.create([l],storage);finish(state,l);
 const saved=JSON.parse(storage.getItem(State.KEY));assert.deepEqual(saved.records['future-lesson'],old.records['future-lesson']);assert.deepEqual(saved.sessions['future-lesson:independent'],old.sessions['future-lesson:independent']);assert.equal(saved.seen['future-task'],3);assert.deepEqual(saved.privateMeta,old.privateMeta);assert.equal(saved.records[l.id].privateNote,'keep');
 assert.equal(state.data.records['future-lesson'],undefined);assert.equal(state.data.sessions['future-lesson:independent'],undefined);assert.deepEqual(state.export().privateMeta,old.privateMeta);
 assert(saved.records[l.id].guided.includes('future-guided'));assert(saved.records[l.id].independent.includes('future-independent'));assert(!state.record(l.id).independent.includes('future-independent'));assert.equal(saved.sessions[l.id+':guided'].privateDraftNote,'keep me');assert.equal(state.data.sessions[l.id+':guided'].privateDraftNote,undefined);
 const rows=Report.profileRows(Report.fullReport(state.export(),[l],storage));assert.equal(rows.length,1);assert.equal(rows[0].independent,1,'opaque IDs survive export but cannot inflate its displayed grade');
});

test('after three failed conditions, two clean distinct repeats unlock continuation without new independent credit',()=>{
 const l=lessons.find(l=>l.id==='prob-count'),storage=memory(),state=State.create([l],storage);
 for(let n=0;n<3;n++)finish(state,l,{wrong:true});
 assert.equal(state.record(l.id).mistakes.length,3);assert(!state.canAdvance(l.id));
 finish(state,l,{assisted:true});finish(state,l,{wrong:true});assert.equal(state.record(l.id).recovered,undefined);
 const a=finish(state,l);assert(a.familiar);assert(!state.canAdvance(l.id));const b=finish(state,l);assert.notEqual(a.taskId,b.taskId);assert(state.canAdvance(l.id));
 assert.deepEqual(state.record(l.id).independent,[]);assert.equal(state.record(l.id).recovered.length,2);
 const raw=state.export(),reloaded=State.create([l],storage);assert.deepEqual(reloaded.record(l.id),raw.records[l.id]);assert.equal(reloaded.record(l.id).mistakes.length,3);
 const report=Report.fullReport(raw,[l],storage),row=Report.profileRows(Report.validateFullReport(JSON.parse(JSON.stringify(report))))[0];
 assert.equal(row.status,'Закреплено на знакомых задачах');assert.equal(row.independent,0);assert.equal(row.recovered,2);assert.equal(row.mistakes,3);
});

test('help from another tab blocks a clean-repeat credit and new errors remain after replacing the session',()=>{
 const l=lessons.find(l=>l.id==='prob-count'),storage=memory(),a=State.create([l],storage);
 for(const t of l.tasks.slice(-3))a.data.seen[t.id]=1;a.persist();const own=a.start(l.id,'independent');
 const b=State.create([l],storage),remote=b.start(l.id,'independent');remote.assisted=true;remote.wrong=true;b.persist();
 own.answers=[String(l.tasks.find(t=>t.id===own.taskId).answer)];a.finish(l.id,'independent',own);
 assert.equal(a.record(l.id).recovered,undefined);assert.deepEqual(a.record(l.id).mistakes,[own.taskId]);
 a.start(l.id,'independent',true);assert.deepEqual(State.create([l],storage).record(l.id).mistakes,[own.taskId]);
});

test('absolute numeric tolerance rejects the eight known errors, boundaries and negatives while preserving exact expressions',()=>{
 const ids=['applied-formula-heat','applied-formula-heat-new','applied-loan-linear-total','applied-loan-linear-three','applied-loan-linear-total-new','applied-loan-linear-principal-new','applied-loan-equal-two','applied-loan-equal-two-new'];
 for(const id of ids){const t=lessons.flatMap(l=>l.tasks).find(t=>t.id===id);assert(t,id);assert(Check.check(t.answer,String(t.answer)));assert(!Check.check(t.answer,String(t.answer+0.01)),id);}
 for(const n of [99999,100000,100001,10000000,-99999,-100000,-100001,-10000000]){assert(Check.check(n,String(n)));assert(!Check.check(n,String(n+0.01)));assert(!Check.check(n,String(n+0.5)));}
 assert(Check.check(0.75,'3/4'));assert(Check.check(Math.sqrt(2),'sqrt(2)'));assert(Check.check(Math.PI/4,'π/4'));
});

test('full report roundtrip is read-only and includes legacy plus side stores without writing or losing fields',()=>{
 const l=lessons[0],course={version:1,records:{[l.id]:{guided:[],independent:[],attempts:1}},sessions:{[l.id+':guided']:{taskId:l.tasks[0].id,wrong:true}},seen:{}};
 const storage=memory([['mathexam.profileStart2027.v1',JSON.stringify(course)],['mathExamCourseProgress.v1','{"student":{"name":"Ada"},"mistakes":{"old":1}}'],['ep_progress_v1','{"old":"trig"}']]);
 const before=JSON.stringify([...storage.values]);storage.setItem=()=>{throw Error('Read-only report wrote storage');};
 const report=Report.validateFullReport(JSON.parse(JSON.stringify(Report.fullReport(null,[l],storage))));assert.equal(Report.profileRows(report)[0].mistakes,1);assert.equal(report.legacy.student.name,'Ada');assert.equal(report.side.ep_progress_v1.old,'trig');assert.equal(JSON.stringify([...storage.values]),before);
 assert.throws(()=>Report.validateFullReport({...report,version:2}));assert.throws(()=>Report.validateFullReport({...report,course:{version:1,records:null}}));
});
