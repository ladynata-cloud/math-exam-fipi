'use strict';
// Synthetic identities only; no production account or credentials.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const C=require('../../courses/vilenkin-6-part-1/textbook-learning-contracts');
const catalog=require('../../learning/catalog'),manifest=require('../../learning/vilenkin6-textbook-catalog'),contracts=require('../learning-contracts'),{LearningStore}=require('../learning-store');
const {getRewards}=require('../learning-rewards');
const units=['A','B','C','D'].flatMap(part=>require('../../courses/vilenkin-6-part-1/textbook-data/units-'+part+'.json'));
const tasks=new Map(units.flatMap(unit=>unit.tasks.map(task=>[task.id,task]))),copy=structuredClone,op=()=>crypto.randomUUID();
const HASH='scrypt1:'+'01'.repeat(16)+':'+'02'.repeat(32),answerOf=answer=>String(Array.isArray(answer)?answer[0]:answer);
const choice=[...tasks.values()].find(task=>task.role==='practice'&&task.answerType!=='self-check');
function resultStatus(task,p,manual){return manual?'manual':task.role==='learn'?'learned':p.helped||p.mode==='guided'?'assisted':p.repeated?'repeated':'independent';}
function final(spec,before,raw){const task=tasks.get(spec.contentId),state=copy(before),p=state.task,answer=raw??answerOf(task.answer);p.draft=answer;p.attempts++;if(require('../../courses/vilenkin-6-part-1/textbook-math').check(answer,task.answer,task.answerType||'number').ok)p.status=resultStatus(task,p,false);else p.wrongCounts.final=(p.wrongCounts.final||0)+1;return {state,details:{scope:'final',answer}};}
function step(spec,before,index){const task=tasks.get(spec.contentId),item=task.steps[index],state=copy(before),p=state.task;p.mode='guided';if(task.role!=='learn')p.helped=true;p.step=index+1;while(p.stepDrafts.length<index)p.stepDrafts.push('');
  if(item.answerType==='self-check')p.manualChecks[String(index)]=(item.selfCheck||[]).map(()=>true);else{p.stepDrafts[index]=answerOf(item.answer);p.attempts++;}
  if(p.step===task.steps.length)p.status=resultStatus(task,p,task.answerType==='self-check'||item.answerType==='self-check');
  return {state,details:item.answerType==='self-check'?{scope:'manual'}:{scope:'step',step:index,answer:p.stepDrafts[index]}};
}
function fixture(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'v6-textbook-cloud-')),filePath=path.join(dir,'learning.sqlite');let store=new LearningStore({filePath,contracts});assert.equal(store.available,true);
  const teacher=store.activate(store.bootstrap({login:'book_fixture_teacher',name:'Fixture teacher'}).invitationToken,HASH).account;
  const student=store.activate(store.createStudent(teacher,{login:'book_fixture_pupil',name:'Fixture pupil'}).invitationToken,HASH).account;
  const peer=store.activate(store.createStudent(teacher,{login:'book_fixture_peer',name:'Fixture peer'}).invitationToken,HASH).account;
  t.after(()=>{store.close();fs.rmSync(dir,{recursive:true,force:true});});
  return {teacher,student,peer,get store(){return store;},reopen(){store.close();store=new LearningStore({filePath,contracts});assert.equal(store.available,true);},
    attempt(contentId=choice.id,who=student){return store.createAttempt(who,{opId:op(),trainerId:C.TRAINER,contentId,fresh:true}).attempt;},
    action(a,type,payload,who=student){return store.action(who,a.id,{opId:op(),expectedVersion:a.version,type,payload});},finish(a){return this.action(a,'check',final(a.taskSpec,a.state)).attempt;}};
}
test('all 378 prior catalog rows preserve their exact base content and order',()=>{
  const prior=catalog.items.filter(item=>item.trainerId!=='vilenkin6-textbook');
  assert.equal(prior.length,378);
  // Independently compared with main 6fb959fc before adding this source course.
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(prior)).digest('hex'),'86c3504c2d170b3afb208b96c4dc0a0fa689290fe646935683ab8c29691bf439');
});
test('all revised textbook tasks have separate exact cloud identities; legacy 27 modules survive',()=>{
  const items=catalog.items.filter(row=>row.trainerId===C.TRAINER);assert.equal(items.length,tasks.size);assert(items.length>=192);assert.deepEqual(items,manifest);assert.equal(catalog.items.filter(row=>row.trainerId==='vilenkin6-part1').length,27);
  for(const item of items){const generated=contracts.create(C.TRAINER,item.contentId,13);assert.equal(generated.taskSpec.sourceRevision,item.sourceRevision);assert.equal(generated.taskSpec.unitId,item.unitId);assert.deepEqual(C.normalize(generated.taskSpec,generated.state),generated.state);assert.equal(C.questionIdentity(generated.taskSpec),C.questionIdentity(C.create(item.contentId,999).taskSpec));assert(item.trainingOnly&&item.grade6);}
  assert.throws(()=>contracts.create(C.TRAINER,'lesson-1'),{code:'LEARNING_TRAINER_UNKNOWN'});
  assert.throws(()=>contracts.create('vilenkin6-part1',choice.id),{code:'LEARNING_TRAINER_UNKNOWN'});
  for(let n=1;n<=21;n++)assert(contracts.examPool(n).every(item=>item.trainerId!==C.TRAINER));
});
test('all source answers and authored steps evaluated by server; drawings never auto-graded',()=>{
  let finals=0,steps=0,manual=0;
  for(const task of tasks.values()){
    let {taskSpec:spec,state}=C.create(task.id,1);
    if(task.role!=='learn'&&task.answerType!=='self-check'){const payload=final(spec,state);assert.equal(C.evaluate(spec,payload.details,C.normalize(spec,payload.state,state)).correct,true);finals++;}
    for(let i=0;i<task.steps.length;i++){const payload=step(spec,state,i);state=C.normalize(spec,payload.state,state);const result=C.evaluate(spec,payload.details,state);if(payload.details.scope==='manual'){assert.equal(result.correct,false);assert.equal(result.complete,false);manual++;}else{assert.equal(result.correct,true,task.id+' step '+i);assert.equal(result.complete,i===task.steps.length-1&&task.answerType!=='self-check');}steps++;}
  }
  assert(finals>100);assert(steps>600);assert(manual>0);
});
test('malformed fields, other source revision, foreign route and fabricated results fail closed',()=>{
  const {taskSpec:spec,state}=C.create(choice.id,1),valid=final(spec,state);
  const mutations=[s=>s.contentId='foreign',s=>s.seed++,s=>s.route='#unit/0',s=>s.task.step=999,s=>s.task.mode='bad',s=>s.task.draft=12,s=>s.task.ruleOpen='yes',s=>s.task.unlisted=true,s=>s.task.status='independent',s=>s.task.reviewedAfter=true,s=>s.task.wrongCounts.foreign=1,s=>s.task.wrongCounts.final=-1,s=>s.task.hintKeys=['final'],s=>s.task.feedback.final={kind:'correct'},s=>s.task.manualChecks.final=[true]];
  for(const mutate of mutations){const bad=copy(state);mutate(bad);assert.throws(()=>C.normalize(spec,bad));}
  assert.throws(()=>C.normalize({...spec,sourceRevision:'0'.repeat(64)},state));assert.throws(()=>C.normalize({...spec,unitId:999},state));
  const fake=copy(valid.state);fake.task.draft='999999999999';assert.throws(()=>C.normalize(spec,fake));
  assert.throws(()=>C.evaluate(spec,{...valid.details,answer:'999999999999'},valid.state));
  const wrong=final(spec,state,'999999999999');assert.deepEqual(C.evaluate(spec,wrong.details,wrong.state),{correct:false,complete:false,assisted:false});
});
test('assistance, wrong attempts and accepted steps cannot be erased; post-result review preserves grading',()=>{
  const {taskSpec:spec,state}=C.create(choice.id,1);const helped=copy(state);helped.task.helped=true;helped.task.hintKeys=['final'];helped.task.wrongCounts.final=2;helped.task.attempts=2;
  for(const change of [s=>s.task.helped=false,s=>s.task.hintKeys=[],s=>s.task.wrongCounts={},s=>s.task.attempts=1]){const bad=copy(helped);change(bad);assert.throws(()=>C.normalize(spec,bad,helped));}
  const done=final(spec,state).state,review=copy(done);review.task.reviewedAfter=true;assert.deepEqual(C.normalize(spec,review,done),review);assert.equal(C.evaluate(spec,{scope:'final',answer:review.task.draft},review).assisted,false);
  const unfinished=copy(state);unfinished.task.reviewedAfter=true;assert.throws(()=>C.normalize(spec,unfinished));
  const first=step(spec,state,0).state,bad=copy(first);bad.task.step=0;assert.throws(()=>C.normalize(spec,bad,first));
  const changed=copy(first);changed.task.stepDrafts[0]='different';assert.throws(()=>C.normalize(spec,changed,first));
});
test('shown steps remain assisted and ungraded self-check persists honestly',()=>{
  const task=[...tasks.values()].find(t=>t.role==='learn'&&t.answerType!=='self-check'),{taskSpec:spec,state}=C.create(task.id,3);let s=copy(state);
  for(let i=0;i<task.steps.length;i++){const old=copy(s);s.task.helped=true;s.task.revealedSteps.push(i);s.task.step++;if(s.task.step===task.steps.length)s.task.status='learned';s=C.normalize(spec,s,old);const result=C.evaluate(spec,{scope:'guided'},s);assert.equal(result.correct,true);assert.equal(result.complete,i===task.steps.length-1);assert(result.assisted);}
  const drawing=[...tasks.values()].find(t=>t.role!=='learn'&&t.answerType==='self-check'),d=C.create(drawing.id,2);d.state.task.manualChecks.final=drawing.selfCheck.map(()=>true);d.state.task.status='manual';const n=C.normalize(d.taskSpec,d.state);assert.deepEqual(C.evaluate(d.taskSpec,{scope:'manual'},n),{correct:false,complete:false,assisted:true,manual:true});
});
test('SQLite restart, same-task resume and ownership isolation preserve exact task work',t=>{
  const f=fixture(t);let a=f.attempt(),state=copy(a.state);state.task.draft='2/';a=f.action(a,'state',{state}).attempt;
  f.reopen();assert.deepEqual(f.store.getAttempt(f.student,a.id).state,state);assert.deepEqual(f.store.getAttempt(f.teacher,a.id).state,state);assert.throws(()=>f.store.getAttempt(f.peer,a.id),{code:'LEARNING_NOT_FOUND'});assert.throws(()=>f.action(a,'state',{state},f.peer),{code:'LEARNING_NOT_FOUND'});
  assert.equal(f.store.createAttempt(f.student,{opId:op(),trainerId:C.TRAINER,contentId:choice.id}).attempt.id,a.id);assert.equal(f.store.progress(f.student).find(p=>p.trainerId===C.TRAINER).latest.id,a.id);
});
test('controller, version and operation guards protect new task attempts',t=>{
  const f=fixture(t);let a=f.attempt(),old=copy(a);a=f.action(a,'control',{controller:'teacher'},f.teacher).attempt;
  assert.throws(()=>f.action(a,'state',{state:a.state}),{code:'LEARNING_CONTROL_REQUIRED'});
  const payload=final(a.taskSpec,a.state),request={opId:op(),expectedVersion:a.version,type:'check',payload};const response=f.store.action(f.teacher,a.id,request);assert.equal(response.attempt.outcome,'together');assert.equal(f.store.action(f.teacher,a.id,request).duplicate,true);assert.throws(()=>f.store.action(f.teacher,a.id,{...request,opId:op(),expectedVersion:old.version}),{code:'LEARNING_STATE_CONFLICT'});
});
test('repeating the finite textbook task is practiced, not a fresh independent question',t=>{
  const f=fixture(t),first=f.finish(f.attempt());assert.equal(first.outcome,'independent');let repeat=f.attempt();assert.equal(repeat.state.task.repeated,true);repeat=f.finish(repeat);assert.equal(repeat.outcome,'practiced');
  const rewards=getRewards(f.store,f.student);assert.equal(rewards.uniqueCompleted,1);
});
test('repeat creates another attempt without resetting accepted answers or erasing assistance',t=>{
  const f=fixture(t);let first=f.attempt(),helped=copy(first.state);helped.task.helped=true;helped.task.hintKeys=['final'];helped.task.solution=true;helped.task.wrongCounts.final=2;helped.task.attempts=2;
  first=f.action(first,'state',{state:helped}).attempt;first=f.finish(first);assert.equal(first.outcome,'hinted');
  const saved=copy(first),reset=C.create(choice.id,first.taskSpec.seed).state;reset.task.repeated=true;reset.task.attempts=first.state.task.attempts;
  assert.throws(()=>f.action(first,'state',{state:reset}));assert.deepEqual(f.store.getAttempt(f.student,first.id),saved);
  let repeat=f.store.createAttempt(f.student,{opId:op(),trainerId:C.TRAINER,contentId:choice.id,fresh:true,sourceAttemptId:first.id}).attempt;
  assert.notEqual(repeat.id,first.id);assert.equal(repeat.sourceAttemptId,first.id);assert.equal(repeat.state.task.repeated,true);assert.equal(repeat.taskSpec.sourceRevision,first.taskSpec.sourceRevision);assert.equal(C.questionIdentity(repeat.taskSpec),C.questionIdentity(first.taskSpec));
  repeat=f.finish(repeat);assert.equal(repeat.outcome,'practiced');assert.deepEqual(f.store.getAttempt(f.student,first.id),saved);
  const foreign=C.create([...tasks.keys()].find(id=>id!==choice.id),repeat.taskSpec.seed);
  assert.throws(()=>f.action(repeat,'state',{state:foreign.state}));assert.equal(f.store.getAttempt(f.student,repeat.id).taskSpec.contentId,choice.id);
});
test('a second tab exposing the same source keeps the completed task label consistent with the server',t=>{
  const f=fixture(t),first=f.attempt();assert.equal(first.state.task.repeated,false);const second=f.attempt();assert.equal(second.state.task.repeated,true);
  const done=f.finish(first);assert.equal(done.outcome,'practiced');assert.equal(done.state.task.repeated,true);assert.equal(done.state.task.status,'repeated');assert.deepEqual(C.normalize(done.taskSpec,done.state),done.state);
  const review=copy(done.state);review.task.reviewedAfter=true;assert.equal(f.action(done,'state',{state:review}).attempt.outcome,'practiced');
});
test('historical source revisions preserve rewards and allow a new current attempt without changing old work',t=>{
  const f=fixture(t),first=f.finish(f.attempt()),historical={...first.taskSpec,sourceRevision:'f'.repeat(64)};
  f.store.run('UPDATE attempts SET task_json=? WHERE id=?',JSON.stringify(historical),first.id);
  const saved=f.store.row('SELECT * FROM attempts WHERE id=?',first.id);
  assert.throws(()=>C.normalize(historical,first.state));assert.throws(()=>C.evaluate(historical,{scope:'final',answer:first.state.task.draft},first.state));
  assert.equal(C.questionIdentity(historical),C.questionIdentity(first.taskSpec));assert.equal(getRewards(f.store,f.student).uniqueCompleted,1);
  let current=f.store.createAttempt(f.student,{opId:op(),trainerId:C.TRAINER,contentId:choice.id,fresh:true,sourceAttemptId:first.id}).attempt;
  assert.equal(current.taskSpec.sourceRevision,first.taskSpec.sourceRevision);assert.equal(current.state.task.repeated,true);current=f.finish(current);assert.equal(current.outcome,'practiced');assert.equal(getRewards(f.store,f.student).uniqueCompleted,1);
  assert.deepEqual(f.store.row('SELECT * FROM attempts WHERE id=?',first.id),saved);
  f.reopen();assert.equal(getRewards(f.store,f.student).uniqueCompleted,1);assert.deepEqual(f.store.row('SELECT * FROM attempts WHERE id=?',first.id),saved);
});
test('a retired source task remains valid reward history without entering the current catalog',t=>{
  const f=fixture(t),first=f.finish(f.attempt()),retiredId='v6-book-retired-source',historical={...first.taskSpec,id:retiredId,contentId:retiredId,unitId:999,sourceRevision:'e'.repeat(64)},state=copy(first.state);
  state.contentId=retiredId;state.route=C.routeOf(historical);f.store.run('UPDATE attempts SET task_json=?,state_json=? WHERE id=?',JSON.stringify(historical),JSON.stringify(state),first.id);
  const saved=f.store.row('SELECT * FROM attempts WHERE id=?',first.id);
  assert.throws(()=>C.create(retiredId));assert.throws(()=>C.normalize(historical,state));assert.equal(getRewards(f.store,f.student).uniqueCompleted,1);
  assert.equal(f.attempt().taskSpec.contentId,choice.id);assert.deepEqual(f.store.row('SELECT * FROM attempts WHERE id=?',first.id),saved);
  assert.throws(()=>C.questionIdentity({...historical,contentId:'../foreign'}));assert.throws(()=>C.questionIdentity({...historical,sourceRevision:'invalid'}));
});
test('sparse answer, hint and manual arrays fail before JSON serialization',()=>{
  const {taskSpec:spec,state}=C.create(choice.id,1);
  for(const field of ['stepDrafts','hintKeys','hiddenHints','revealedSteps']){const bad=copy(state);bad.task[field]=new Array(1);assert.throws(()=>C.normalize(spec,bad));}
  const task=[...tasks.values()].find(item=>item.role!=='learn'&&item.answerType==='self-check'),manual=C.create(task.id,1);
  manual.state.task.manualChecks.final=new Array(1);assert.throws(()=>C.normalize(manual.taskSpec,manual.state));
  manual.state.task.manualChecks.final=[false,true];assert.deepEqual(C.normalize(manual.taskSpec,manual.state).task.manualChecks.final,[false,true]);
});
test('legacy and revised attempts coexist without any identity or progress migration',t=>{
  const f=fixture(t),legacy=f.store.createAttempt(f.student,{opId:op(),trainerId:'vilenkin6-part1',contentId:'lesson-1'}).attempt;let current=f.attempt();current=f.finish(current);
  assert.deepEqual(f.store.getAttempt(f.student,legacy.id).state,legacy.state);const progress=f.store.progress(f.student);assert(progress.some(row=>row.trainerId==='vilenkin6-part1'));assert(progress.some(row=>row.trainerId===C.TRAINER));
});
