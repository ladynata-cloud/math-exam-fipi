'use strict';
// Synthetic SQLite fixtures: the new curriculum uses the existing account and
// attempt protocol. No live account or credential is involved.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {LearningStore}=require('../learning-store'),contracts=require('../learning-contracts');
const catalog=require('../../learning/catalog');
const D=require('../../ege-baza/path/data');
for(const name of ['practice','equation-practice','grade7-algebra','grade7-geometry','grade7-foundations'])require('../../ege-baza/path/'+name);
const ids=catalog.items.filter(item=>item.grade7).map(item=>item.contentId);
const HASH='scrypt1:'+'01'.repeat(16)+':'+'02'.repeat(32),op=()=>crypto.randomUUID();
function fixture(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'learning-grade7-')),filePath=path.join(dir,'work.sqlite');let store=new LearningStore({filePath,contracts});assert.equal(store.available,true);const invitation=store.bootstrap({login:'fixture_g7_teacher',name:'Fixture teacher'}),teacher=store.activate(invitation.invitationToken,HASH).account,invited=store.createStudent(teacher,{login:'fixture_g7_pupil',name:'Fixture pupil'}),student=store.activate(invited.invitationToken,HASH).account;t.after(()=>{store.close();fs.rmSync(dir,{recursive:true,force:true});});return{teacher,student,get store(){return store;},reopen(){store.close();store=new LearningStore({filePath,contracts});return store;}};}
test('24 grade7 families remain separate from every exam pool and use pinned exact tasks',()=>{
 assert.equal(ids.length,24);assert.equal(new Set(ids).size,24);
 for(const subject of ['algebra','geometry','foundation'])assert.equal(catalog.items.filter(item=>item.grade7&&item.subject===subject).length,8);
 for(let position=1;position<=21;position++)assert(contracts.examPool(position).every(item=>!item.grade7));
 for(const id of ids)for(const seed of [0,1,2,23,119,239,359,999999]){
  const created=contracts.create('ege-path',id,seed);assert.equal(created.taskSpec.task.id,id);assert.equal(created.taskSpec.task.seed,seed);
  assert.deepEqual(contracts.normalize('ege-path',created.taskSpec,created.state),created.state);
  assert.equal(contracts.evaluate('ege-path',created.taskSpec,{scope:'final',answer:D.answerText(created.taskSpec.task)}).complete,true,id);
  const corrupted=structuredClone(created.state);corrupted.taskSpec.seed++;assert.throws(()=>contracts.normalize('ege-path',created.taskSpec,corrupted),{code:'LEARNING_STATE_INVALID'});
 }
});
test('all 24 attempts retain drafts, help, checked prefixes and teacher changes after durable reopen',t=>{
 const f=fixture(t),saved=[];
 for(const id of ids){let attempt=f.store.createAttempt(f.student,{opId:op(),trainerId:'ege-path',contentId:id,fresh:true}).attempt;
  const original=structuredClone(attempt.taskSpec),state=structuredClone(attempt.state);state.work.stage=2;state.work.help=true;state.work.draft='−3/7';state.view.hintText=attempt.taskSpec.task.steps[0].why;
  attempt=f.store.action(f.student,attempt.id,{opId:op(),expectedVersion:attempt.version,type:'hint',payload:{state}}).attempt;
  const answer=D.answerText(attempt.taskSpec.task.steps[0]),checked=structuredClone(attempt.state);checked.work.answers=[answer];checked.work.step=1;checked.work.draft='';checked.view.hintText='';
  attempt=f.store.action(f.student,attempt.id,{opId:op(),expectedVersion:attempt.version,type:'check',payload:{state:checked,details:{scope:'step',step:0,answers:[],answer}}}).attempt;
  assert.equal(attempt.state.work.step,1,id);assert.equal(attempt.assistance.hints,true,id);
  const invalid=structuredClone(checked);invalid.work.answers=['999999999'];assert.throws(()=>contracts.normalize('ege-path',original,invalid),{code:'LEARNING_STATE_INVALID'});
  attempt=f.store.action(f.teacher,attempt.id,{opId:op(),expectedVersion:attempt.version,type:'control',payload:{controller:'teacher'}}).attempt;
  const teaching=structuredClone(attempt.state);teaching.work.draft='Teacher example: 4/9';
  assert.throws(()=>f.store.action(f.student,attempt.id,{opId:op(),expectedVersion:attempt.version,type:'state',payload:{state:teaching}}),{code:'LEARNING_CONTROL_REQUIRED'});
  attempt=f.store.action(f.teacher,attempt.id,{opId:op(),expectedVersion:attempt.version,type:'state',payload:{state:teaching}}).attempt;
  assert.deepEqual(attempt.taskSpec,original,id+' stays pinned');saved.push(attempt);
 }
 const reopened=f.reopen();for(const expected of saved){const actual=reopened.getAttempt(f.student,expected.id);assert.deepEqual(actual.state,expected.state);assert.deepEqual(actual.taskSpec,expected.taskSpec);assert.equal(actual.controller,'teacher');}
});
test('geometry semantic selection accepts only canonical element IDs and bounded reveal steps',()=>{
 for(const id of ids.filter(id=>id.startsWith('grade7-g-'))){const {taskSpec,state}=contracts.create('ege-path',id,23);const elements=taskSpec.task.model.elements;assert(elements.length>0,id);state.work.stage=1;state.work.model={kind:'grade7-geometry',selected:elements[0].id,revealed:1};assert.deepEqual(contracts.normalize('ege-path',taskSpec,state).work.model,state.work.model);
  for(const model of [{...state.work.model,selected:'unknown-element'},{...state.work.model,revealed:-1},{...state.work.model,revealed:taskSpec.task.steps.length+1},{...state.work.model,html:'<script>unsafe</script>'}]){const invalid=structuredClone(state);invalid.work.model=model;assert.throws(()=>contracts.normalize('ege-path',taskSpec,invalid),{code:'LEARNING_STATE_INVALID'});}
 }
});
