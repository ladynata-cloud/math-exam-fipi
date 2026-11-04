'use strict';
// Synthetic learners only. These checks never touch production credentials/data.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {DatabaseSync}=require('node:sqlite');
const C=require('../../courses/vilenkin-6-part-1/learning-contracts');
const catalog=require('../../learning/catalog'),contracts=require('../learning-contracts'),{LearningStore}=require('../learning-store');
const {getRewards}=require('../learning-rewards');
const lessons=[1,2,3,4,5].flatMap(n=>require('../../courses/vilenkin-6-part-1/data/lessons-'+n+'.json'));
const sourceBook=require('../../courses/vilenkin-6-part-1/data/textbook-index.json');
const BOOK=[...sourceBook.exercises,...sourceBook.checks],copy=structuredClone,op=()=>crypto.randomUUID();
const HASH='scrypt1:'+'01'.repeat(16)+':'+'02'.repeat(32);
const answerOf=answer=>String(Array.isArray(answer)?answer[0]:answer);
function lesson(spec){return lessons.find(l=>l.id===spec.lessonId);}
function checkpoint(spec,before,wrong=[]){
  const state=copy(before);state.route='#lesson/'+spec.lessonId+'/check';
  state.lesson.exam={n:5,answers:lesson(spec).tasks.slice(-5).map((task,index)=>({value:wrong.includes(index)?'999999999999':answerOf(task.answer),ok:!wrong.includes(index)})),draft:'',score:5-wrong.length,complete:true,aided:false};
  return {state,details:{scope:'checkpoint'}};
}
function practice(spec,before,index,raw){
  const state=copy(before),task=lesson(spec).tasks.slice(0,-5)[index],answer=raw??answerOf(task.answer),ok=C.correct(answer,task.answer);
  state.route='#lesson/'+spec.lessonId+'/practice/'+index;state.lesson.practice=index;
  const previous=state.lesson.tasks[task.id],attempts=(previous?.attempts||0)+1,help=previous?.help||0;
  state.lesson.tasks[task.id]={draft:answer,attempts,help,solved:ok,result:ok?(help?'assisted':attempts>1?'corrected':'independent'):null};
  return {state,details:{scope:'practice',taskId:task.id,answer}};
}
function fixture(t){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'vilenkin6-cloud-')),filePath=path.join(dir,'learning.sqlite');let store=new LearningStore({filePath,contracts});assert.equal(store.available,true);
  const teacher=store.activate(store.bootstrap({login:'v6_fixture_teacher',name:'Fixture teacher'}).invitationToken,HASH).account;
  const student=store.activate(store.createStudent(teacher,{login:'v6_fixture_pupil',name:'Fixture pupil'}).invitationToken,HASH).account;
  const peer=store.activate(store.createStudent(teacher,{login:'v6_fixture_peer',name:'Fixture peer'}).invitationToken,HASH).account;
  t.after(()=>{store.close();fs.rmSync(dir,{recursive:true,force:true});});
  return {filePath,teacher,student,peer,get store(){return store;},reopen(){store.close();store=new LearningStore({filePath,contracts});assert.equal(store.available,true);return store;},
    attempt(contentId='lesson-1',who=student){return store.createAttempt(who,{opId:op(),trainerId:C.TRAINER,contentId,fresh:true}).attempt;},
    action(attempt,type,payload,who=student){return store.action(who,attempt.id,{opId:op(),expectedVersion:attempt.version,type,payload});},
    finish(attempt,wrong=[],who=student){return this.action(attempt,'check',checkpoint(attempt.taskSpec,attempt.state,wrong),who).attempt;}
  };
}
test('all 27 published modules have canonical separate catalog identities and state',()=>{
  const items=catalog.items.filter(item=>item.trainerId===C.TRAINER);assert.equal(items.length,27);assert.equal(items.reduce((n,i)=>n+i.taskCount,0),475);
  for(const item of items){const generated=contracts.create(item.trainerId,item.contentId,19),l=lesson(generated.taskSpec);assert.equal(l.title,item.title);assert.equal(l.tasks.length,item.taskCount);assert.equal(item.position,null);assert(item.grade6&&item.trainingOnly);assert.deepEqual(C.normalize(generated.taskSpec,generated.state),generated.state);assert(fs.existsSync(path.resolve(__dirname,'../..',item.url.split('#')[0].slice(1))));assert.equal(C.questionIdentity(generated.taskSpec),C.questionIdentity(C.create(item.contentId,999).taskSpec));}
  assert.throws(()=>contracts.create(C.TRAINER,'lesson-999'),{code:'LEARNING_TRAINER_UNKNOWN'});
  for(let position=1;position<=21;position++)assert(contracts.examPool(position).every(item=>item.trainerId!==C.TRAINER));
});
test('every practice answer and every example step reaches authoritative server evaluation',()=>{
  let practiceCount=0,stepCount=0;
  for(const l of lessons){let {taskSpec:spec,state}=C.create('lesson-'+l.id,1);
    for(let i=0;i<l.tasks.length-5;i++){const payload=practice(spec,state,i);state=contracts.normalize(C.TRAINER,spec,payload.state);assert.deepEqual(contracts.evaluate(C.TRAINER,spec,payload.details,state),{correct:true,complete:false,assisted:false});practiceCount++;}
    for(const [index,example] of l.examples.entries()){
      state.route='#lesson/'+l.id+'/steps/'+index;state.lesson.example=index;
      state.lesson.examples[index]={n:0,rows:[],draft:'',help:false,revealed:false};
      for(const [step,item] of example.steps.entries()){const r=state.lesson.examples[index];r.n++;r.rows.push({help:false});const details={scope:'example',exampleIndex:index,step,answer:answerOf(item.answer)};
        assert.deepEqual(contracts.evaluate(C.TRAINER,spec,details,state),{correct:true,complete:false,assisted:true});stepCount++;}
    }
  }
  assert.equal(practiceCount,340);assert.equal(stepCount,266);
});
test('all 135 checkpoint answers validated; four correct with final wrong completes via aggregate only',()=>{
  for(const l of lessons){const {taskSpec:spec,state}=C.create('lesson-'+l.id,2),pool=l.tasks.slice(-5);let current=copy(state);current.route='#lesson/'+l.id+'/check';
    current.lesson.exam={n:0,answers:[],draft:'',score:null,complete:false,aided:false};
    for(let i=0;i<5;i++){const answer=answerOf(pool[i].answer),x=current.lesson.exam;x.n++;x.answers.push({value:answer,ok:true});x.complete=x.n===5;x.score=x.complete?5:null;
      assert.deepEqual(contracts.evaluate(C.TRAINER,spec,{scope:'exam',index:i,answer},current),{correct:true,complete:false,assisted:false});}
    assert.deepEqual(contracts.evaluate(C.TRAINER,spec,{scope:'checkpoint'},current),{correct:true,complete:true,assisted:false});
    const four=checkpoint(spec,state,[4]);assert.equal(C.evaluate(spec,{scope:'exam',index:4,answer:four.state.lesson.exam.answers[4].value},four.state).correct,false);assert.equal(C.evaluate(spec,four.details,four.state).correct,true);
    const three=checkpoint(spec,state,[3,4]);assert.deepEqual(C.evaluate(spec,three.details,three.state),{correct:false,complete:true,assisted:false});
  }
});
test('malformed/fabricated results, foreign notes/routes/spec and stale check details are rejected',()=>{
  const {taskSpec:spec,state}=C.create('lesson-1',4),solved=practice(spec,state,0),done=checkpoint(spec,state),number=BOOK.find(n=>n.lesson===1).number,foreign=BOOK.find(n=>n.lesson===2).number;
  const cases=[
    s=>{s.contentId='lesson-2';},s=>{s.seed++;},s=>{s.version=2;},s=>{s.unlisted=true;},s=>{s.route='#lesson/2/practice';},s=>{s.returnTo='#lesson/2/theory';},s=>{s.notes[foreign]={text:'foreign',done:false};},s=>{s.notes[number]={text:'x',done:'yes'};},s=>{s.help={open:true,multiplier:10,tableOpen:false};},s=>{s.lesson.lab.x=Infinity;},s=>{s.lesson.tasks['1-01']={draft:'999999999999',attempts:1,help:0,solved:true,result:'independent'};},s=>{s.lesson.exam=copy(done.state.lesson.exam);s.lesson.exam.answers[0].ok=false;},s=>{s.lesson.exam=copy(done.state.lesson.exam);s.lesson.exam.score=4;},s=>{s.book.filter='2';}
  ];for(const mutate of cases){const bad=copy(state);mutate(bad);assert.throws(()=>C.normalize(spec,bad));}
  for(const result of ['independent','corrected']){const bad=copy(solved.state),r=bad.lesson.tasks[solved.details.taskId];r.help=1;r.result=result;r.attempts=result==='corrected'?2:1;assert.throws(()=>C.normalize(spec,bad),/отметку помощи/);}
  const active=copy(done.state);active.lesson.exam.n=1;active.lesson.exam.answers.length=1;active.lesson.exam.complete=false;active.lesson.exam.score=null;active.route='#book';assert.throws(()=>C.normalize(spec,active),/отметку помощи/);active.lesson.exam.aided=true;assert.equal(C.normalize(spec,active).lesson.exam.aided,true);
  const badSpec={...spec,lessonId:2};assert.throws(()=>C.normalize(badSpec,state));
  assert.throws(()=>C.evaluate(spec,{...solved.details,answer:'99999'},solved.state));assert.throws(()=>C.evaluate(spec,{...solved.details,taskId:lesson(spec).tasks[1].id},solved.state));assert.throws(()=>C.evaluate(spec,{scope:'checkpoint'},state));
  const wrong=practice(spec,state,0,'999999999999');assert.deepEqual(C.evaluate(spec,wrong.details,wrong.state),{correct:false,complete:false,assisted:false});
});
test('UTF-8 budgets reject before replacement; module notes and model/help fields round-trip',()=>{
  const {taskSpec:spec,state}=C.create('lesson-1',1),numbers=BOOK.filter(n=>n.lesson===1).map(n=>n.number),copyBefore=JSON.stringify(state);
  const next=copy(state);next.notes[numbers[0]]={text:'Доля = 1/3; вопрос учителю.',done:true};next.help={open:true,multiplier:8,tableOpen:true};next.lesson.lab={a:3,b:'fraction'};next.returnTo='#lesson/1/practice/0';next.route='#book/'+encodeURIComponent(numbers[0]);next.book={query:numbers[0],page:0,filter:'1'};
  assert.deepEqual(C.normalize(spec,next),next);assert(C.assistance(spec,next));
  const tooLong=copy(next);tooLong.notes[numbers[0]].text='Я'.repeat(C.NOTE_LIMIT+1);assert.throws(()=>C.normalize(spec,tooLong));
  const tooBig=copy(next);for(const number of numbers.slice(0,5))tooBig.notes[number]={text:'Я'.repeat(4000),done:false};assert.throws(()=>C.normalize(spec,tooBig),/место для записей/);assert.equal(JSON.stringify(state),copyBefore);
});
test('drafts, notebook and accepted work survive SQLite restart; peers cannot read or write',t=>{
  const f=fixture(t);let a=f.attempt(),payload=practice(a.taskSpec,a.state,0);a=f.action(a,'check',payload).attempt;
  const state=copy(a.state),l=lesson(a.taskSpec),number=BOOK.find(n=>n.lesson===1).number;state.lesson.practice=1;state.route='#lesson/1/practice/1';state.lesson.tasks[l.tasks[1].id]={draft:'3/',attempts:0,help:0,solved:false,result:null};state.notes[number]={text:'Почему выбираем это целое?',done:false};
  a=f.action(a,'state',{state}).attempt;f.reopen();const restored=f.store.getAttempt(f.student,a.id);assert.deepEqual(restored.state,state);assert.equal(f.store.getAttempt(f.teacher,a.id).state.notes[number].text,state.notes[number].text);assert.throws(()=>f.store.getAttempt(f.peer,a.id),{code:'LEARNING_NOT_FOUND'});assert.throws(()=>f.action(a,'state',{state},f.peer),{code:'LEARNING_NOT_FOUND'});
  const resumed=f.store.createAttempt(f.student,{opId:op(),trainerId:C.TRAINER,contentId:a.contentId}).attempt;assert.equal(resumed.id,a.id);assert.equal(f.store.progress(f.student)[0].latest.id,a.id);
});
test('controller handoff, revision conflict and idempotency preserve latest shared state',t=>{
  const f=fixture(t);let a=f.attempt();const old=copy(a);a=f.action(a,'control',{controller:'teacher'},f.teacher).attempt;
  assert.throws(()=>f.action(a,'state',{state:a.state}),{code:'LEARNING_CONTROL_REQUIRED'});
  const payload=practice(a.taskSpec,a.state,0),request={opId:op(),expectedVersion:a.version,type:'check',payload};const response=f.store.action(f.teacher,a.id,request);assert(response.attempt.assistance.teacher);assert.equal(f.store.action(f.teacher,a.id,request).duplicate,true);assert.throws(()=>f.store.action(f.teacher,a.id,{...request,opId:op(),expectedVersion:old.version}),{code:'LEARNING_STATE_CONFLICT'});
  a=f.action(response.attempt,'control',{controller:'student'},f.teacher).attempt;a=f.finish(a);assert.equal(a.outcome,'together');
});
test('server transitions retain prior assistance, accepted steps and the first checkpoint answers',t=>{
  const f=fixture(t);let a=f.attempt();const task=lesson(a.taskSpec).tasks[0];
  let state=copy(a.state);state.lesson.tasks[task.id]={draft:'',attempts:0,help:1,solved:false,result:null};a=f.action(a,'hint',{state}).attempt;
  state=copy(a.state);state.lesson.tasks[task.id].help=0;assert.throws(()=>f.action(a,'state',{state}),{code:'LEARNING_STATE_INVALID'});
  state=copy(a.state);delete state.lesson.tasks[task.id];assert.throws(()=>f.action(a,'state',{state}),{code:'LEARNING_STATE_INVALID'});
  state=copy(a.state);state.route='#lesson/1/steps';state.lesson.examples[0]={n:0,rows:[],draft:'',help:true,revealed:true};a=f.action(a,'hint',{state}).attempt;
  state=copy(a.state);state.lesson.examples[0]={n:1,rows:[{help:false}],draft:'',help:false,revealed:false};assert.throws(()=>f.action(a,'state',{state}),{code:'LEARNING_STATE_INVALID'});
  state.lesson.examples[0].rows[0].help=true;a=f.action(a,'state',{state}).attempt;
  state=copy(a.state);state.route='#lesson/1/check';state.lesson.exam={n:1,answers:[{value:answerOf(lesson(a.taskSpec).tasks.slice(-5)[0].answer),ok:true}],draft:'',score:null,complete:false,aided:true};a=f.action(a,'state',{state}).attempt;
  state=copy(a.state);state.lesson.exam.aided=false;assert.throws(()=>f.action(a,'state',{state}),{code:'LEARNING_STATE_INVALID'});
  state=copy(a.state);state.lesson.exam.answers[0]={value:'999999999999',ok:false};assert.throws(()=>f.action(a,'state',{state}),{code:'LEARNING_STATE_INVALID'});
  state=copy(a.state);state.lesson.exam=null;assert.throws(()=>f.action(a,'state',{state}),{code:'LEARNING_STATE_INVALID'});
  assert.deepEqual(f.store.getAttempt(f.student,a.id).state,a.state);
});
test('checkpoint credit is durable, honest about aid, and never new independent credit for a fixed bank repeat',t=>{
  const f=fixture(t);let a=f.finish(f.attempt(),[4]);assert.equal(a.outcome,'independent');assert.equal(f.store.progress(f.student)[0].completed,true);const points=getRewards(f.store,f.student).totalPoints;assert.equal(points,15);
  f.reopen();assert.equal(f.finish(f.attempt()).outcome,'practiced');assert.equal(getRewards(f.store,f.student).totalPoints,points);
  let aided=f.attempt('lesson-2');aided=f.action(aided,'hint',{}).attempt;assert.equal(f.finish(aided).outcome,'hinted');
  assert.equal(f.finish(f.attempt('lesson-3'),[0,4]).outcome,'started');
  assert.equal(f.finish(f.attempt('lesson-1',f.peer),[],f.peer).outcome,'independent');
});
for(const legacy of ["CHECK(course IN ('school','foundations','oge','ege'))","CHECK(course IN ('school','foundations','oge','ege','ege-profile'))"]){
  test('additive profile migration preserves rows, custom index/trigger, version and allows grade6 from '+legacy,t=>{
    const f=fixture(t),body={opId:op(),expectedVersion:0,course:'school',goal:null,focus:'Учимся шаг за шагом'};
    const before=f.store.saveStudentProfile(f.teacher,f.student.id,body).profile;f.store.close();
    const db=new DatabaseSync(f.filePath);const schema=db.prepare("SELECT sql FROM sqlite_master WHERE name='learning_profiles'").get().sql;
    db.exec('PRAGMA foreign_keys=ON;BEGIN;'+schema.replace('learning_profiles','legacy_profiles').replace("CHECK(course IN ('school','foundations','oge','ege','ege-profile','vilenkin6'))",legacy)+';INSERT INTO legacy_profiles SELECT * FROM learning_profiles;DROP TABLE learning_profiles;ALTER TABLE legacy_profiles RENAME TO learning_profiles;CREATE INDEX fixture_profile_index ON learning_profiles(version);CREATE TRIGGER fixture_profile_trigger AFTER UPDATE ON learning_profiles BEGIN SELECT 1; END;COMMIT;');db.close();
    const reopened=f.reopen();assert.deepEqual(reopened.studentProfile(f.teacher,f.student.id),before);assert(reopened.row("SELECT name FROM sqlite_master WHERE name='fixture_profile_index'"));assert(reopened.row("SELECT name FROM sqlite_master WHERE name='fixture_profile_trigger'"));
    const selected=reopened.saveStudentProfile(f.teacher,f.student.id,{...body,opId:op(),expectedVersion:1,course:'vilenkin6'}).profile;assert.equal(selected.course,'vilenkin6');assert.equal(selected.version,2);assert.deepEqual(reopened.rows('PRAGMA foreign_key_check'),[]);assert.equal(reopened.row('PRAGMA user_version').user_version,1);f.reopen();assert.deepEqual(f.store.studentProfile(f.teacher,f.student.id),selected);
  });
}
