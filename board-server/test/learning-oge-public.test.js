'use strict';

// Real local HTTP, durable SQLite and existing password hashing. All accounts
// and photos here are synthetic fixtures, never production pupil credentials.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const { LearningStore } = require('../learning-store');
const { createLearningApi } = require('../learning-api');
const { createTeachingRouter } = require('../learning-teaching');
const { createLearningRunsRouter } = require('../learning-runs');
const { tokenHash, verifyPassword } = require('../learning-auth');
const contracts = require('../learning-contracts');
const HASH = 'scrypt1:' + '01'.repeat(16) + ':' + '02'.repeat(32);
const ORIGIN = 'https://cabinet.example.test';
const op = () => crypto.randomUUID();

async function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-oge-public-'));
  const filePath = path.join(directory, 'learning.sqlite');
  const store = new LearningStore({ filePath, contracts, clock: () => 1800000000000 });
  assert(store.available);
  const invitation = store.bootstrap({ login: 'test_teacher', name: 'Test teacher' });
  const teacher = store.activate(invitation.invitationToken, HASH);
  const students = [1, 2].map(i => {
    const invited = store.createStudent(teacher.account, { login: 'test_student_' + i, name: 'Test student ' + i });
    return store.activate(invited.invitationToken, HASH);
  });
  const app = express(); app.use(express.json({ limit: '6mb' }));
  const api = createLearningApi({ store, publicOrigin: ORIGIN, secureCookies: true });
  const teaching = createTeachingRouter(api), runs = createLearningRunsRouter(api);
  app.use('/api/learning', api.router, teaching, runs.router);
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  t.after(async () => {
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
    store.close(); fs.rmSync(directory, { recursive: true, force: true });
  });
  async function request(session, route, body, headers = {}) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/learning` + route, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { ...(session ? { Cookie: '__Host-mathexam_learning=' + session.sessionToken } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json', Origin: ORIGIN,
          ...(session ? { 'X-CSRF-Token': tokenHash('learning-csrf:' + session.sessionToken) } : {}) }), ...headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie') };
  }
  async function attempt(session = students[0]) {
    const result = await request(session, '/attempts', { opId: op(), trainerId: 'ege-path', contentId: 'equations-linear', fresh: true });
    assert.equal(result.status, 201); return result.body.attempt;
  }
  async function photo(assignmentId, kind = 'solution', session = students[0]) {
    const sharp = require('sharp');
    const data = await sharp({ create: { width: 16, height: 16, channels: 3, background: '#f0f5ff' } }).png().toBuffer();
    const result = await request(session, '/assignments/' + assignmentId + '/photos', {
      opId: op(), kind, filename: 'synthetic-test.png', mime: 'image/png', data: data.toString('base64')
    });
    assert.equal(result.status, 201); return result.body.photo;
  }
  return { store, api, teacher, students, request, attempt, photo, filePath };
}

function state19(a,answer,help=false){return {answer:String(answer),helpUsed:help,native:{topic:'',review:false,current:{id:a.taskSpec.descriptor.id,answer,hintOpen:false,helpUsed:help,modelState:null},answers:[[a.taskSpec.descriptor.id,answer,help]],view:{settings:false,textbook:false,reference:[]}}};}
const action=(a,state,extra={})=>({opId:op(),expectedVersion:a.version,type:'check',payload:{state,details:{scope:'final',answer:state.answer}},...extra});

test('six native contracts: deterministic mathematics, typed snapshots, distinct graph identity',()=>{
 for(const n of [11,15,16,17,18,19])for(let seed=1;seed<=60;seed++){
  const a=contracts.create('oge-public',String(n),seed),b=contracts.create('oge-public',String(n),seed);
  assert.deepEqual(a,b);assert(a.taskSpec.task.q);assert.notEqual(a.taskSpec.task.answer,'undefined');
  assert.deepEqual(contracts.normalize('oge-public',a.taskSpec,a.state,a.state),a.state);
  assert.throws(()=>contracts.normalize('oge-public',a.taskSpec,{...a.state,learnerId:'bad'},a.state));
 }
 const a=contracts.create('oge-public','11',20),b=contracts.create('oge-public','11',25);
 assert.match(a.taskSpec.task.q,/[<>]/);assert.notEqual(contracts.questionIdentity(a.taskSpec),contracts.questionIdentity(b.taskSpec));
 const a19=contracts.create('oge-public','19',1),s=state19(a19,true);
 for(const mutate of [x=>x.native.current.hintOpen='yes',x=>x.native.answers={},x=>x.native.view.reference=1,x=>x.native.current.id='other',x=>x.native.current.modelState={params:{x:'private'},measured:true}]){
  const bad=structuredClone(s);mutate(bad);assert.throws(()=>contracts.normalize('oge-public',a19.taskSpec,bad,a19.state));
 }
});

test('assigned online work: authorization, publication, checked errors, retries, submission and old records',async t=>{
 const f=await fixture(t),student=f.students[0],peer=f.students[1],old=await f.attempt();
 const body={opId:op(),learnerIds:[student.account.id],trainerId:'oge-public',contentId:'19',title:'Синтетическая работа',count:3};
 assert.equal((await f.request(student,'/assignments',body)).status,403);
 const created=await f.request(f.teacher,'/assignments',body);assert.equal(created.status,201);assert.equal(created.body.assignments.length,3);
 assert.deepEqual((await f.request(f.teacher,'/assignments',body)).body.assignments,created.body.assignments);
 const assignment=created.body.assignments[0],a=assignment.attempt;
 assert.equal((await f.request(student,'/attempts/'+a.id)).status,404);
 assert.equal((await f.request(f.teacher,'/assignments/'+assignment.id+'/publish',{opId:op()})).status,200);
 let work=action(a,state19(a,a.taskSpec.task.answer!=='true'));
 assert.equal((await f.request(null,'/attempts/'+a.id+'/actions',work)).status,401);
 assert.equal((await f.request(peer,'/attempts/'+a.id+'/actions',work)).status,404);
 assert.equal((await f.request(student,'/attempts/'+a.id+'/actions',work,{'X-CSRF-Token':'bad'})).status,403);
 assert.equal((await f.request(student,'/attempts/'+a.id+'/actions',work,{Origin:'https://public.example.test'})).status,403);
 const wrong=await f.request(student,'/attempts/'+a.id+'/actions',work);assert.equal(wrong.status,200);assert.equal(wrong.body.evaluation.correct,false);assert.equal(wrong.body.attempt.outcome,'started');
 assert.equal((await f.request(student,'/attempts/'+a.id+'/actions',work)).body.duplicate,true);
 assert.equal((await f.request(student,'/attempts/'+a.id+'/actions',{...work,opId:op()})).status,409);
 assert.equal((await f.request(student,'/attempts/'+a.id+'/submit',{opId:op(),expectedVersion:wrong.body.attempt.version})).status,200);
 const report=(await f.request(f.teacher,'/teacher/students/'+student.account.id+'/report')).body;
 const row=report.attempts.find(x=>x.id===a.id);assert.equal(row.wrongChecks,1);assert.equal(row.checkedAnswers.length,1);assert.equal(row.submission.status,'submitted');
 assert.deepEqual((await f.request(student,'/attempts/'+old.id)).body,old,'preexisting work preserved');
 for(const x of created.body.assignments.slice(1))await f.request(f.teacher,'/assignments/'+x.id+'/publish',{opId:op()});
 const helped=created.body.assignments[1].attempt;
 const completed=await f.request(student,'/attempts/'+helped.id+'/actions',action(helped,state19(helped,helped.taskSpec.task.answer==='true',true)));
 assert.equal(completed.body.attempt.outcome,'hinted');
 assert((await f.request(student,'/progress')).body.progress.some(x=>x.trainerId==='oge-public'));
});

test('lesson membership and teacher participation never become independent credit',async t=>{
 const f=await fixture(t),student=f.students[0],peer=f.students[1];
 const a=(await f.request(student,'/attempts',{opId:op(),trainerId:'oge-public',contentId:'19',fresh:true})).body.attempt;
 const lesson=(await f.request(f.teacher,'/lessons',{opId:op(),title:'Совместно',learnerIds:[student.account.id]})).body.lesson;
 const peerLesson=(await f.request(f.teacher,'/lessons',{opId:op(),title:'Другой урок',learnerIds:[peer.account.id]})).body.lesson;
 const body=action(a,state19(a,a.taskSpec.task.answer==='true'),{lessonId:peerLesson.id});
 assert.equal((await f.request(student,'/attempts/'+a.id+'/actions',body)).status,404);
 const together=await f.request(student,'/attempts/'+a.id+'/actions',{...body,opId:op(),lessonId:lesson.id});
 assert.equal(together.status,200);assert.equal(together.body.attempt.outcome,'together');assert(together.body.attempt.assistance.teacher);
});


test('all six native homework batches respect quantity bounds, distinct conditions and retained work',async t=>{
 const f=await fixture(t),student=f.students[0],old=await f.attempt();
 const body={learnerIds:f.students.map(s=>s.account.id),trainerId:'oge-public',contentId:'19',title:'Проверка количества'};
 for(const count of [0,-1,1.5,11,'2']){
  const rejected=await f.request(f.teacher,'/assignments',{...body,opId:op(),count});
  assert.equal(rejected.status,400,'reject invalid quantity '+JSON.stringify(count));
 }
 assert.equal((await f.request(f.teacher,'/assignments',{...body,opId:op(),trainerId:'ege-path',contentId:'equations-linear',count:2})).status,400);
 assert.equal((await f.request(f.teacher,'/assignments')).body.assignments.length,0,'invalid quantities do not create drafts');
 for(const number of [11,15,16,17,18,19]){
  const request={...body,opId:op(),contentId:String(number),count:10};
  const created=await f.request(f.teacher,'/assignments',request);
  assert.equal(created.status,201,'maximum quantity for OGE '+number);
  assert.equal(created.body.assignments.length,20,'ten separate conditions for each of two pupils');
  assert.equal(new Set(created.body.assignments.map(a=>a.batchId)).size,1);
  for(const learner of f.students){
   const rows=created.body.assignments.filter(a=>a.learnerId===learner.account.id);
   assert.equal(rows.length,10);
   assert.equal(new Set(rows.map(a=>contracts.questionIdentity(a.attempt.taskSpec))).size,10,'conditions are distinct for '+number);
   assert(rows.every(a=>a.status==='draft'&&a.attempt.outcome==='started'&&a.attempt.taskSpec.contentId===String(number)));
  }
  assert.deepEqual((await f.request(f.teacher,'/assignments',request)).body.assignments,created.body.assignments,'retry keeps the exact same batch');
 }
 assert.deepEqual((await f.request(student,'/attempts/'+old.id)).body,old,'old attempt is unchanged after all batches');
});
