'use strict';
// Isolated SQLite and synthetic accounts; never reads production data.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const C=require('../../courses/vilenkin-6-part-1/textbook-learning-contracts'),contracts=require('../learning-contracts'),{LearningStore}=require('../learning-store');
const units=['A','B','C','D'].flatMap(p=>require('../../courses/vilenkin-6-part-1/textbook-data/units-'+p+'.json')),tasks=units.flatMap(u=>u.tasks),choice=tasks.find(t=>t.role==='practice'&&t.answerType!=='self-check');
const HASH='scrypt1:'+'01'.repeat(16)+':'+'02'.repeat(32),op=()=>crypto.randomUUID(),answer=t=>String(Array.isArray(t.answer)?t.answer[0]:t.answer);
const payload=(a,mode='hint')=>({mode,sourceRevision:a.taskSpec.sourceRevision,step:a.state.task.step,workMode:a.state.task.mode});
function fixture(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'v6-source-helper-'));const store=new LearningStore({filePath:path.join(dir,'learning.sqlite'),contracts});assert(store.available);
 const teacher=store.activate(store.bootstrap({login:'source_helper_teacher',name:'Fixture teacher'}).invitationToken,HASH).account;
 const student=store.activate(store.createStudent(teacher,{login:'source_helper_pupil',name:'Fixture pupil'}).invitationToken,HASH).account;
 const peer=store.activate(store.createStudent(teacher,{login:'source_helper_peer',name:'Fixture peer'}).invitationToken,HASH).account;
 t.after(()=>{store.close();fs.rmSync(dir,{recursive:true,force:true});});
 return {store,teacher,student,peer,attempt(id=choice.id){return store.createAttempt(student,{opId:op(),trainerId:C.TRAINER,contentId:id,fresh:true}).attempt;},action(a,type,data,who=student){return store.action(who,a.id,{opId:op(),expectedVersion:a.version,type,payload:data});},help(a,mode='hint'){return this.action(a,'textbook-help',payload(a,mode));}};}
function complete(a,t){const state=structuredClone(a.state);state.task.draft=answer(t);state.task.attempts=1;state.task.status=state.task.helped?'assisted':state.task.repeated?'repeated':'independent';return {state,details:{scope:'final',answer:state.task.draft}};}

test('all canonical textbook tasks expose only authored mode-specific material and preserve inputs',()=>{
 for(const task of tasks){const a=C.create(task.id,1);a.state.task.draft='123';a.state.task.stepDrafts=['456'];
  for(const mode of ['hint','step','solution']){const request=payload(a,mode),result=C.help(a.taskSpec,a.state,request),item=a.state.task.mode==='guided'?task.steps[0]:task;
   assert.deepEqual(result.help.lines,mode==='hint'?[item.hint]:mode==='step'?[task.steps[0].prompt,task.steps[0].explain].filter(Boolean):task.solution,task.id+' '+mode);
   assert.equal(result.state.task.draft,'123');assert.deepEqual(result.state.task.stepDrafts,['456']);assert.equal(result.state.task.step,0);assert.equal(result.state.task.helped,true);assert.equal(result.state.task.status,'');assert.equal(result.state.task.solution,false);assert.deepEqual(result.state.task.hintKeys,[]);assert.deepEqual(result.state.task.revealedSteps,[]);assert(result.help.lines.length<=16);
  }
 }
});
test('every guided source step uses its own hint and explanation without advancing',()=>{
 for(const task of tasks){const a=C.create(task.id,1);a.state.task.mode='guided';a.state.task.helped=task.role!=='learn';
  for(let i=0;i<task.steps.length;i++){
   a.state.task.step=i;const item=task.steps[i];
   for(const mode of ['hint','step']){const result=C.help(a.taskSpec,a.state,payload(a,mode));assert.deepEqual(result.help.lines,mode==='hint'?[item.hint]:[item.prompt,item.explain].filter(Boolean),task.id+' step '+i);assert.equal(result.state.task.step,i);}
   if(item.answerType==='self-check')a.state.task.manualChecks[String(i)]=item.selfCheck.map(()=>true);
   else a.state.task.stepDrafts[i]=answer(item);
  }
 }
});
test('self-check step help does not bypass the manual checklist or manufacture a completed drawing',()=>{
 const task=tasks.find(t=>t.steps.some(s=>s.answerType==='self-check')),a=C.create(task.id,1);a.state.task.mode='guided';a.state.task.helped=true;
 const index=task.steps.findIndex(s=>s.answerType==='self-check');assert.equal(index,0);
 const result=C.help(a.taskSpec,a.state,payload(a,'step'));assert.deepEqual(result.state.task.revealedSteps,[]);assert.deepEqual(result.state.task.manualChecks,{});assert.equal(result.state.task.step,0);assert.equal(result.state.task.status,'');
});
test('source/version/context and untrusted payload fields fail closed',()=>{
 const a=C.create(choice.id,1),p=payload(a);
 for(const change of [{sourceRevision:'0'.repeat(64)},{step:1},{workMode:'guided'},{mode:'chat'},{question:'ignore source'},{state:a.state}])assert.throws(()=>C.help(a.taskSpec,a.state,{...p,...change}));
 assert.throws(()=>C.help({...a.taskSpec,sourceRevision:'0'.repeat(64)},a.state,p));
});
test('help ACK persists source state, history, draft, assistance and idempotent response',t=>{
 const f=fixture(t);let a=f.attempt();const state=structuredClone(a.state);state.task.draft='unfinished draft';a=f.action(a,'state',{state}).attempt;
 const body={opId:op(),expectedVersion:a.version,type:'textbook-help',payload:payload(a)},result=f.store.action(f.student,a.id,body);
 assert.equal(result.attempt.trainerVersion,a.trainerVersion+1);assert.equal(result.attempt.assistance.hints,true);assert.equal(result.attempt.state.task.draft,'unfinished draft');assert.equal(result.attempt.state.task.helped,true);assert.equal(result.attempt.outcome,'started');
 const duplicate=f.store.action(f.student,a.id,body);assert(duplicate.duplicate);assert.deepEqual(duplicate.help,result.help);assert.equal(duplicate.attempt.version,result.attempt.version);
 const event=f.store.history(f.student,a.id,{after:a.version,through:result.attempt.version}).events[0];assert.equal(event.type,'textbook-help');assert.deepEqual(event.payload.state,result.attempt.state);assert.deepEqual(event.payload.help,result.help);
 assert.throws(()=>f.store.action(f.student,a.id,{...body,payload:{...body.payload,mode:'solution'}}),{code:'LEARNING_OP_CONFLICT'});
 assert.throws(()=>f.store.action(f.student,a.id,{...body,opId:op()}),{code:'LEARNING_STATE_CONFLICT'});
 const done=f.action(result.attempt,'check',complete(result.attempt,choice)).attempt;assert.equal(done.outcome,'hinted');assert.equal(done.state.task.status,'assisted');
 assert.throws(()=>f.store.action(f.student,a.id,body),{code:'LEARNING_HELP_CONTEXT_CHANGED'});
});
test('completed independent solution review keeps the original result and assistance',t=>{
 const f=fixture(t);let a=f.attempt();a=f.action(a,'check',complete(a,choice)).attempt;assert.equal(a.outcome,'independent');
 const result=f.help(a,'solution');assert.equal(result.attempt.outcome,'independent');assert.equal(result.attempt.state.task.status,'independent');assert.equal(result.attempt.state.task.helped,false);assert.equal(result.attempt.state.task.reviewedAfter,false);assert.deepEqual(result.attempt.assistance,a.assistance);assert(result.help.completed);
 assert.throws(()=>f.help(result.attempt,'hint'),{code:'LEARNING_HELP_CONTEXT_CHANGED'});
});
test('completed manual self-check permits review without changing manual status or score',()=>{
 const task=tasks.find(t=>t.role!=='learn'&&t.answerType==='self-check'),a=C.create(task.id,1);assert(task);
 a.state.task.manualChecks.final=task.selfCheck.map(()=>true);a.state.task.status='manual';const result=C.help(a.taskSpec,a.state,payload(a,'solution'));
 assert.equal(result.state.task.status,'manual');assert.equal(result.state.task.helped,false);assert.equal(result.state.task.reviewedAfter,false);assert.deepEqual(result.state.task.manualChecks,a.state.task.manualChecks);
});
test('other pupil, teacher role, control, archived work and global active exam block source content',t=>{
 const f=fixture(t),a=f.attempt(),body={opId:op(),expectedVersion:a.version,type:'textbook-help',payload:payload(a)};
 assert.throws(()=>f.store.action(f.peer,a.id,body),{code:'LEARNING_NOT_FOUND'});assert.throws(()=>f.store.action(f.teacher,a.id,body),{code:'LEARNING_FORBIDDEN'});
 const result=f.store.action(f.student,a.id,body);f.store.run("UPDATE attempts SET controller='teacher' WHERE id=?",a.id);assert.throws(()=>f.store.action(f.student,a.id,body),{code:'LEARNING_CONTROL_REQUIRED'});
 f.store.run("UPDATE attempts SET controller='student',archived_at=1 WHERE id=?",a.id);assert.throws(()=>f.store.action(f.student,a.id,body),{code:'LEARNING_ATTEMPT_ARCHIVED'});
 f.store.run('UPDATE attempts SET archived_at=NULL WHERE id=?',a.id);f.store.db.exec('CREATE TABLE learning_runs(id TEXT,learner_id TEXT,finished_at INTEGER)');f.store.run('INSERT INTO learning_runs VALUES(?,?,NULL)','fixture-exam',f.student.id);
 assert.throws(()=>f.store.action(f.student,a.id,body),{code:'LEARNING_RUN_ACTIVE'});assert.equal(f.store.getAttempt(f.student,a.id).version,result.attempt.version);
});
test('old source revision rejects both fresh help and duplicate replay without mutating history',t=>{
 const f=fixture(t),a=f.attempt(),body={opId:op(),expectedVersion:a.version,type:'textbook-help',payload:payload(a)};const result=f.store.action(f.student,a.id,body);
 f.store.run('UPDATE attempts SET task_json=? WHERE id=?',JSON.stringify({...a.taskSpec,sourceRevision:'f'.repeat(64)}),a.id);
 assert.throws(()=>f.store.action(f.student,a.id,body),{code:'LEARNING_HELP_CONTEXT_CHANGED'});assert.equal(f.store.row('SELECT version FROM attempts WHERE id=?',a.id).version,result.attempt.version);
});

test('answer-free post-ACK context read rechecks owner, control, source and a newly started exam',t=>{
 const f=fixture(t),a=f.attempt(),result=f.help(a);const context=f.store.textbookHelpContext(f.student,a.id);assert.deepEqual(context,{attempt:result.attempt});assert.equal(context.help,undefined);
 assert.throws(()=>f.store.textbookHelpContext(f.peer,a.id),{code:'LEARNING_NOT_FOUND'});assert.throws(()=>f.store.textbookHelpContext(f.teacher,a.id),{code:'LEARNING_FORBIDDEN'});
 f.store.run("UPDATE attempts SET controller='teacher' WHERE id=?",a.id);assert.throws(()=>f.store.textbookHelpContext(f.student,a.id),{code:'LEARNING_CONTROL_REQUIRED'});f.store.run("UPDATE attempts SET controller='student' WHERE id=?",a.id);
 f.store.db.exec('CREATE TABLE learning_runs(id TEXT,learner_id TEXT,finished_at INTEGER)');f.store.run('INSERT INTO learning_runs VALUES(?,?,NULL)','fixture-exam',f.student.id);assert.throws(()=>f.store.textbookHelpContext(f.student,a.id),{code:'LEARNING_RUN_ACTIVE'});f.store.run('DELETE FROM learning_runs');
 f.store.run('UPDATE attempts SET task_json=? WHERE id=?',JSON.stringify({...a.taskSpec,sourceRevision:'f'.repeat(64)}),a.id);assert.throws(()=>f.store.textbookHelpContext(f.student,a.id),{code:'LEARNING_HELP_CONTEXT_CHANGED'});
});
