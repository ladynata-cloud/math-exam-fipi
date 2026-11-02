'use strict';
const test=require('node:test'),assert=require('node:assert/strict');const fixture=require('./helpers/practice-fixture.cjs');
const {tokenHash}=require('../learning-auth');
const core=import('../../assistant-service/public/practice-core.js');
const route='/assistant/practice';
async function learner(f,index=0){let state=(await f.request(f.students[index],route)).body;return {get state(){return state;},async refresh(){state=(await f.request(f.students[index],route)).body;return state;},async act(action,fields={}){const r=await f.request(f.students[index],route,{action,version:state.version,...fields});if(r.status===200)state=r.body;return r;}};}
async function preview(f,fullSolution=false){const r=await f.request(f.teacher,f.base+'/preview',{skill:'linear-equations',level:1,count:3,policy:{fullSolution,allowedMethods:['balance']}});assert.equal(r.status,200,JSON.stringify(r.body));return r.body;}
test('practice defaults to memory; opt-in survives restart and erasure preserves ledgers',async t=>{
 const f=await fixture(t),p=await learner(f),math=await core;await p.act('new',{skill:'fractions',level:2});const first=p.state.task;
 assert.equal(f.api.store.row('SELECT count(*) AS n FROM assistant_practice_progress').n,0);await f.restart();await p.refresh();assert.equal(p.state.task,null);
 await p.act('resume',{enabled:true});await p.act('new',{skill:'fractions',level:2});const task=p.state.task,answer=math.generatePractice(task.descriptor).expected;
 await p.act('answer',{taskId:task.id,answer:'999999'});await p.act('answer',{taskId:task.id,answer});assert.equal(p.state.summary.withHelp,1);
 const raw=f.api.store.row('SELECT state_json FROM assistant_practice_progress').state_json;assert(!raw.includes('999999'));assert(!raw.includes('answer'));assert(!raw.includes(f.students[0].sessionToken));
 await f.restart();await p.refresh();assert.equal(p.state.task.id,task.id);assert.equal(p.state.task.solved,true);assert.equal(p.state.summary.withHelp,1);assert.deepEqual(p.state.summary.difficult,['fractions']);
 f.api.store.run('INSERT INTO learning_assistant_usage VALUES(?,?,?)',f.students[0].account.id,'2026-11-02',7);
 const ledger=f.api.store.rows('SELECT * FROM learning_assistant_usage');await p.act('erase');assert.equal(p.state.resumeEnabled,false);assert.equal(p.state.task,null);assert.equal(f.api.store.row('SELECT count(*) AS n FROM assistant_practice_progress').n,0);assert.deepEqual(f.api.store.rows('SELECT * FROM learning_assistant_usage'),ledger);
 await f.restart();await p.refresh();assert.equal(p.state.summary.checked,0);assert(first.id);
});
test('session, ownership, account fence, CSRF, disable and active assessment protect every practice route',async t=>{
 const f=await fixture(t),p=await learner(f);assert.equal((await f.request(null,route)).status,401);assert.equal((await f.request(f.teacher,route)).status,403);
 assert.equal((await f.request(f.students[0],f.base)).status,403);assert.equal((await f.request(f.students[0],route,{action:'new',version:p.state.version,skill:'arithmetic',level:1},{'X-CSRF-Token':'wrong'})).status,403);
 assert.equal((await f.request(f.students[0],route,undefined,{'X-Learning-Account':f.students[1].account.id})).status,409);
 assert.equal((await f.request(f.students[0],route,{action:'resume',version:p.state.version,enabled:true},{Origin:'https://other.example'})).status,403);
 const originalTeacher=f.teacher.account.id;f.api.store.run('UPDATE accounts SET teacher_id=id WHERE id=?',f.students[0].account.id);assert.equal((await f.request(f.teacher,f.base)).status,404);f.api.store.run('UPDATE accounts SET teacher_id=? WHERE id=?',originalTeacher,f.students[0].account.id);
 f.api.store.run('UPDATE learning_assistant_settings SET enabled=0 WHERE learner_id=?',f.students[0].account.id);assert.equal((await f.request(f.students[0],route)).status,403);assert.equal((await f.request(f.teacher,f.base+'/sandbox',{descriptor:{skill:'arithmetic',level:1,seed:1}})).status,403);
 f.api.store.run('UPDATE learning_assistant_settings SET enabled=1 WHERE learner_id=?',f.students[0].account.id);require('../learning-runs').initializeRuns(f.api.store);f.api.store.run("INSERT INTO learning_runs(id,learner_id,teacher_id,kind,questions_json,answers_json,started_at) VALUES('practice_exam',?,?,'exam','[]','[]',?)",f.students[0].account.id,originalTeacher,f.now());
 for(const action of ['new','resume','answer','help','solution','report','erase']){const r=await f.request(f.students[0],route,{action,version:p.state.version});assert.equal(r.body.error,'LEARNING_ASSISTANT_EXAM_ACTIVE');}
 assert.equal((await f.request(f.teacher,f.base+'/preview',{})).body.error,'LEARNING_ASSISTANT_EXAM_ACTIVE');
});
test('server grading rejects forged credit, stale versions and duplicate correct submissions',async t=>{
 const f=await fixture(t),p=await learner(f),math=await core;await p.act('new',{skill:'linear-equations',level:1});const task=p.state.task,version=p.state.version;
 assert.equal((await p.act('answer',{taskId:task.id,answer:'0',correct:true})).status,400);
 const body={action:'answer',version,taskId:task.id,answer:math.generatePractice(task.descriptor).expected};const results=await Promise.all([f.request(f.students[0],route,body),f.request(f.students[0],route,body)]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);await p.refresh();assert.equal(p.state.summary.independent,1);
 assert.equal((await p.act('answer',{taskId:task.id,answer:body.answer})).status,409);assert.equal(p.state.summary.checked,1);
 await p.act('new',{skill:'linear-equations',level:1});assert.equal((await p.act('answer',{taskId:task.id,answer:'1'})).status,409);
 const current=p.state.task;await p.act('help',{taskId:current.id,method:'balance'});await p.act('answer',{taskId:current.id,answer:math.generatePractice(current.descriptor).expected});assert.equal(p.state.summary.independent,1);assert.equal(p.state.summary.withHelp,1);assert.equal(p.state.levels['linear-equations'].level,1);
});
test('teacher preview, assignment, methods and solution policy are enforced by direct API',async t=>{
 const f=await fixture(t),p=await learner(f),pre=await preview(f);assert.equal(new Set(pre.tasks.map(t=>t.question)).size,3);assert.equal(f.api.store.row('SELECT count(*) AS n FROM assistant_practice_homework').n,0);
 const assigned=await f.request(f.teacher,f.base+'/assign',{previewId:pre.previewId});assert.equal(assigned.status,200);assert.equal((await f.request(f.teacher,f.base+'/assign',{previewId:pre.previewId})).body.duplicate,true);const id=assigned.body.id;
 assert.equal((await f.request(f.teacher,f.base.replace(f.students[0].account.id,f.students[1].account.id)+'/assign',{previewId:pre.previewId})).status,409);
 await p.act('homework',{homeworkId:id,index:0});const task=p.state.task;assert.deepEqual(task.methods.map(m=>m.id),['balance']);assert.equal(task.fullSolution,false);assert.equal('expected' in task,false);assert.equal('steps' in task,false);
 assert.equal((await p.act('solution',{taskId:task.id,method:'balance'})).status,403);assert.equal((await p.act('help',{taskId:task.id,method:'inverse'})).status,403);
 const h=await p.act('help',{taskId:task.id,method:'balance'});assert.equal(h.status,200);assert.equal(h.body.explanation.teacherNote,undefined);assert.equal(h.body.explanation.steps.length,1);
 const other=await learner(f,1);assert.equal((await other.act('homework',{homeworkId:id,index:0})).status,404);
 const payload=f.api.store.row('SELECT payload FROM assistant_practice_homework WHERE id=?',id).payload;for(let i=0;i<21;i++)f.api.store.run('INSERT INTO assistant_practice_homework VALUES(?,?,?,?,?,1)','revoked_'+i,f.teacher.account.id,f.students[0].account.id,payload,f.now()+i);assert.equal((await f.request(f.teacher,f.base)).body.assignments[0].id,id);
 await f.request(f.teacher,f.base+'/revoke',{id});assert.equal((await p.act('answer',{taskId:task.id,answer:'1'})).status,404);await p.refresh();assert.equal(p.state.task,null);
 const bad=await f.request(f.teacher,f.base+'/preview',{skill:'fractions',level:1,count:5,policy:{fullSolution:true,allowedMethods:['balance']}});assert.equal(bad.status,400);
});
test('sandbox writes no real tables; notes require explicit exact-version approval',async t=>{
 const f=await fixture(t),p=await learner(f),math=await core;const snap=f.snapshot();const sandbox=await f.request(f.teacher,f.base+'/sandbox',{descriptor:{skill:'fractions',level:1,seed:7},answer:'0'});assert.equal(sandbox.status,200);assert.deepEqual(f.snapshot(),snap);
 let note=(await f.request(f.teacher,f.base+'/note',{skill:'fractions',version:0,action:'draft',text:'Сначала одинаковые доли. <img src=x onerror=alert(1)>'})).body.note;assert.equal(note.approved,null);
 await p.act('new',{skill:'fractions',level:1});let task=p.state.task;let result=await p.act('solution',{taskId:task.id,method:task.methods[0].id});assert.equal(result.body.explanation.teacherNote,undefined);
 assert.equal((await f.request(f.teacher,f.base+'/note',{skill:'fractions',version:0,action:'approve'})).status,409);
 note=(await f.request(f.teacher,f.base+'/note',{skill:'fractions',version:note.version,action:'approve'})).body.note;result=await p.act('solution',{taskId:task.id,method:task.methods[0].id});assert.equal(result.body.explanation.teacherNote.text,note.approved);
 const old=note.approved;note=(await f.request(f.teacher,f.base+'/note',{skill:'fractions',version:note.version,action:'draft',text:'Новый ещё не утверждённый текст'})).body.note;assert.equal(note.approved,old);
 result=await p.act('solution',{taskId:task.id,method:task.methods[0].id});assert.equal(result.body.explanation.teacherNote.text,old);
 assert.equal((await f.request(f.students[0],f.base+'/note',{skill:'fractions',version:note.version,action:'approve'})).status,403);assert.equal(math.generatePractice(task.descriptor).kind,'number');
});
test('retained summaries reveal categories, while dispute queue contains no pupil identity or attempt',async t=>{
 const f=await fixture(t),p=await learner(f),math=await core;await p.act('resume',{enabled:true});
 for(let i=0;i<2;i++){await p.act('new',{skill:'arithmetic',level:2});const task=p.state.task,generated=math.generatePractice(task.descriptor);await p.act('answer',{taskId:task.id,answer:generated.wrong[0].value});await p.act('answer',{taskId:task.id,answer:generated.expected});}
 const teacher=(await f.request(f.teacher,f.base)).body;assert.equal(teacher.repeatedErrors[0].key,'arithmetic:sign');assert.equal(teacher.repeatedErrors[0].count,2);assert.equal(teacher.summary.withHelp,2);assert.equal('events' in teacher,false);
 const task=p.state.task;await p.act('report',{taskId:task.id,reason:'grading'});await p.act('report',{taskId:task.id,reason:'grading'});const rows=f.api.store.rows('SELECT * FROM assistant_practice_disputes');assert.equal(rows.length,1);assert.deepEqual(Object.keys(JSON.parse(rows[0].descriptor)).sort(),['level','seed','skill','version']);const raw=JSON.stringify(rows);for(const forbidden of [f.students[0].account.id,f.students[0].account.name,f.students[0].sessionToken])assert(!raw.includes(forbidden));
 assert.equal((await p.act('report',{taskId:task.id,reason:'grading',text:'raw learner text'})).status,400);
 await p.act('resume',{enabled:false});assert.equal((await f.request(f.teacher,f.base)).body.retained,false);assert.equal(f.api.store.rows('SELECT * FROM assistant_practice_disputes').length,1);
});
test('retention expiry removes generated state and queue but keeps teacher notes and usage',async t=>{
 const f=await fixture(t),p=await learner(f);await p.act('resume',{enabled:true});await p.act('new',{skill:'arithmetic',level:1});await p.act('report',{taskId:p.state.task.id,reason:'condition'});
 // Keep synthetic auth valid while moving beyond practice retention.
 f.setNow(f.now()+31*86400000);f.api.store.run('UPDATE sessions SET expires_at=?',f.now()+86400000);await p.refresh();assert.equal(p.state.resumeEnabled,false);assert.equal(p.state.task,null);assert.equal(f.api.store.row('SELECT count(*) AS n FROM assistant_practice_disputes').n,0);
});
test('disabled global integration exposes neither practice nor teacher tools',async t=>{const f=await fixture(t,{enabled:false});assert.equal((await f.request(f.students[0],route)).status,403);assert.equal((await f.request(f.teacher,f.base)).status,403);});
test('repeated assignment and revocation cannot grow retained homework beyond its finite cap',async t=>{
 const f=await fixture(t),pre=await preview(f);f.api.store.transaction(()=>{for(let i=0;i<1000;i++)f.api.store.run('INSERT INTO assistant_practice_homework VALUES(?,?,?,?,?,1)','retained_'+i,f.teacher.account.id,f.students[0].account.id,'{}',f.now());});
 const result=await f.request(f.teacher,f.base+'/assign',{previewId:pre.previewId});assert.equal(result.status,429);assert.equal(result.body.error,'LEARNING_ASSISTANT_PRACTICE_CAPACITY');assert.equal(f.api.store.row('SELECT count(*) AS n FROM assistant_practice_homework').n,1000);
});

test('own retained data can be erased while teaching is disabled or assessment active without bypassing math access',async t=>{
 const f=await fixture(t),p=await learner(f);await p.act('resume',{enabled:true});await p.act('new',{skill:'arithmetic',level:1});f.api.store.run('UPDATE learning_assistant_settings SET enabled=0 WHERE learner_id=?',f.students[0].account.id);
 assert.equal((await f.request(f.students[0],'/assistant')).body.practiceRetentionEnabled,true);assert.equal((await f.request(f.students[0],route)).status,403);
 assert.equal((await f.request(f.students[0],route+'/retention',{action:'erase'},{'X-CSRF-Token':'wrong'})).status,403);assert.equal((await f.request(f.teacher,route+'/retention',{action:'erase'})).status,403);
 assert.equal((await f.request(f.students[0],route+'/retention',{action:'erase'})).status,200);assert.equal(f.api.store.row('SELECT count(*) AS n FROM assistant_practice_progress').n,0);
 f.api.store.run('UPDATE learning_assistant_settings SET enabled=1 WHERE learner_id=?',f.students[0].account.id);await p.refresh();await p.act('resume',{enabled:true});require('../learning-runs').initializeRuns(f.api.store);f.api.store.run("INSERT INTO learning_runs(id,learner_id,teacher_id,kind,questions_json,answers_json,started_at) VALUES('privacy_exam',?,?,'exam','[]','[]',?)",f.students[0].account.id,f.teacher.account.id,f.now());
 assert.equal((await f.request(f.students[0],route)).status,409);assert.equal((await f.request(f.students[0],route+'/retention',{action:'erase'})).status,200);assert.equal(f.api.store.row('SELECT count(*) AS n FROM assistant_practice_progress').n,0);
});

test('daily reads cannot resurrect pre-consent memory after persistent progress expires',async t=>{
 const f=await fixture(t),p=await learner(f),math=await core;await p.act('new',{skill:'arithmetic',level:1});await p.act('answer',{taskId:p.state.task.id,answer:math.generatePractice(p.state.task.descriptor).expected});assert.equal(p.state.summary.independent,1);await p.act('resume',{enabled:true});const start=f.now();
 for(let day=1;day<=31;day++){f.setNow(start+day*86400000);f.api.store.run('UPDATE sessions SET expires_at=?',f.now()+86400000);await p.refresh();}
 assert.equal(p.state.resumeEnabled,false);assert.equal(p.state.task,null);assert.equal(p.state.summary.checked,0);
});
