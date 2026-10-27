'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const { once } = require('node:events');
const { pathToFileURL } = require('node:url');
const { createLearningApi } = require('../learning-api');
const { hashPassword, tokenHash } = require('../learning-auth');
const { loadAssistantConfig, bridgeCall, checkedAnswer } = require('../learning-assistant');
const contracts = require('../learning-contracts');
const catalog = require('../assistant-profile-catalog.json');
const ORIGIN = 'https://cabinet.example.test';
const HASH = hashPassword('synthetic test account password');
const key = () => crypto.randomBytes(32).toString('base64url');
const uuid = () => crypto.randomUUID();
const profileId = 'peterson-decimals';
const topic = catalog.find(p=>p.id===profileId).topics.find(t=>/add|addition/.test(t.id))?.id || catalog.find(p=>p.id===profileId).topics[0].id;
const jsonResponse = value => new Response(JSON.stringify(value), { status:200,headers:{'Content-Type':'application/json'} });
const sampleAnswer = (answerTopic=topic,verification='curated-guidance') => ({answerId:uuid(),topic:answerTopic,
  title:'Проверенная подсказка',text:'Запиши числа по разрядам.',steps:['Сначала найди десятые доли.'],check:'Какой разряд ты сейчас рассматриваешь?',verification,complete:false,sourceIds:['cabinet.decimals']});

async function fixture(t,{enabled=true,external=false,transport,day=Date.UTC(2026,9,27,10)}={}) {
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'mathexam-cabinet-assistant-'));
  const filePath=path.join(directory,'learning.sqlite'); let now=day;
  const calls=[]; const bridgeKey=key();
  const config={enabled,external,origin:'https://assistant.example.test',key:bridgeKey,timeoutMs:1500};
  const defaultTransport=async (url,options)=>{
    const body=JSON.parse(options.body); calls.push({url,body,headers:options.headers});
    if(url.endsWith('/status')) return jsonResponse({ok:true,protocolVersion:1,mode:external?'api':'offline',externalEnabled:external,providerLabel:'Fixture model',profiles:catalog});
    if(url.endsWith('/feedback')) return jsonResponse({ok:true});
    return jsonResponse({ok:true,answer:sampleAnswer(body.topic)});
  };
  let api,server,address;
  const start=async()=>{
    api=createLearningApi({filePath,contracts,clock:()=>now,publicOrigin:ORIGIN,secureCookies:false,
      assistant:{config,fetchImpl:transport?async(url,options)=>transport(url,options,defaultTransport):defaultTransport}});
    assert.equal(api.store.available,true);
    const app=express();app.use(express.json({limit:'128kb'}));app.use('/api/learning',api.router);
    server=app.listen(0,'127.0.0.1');await once(server,'listening');address=`http://127.0.0.1:${server.address().port}/api/learning`;
  };
  await start();
  const teacher=api.store.activate(api.store.bootstrap({login:'fixture_teacher',name:'Fixture teacher'}).invitationToken,await HASH);
  const learners=[];
  for(let i=0;i<4;i++) learners.push(api.store.activate(api.store.createStudent(teacher.account,{login:'fixture_learner_'+i,name:'Fixture learner '+i}).invitationToken,await HASH));
  const stop=async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));api.close();};
  t.after(async()=>{await stop();fs.rmSync(directory,{recursive:true,force:true});});
  const request=async(session,route,body,extra={})=>{
    const headers={...(body===undefined?{}:{'Content-Type':'application/json',Origin:ORIGIN}),
      ...(session?{Cookie:'mathexam_learning_local='+session.sessionToken,'X-CSRF-Token':tokenHash('learning-csrf:'+session.sessionToken),'X-Learning-Account':session.account.id}:{}),...extra};
    const response=await fetch(address+route,{method:body===undefined?'GET':'POST',headers,...(body===undefined?{}:{body:JSON.stringify(body)})});
    return {status:response.status,body:await response.json(),headers:response.headers};
  };
  const configure=(index=0,changes={})=>request(teacher,'/teacher/students/'+learners[index].account.id+'/assistant',
    {profileId,enabled:true,dailyLimit:10,version:0,...changes});
  const ask=(changes={})=>({requestId:uuid(),topic,question:'0,1 + 0,2',attempt:'',mode:'hint',hintLevel:1,simpler:false,externalConsent:false,...changes});
  return {get api(){return api;},directory,filePath,teacher,learners,calls,config,bridgeKey,request,configure,ask,
    setNow:value=>{now=value;},now:()=>now,restart:async()=>{await stop();await start();}};
}

test('profile catalogue is exactly the separate service public metadata; no private identities',async()=>{
  const {listCabinetProfiles}=await import(pathToFileURL(path.resolve(__dirname,'../../assistant-service/src/cabinet-topics.js')));
  assert.deepEqual(catalog,listCabinetProfiles());assert.equal(catalog.length,4);
  assert.equal(catalog.flatMap(p=>p.topics).length,18);
});

test('configuration fails closed; loopback transport is allowed only in explicit local development',()=>{
  assert.equal(loadAssistantConfig({}).enabled,false);
  const env={LEARNING_ASSISTANT_ENABLED:'1',LEARNING_ASSISTANT_ORIGIN:'https://assistant.example.test',LEARNING_ASSISTANT_BRIDGE_KEY:key()};
  assert.equal(loadAssistantConfig(env).enabled,true);
  for(const origin of ['https://x.example.test/path','https://x.example.test?key=anything','http://127.0.0.1:3010','https://user@x.example.test']){
    assert.throws(()=>loadAssistantConfig({...env,LEARNING_ASSISTANT_ORIGIN:origin}));
  }
  assert.throws(()=>loadAssistantConfig({...env,LEARNING_ASSISTANT_EXTERNAL_ENABLED:'1'}));
  assert.equal(loadAssistantConfig({...env,LEARNING_LOCAL_DEV:'1',LEARNING_ASSISTANT_ORIGIN:'http://127.0.0.1:3010'}).enabled,true);
  assert.throws(()=>loadAssistantConfig({...env,NODE_ENV:'production',LEARNING_LOCAL_DEV:'1',LEARNING_ASSISTANT_ORIGIN:'http://127.0.0.1:3010'}));
});

test('default-disabled integration can stage private settings but never calls the model or exposes a pupil helper',async t=>{
  const f=await fixture(t,{enabled:false});
  const set=await f.configure();assert.equal(set.status,200);assert.equal(set.body.configuredEnabled,true);assert.equal(set.body.enabled,false);
  const status=await f.request(f.learners[0],'/assistant');assert.equal(status.body.profile,null);assert.equal(status.body.enabled,false);
  assert.equal((await f.request(f.learners[0],'/assistant/ask',f.ask())).status,403);assert.equal(f.calls.length,0);
});

test('cabinet session, ownership, CSRF and versioned three-account admission are enforced',async t=>{
  const f=await fixture(t);
  assert.equal((await f.request(null,'/assistant')).status,401);
  assert.equal((await f.request(f.teacher,'/assistant')).status,403);
  assert.equal((await f.request(f.learners[0],'/teacher/students/'+f.learners[0].account.id+'/assistant')).status,403);
  for(let i=0;i<3;i++)assert.equal((await f.configure(i)).status,200);
  assert.equal((await f.configure(3)).body.error,'LEARNING_ASSISTANT_PILOT_FULL');
  assert.equal((await f.configure(0)).body.error,'LEARNING_ASSISTANT_VERSION_CONFLICT');
  const wrongOrigin=await f.request(f.learners[0],'/assistant/ask',f.ask(),{Origin:'https://mathexam.space'});assert.equal(wrongOrigin.status,403);
  assert.equal((await f.request(f.learners[0],'/assistant/ask',f.ask(),{'X-CSRF-Token':'wrong'})).status,403);
  assert.equal((await f.request(f.learners[0],'/assistant/ask',f.ask(),{'X-Learning-Account':f.learners[1].account.id})).status,409);
  assert.equal((await f.request(f.learners[3],'/assistant/ask',f.ask())).status,403);
  assert.equal((await f.configure(0,{version:1,enabled:false})).status,200);
  assert.equal((await f.configure(3)).status,200);
});

test('input and cross-profile forgery are rejected before transport; only mathematical fields cross bridge',async t=>{
  const f=await fixture(t);await f.configure();const before=f.calls.length;
  for(const change of [{question:'Напишите на person@example.test'},{question:'Мой пароль secret-value'},{question:'x'.repeat(1001)},
    {profileId:'oge-geometry'},{subject:'a'.repeat(64)},{topic:catalog[0].topics[0].id},{endpoint:'https://evil.example.test'},
    {attemptId:f.learners[1].account.id},{externalConsent:true},{hintLevel:9}]){
    const r=await f.request(f.learners[0],'/assistant/ask',f.ask(change));assert(r.status>=400,JSON.stringify(change));
  }
  assert.equal(f.calls.length,before);
  const r=await f.request(f.learners[0],'/assistant/ask',f.ask());assert.equal(r.status,200);
  const call=f.calls.find(c=>c.url.endsWith('/ask'));assert.match(call.body.subject,/^[a-f0-9]{64}$/);
  for(const s of [f.teacher,...f.learners]) assert(!JSON.stringify(call.body).includes(s.account.id));
  assert(!JSON.stringify(call.body).includes(f.bridgeKey));assert.equal(call.body.externalConsent,false);assert.equal(call.headers.Cookie,undefined);assert.equal(call.headers.Origin,undefined);
  assert.equal(r.body.answer.verification,'curated-guidance');assert.equal(r.body.remaining,9);
  const rows=f.api.store.rows('SELECT * FROM learning_assistant_requests');assert.equal(rows.length,1);assert(!JSON.stringify(rows).includes('0,1 + 0,2'));
});

test('daily quota and replay tombstone survive restart, profile edits, re-enabling, and UTC rollover',async t=>{
  const f=await fixture(t);await f.configure(0,{dailyLimit:1});const body=f.ask();
  assert.equal((await f.request(f.learners[0],'/assistant/ask',body)).status,200);
  assert.equal((await f.request(f.learners[0],'/assistant/ask',body)).body.error,'LEARNING_ASSISTANT_REQUEST_REPLAY');
  assert.equal((await f.request(f.learners[0],'/assistant/ask',{...body,requestId:body.requestId.toUpperCase()})).body.error,'LEARNING_ASSISTANT_REQUEST_REPLAY');
  assert.equal((await f.request(f.learners[0],'/assistant/ask',f.ask())).body.error,'LEARNING_ASSISTANT_QUOTA');
  await f.configure(0,{version:1,enabled:false,dailyLimit:1});await f.configure(0,{version:2,enabled:true,dailyLimit:1});
  await f.restart();assert.equal((await f.request(f.learners[0],'/assistant/ask',f.ask())).body.error,'LEARNING_ASSISTANT_QUOTA');
  f.setNow(f.now()+86400000);
  assert.equal((await f.request(f.learners[0],'/assistant/ask',body)).body.error,'LEARNING_ASSISTANT_REQUEST_REPLAY');
  assert.equal((await f.request(f.learners[0],'/assistant/ask',f.ask())).status,200);
});

test('unknown transport failure consumes allowance once, has no automatic retry and exposes only a safe code',async t=>{
  let attempts=0;
  const f=await fixture(t,{transport:async(url,opts,next)=>{if(url.endsWith('/ask')){attempts++;throw new Error('upstream private text');}return next(url,opts);}});
  await f.configure(0,{dailyLimit:1});const body=f.ask();const result=await f.request(f.learners[0],'/assistant/ask',body);
  assert.equal(result.status,503);assert.equal(result.body.error,'LEARNING_ASSISTANT_UNAVAILABLE');assert.equal(attempts,1);
  assert.equal((await f.request(f.learners[0],'/assistant/ask',body)).status,409);assert.equal(attempts,1);
  assert.equal((await f.request(f.learners[0],'/assistant')).body.remaining,0);
});

test('single in-flight request and permission revocation withhold stale answer while retaining count',async t=>{
  let release,started;const entered=new Promise(resolve=>{started=resolve;});
  const f=await fixture(t,{transport:async(url,opts,next)=>{if(url.endsWith('/ask')){started();await new Promise(resolve=>{release=resolve;});}return next(url,opts);}});
  await f.configure();await f.configure(1);
  const pending=f.request(f.learners[0],'/assistant/ask',f.ask());await entered;
  assert.equal((await f.request(f.learners[1],'/assistant/ask',f.ask())).body.error,'LEARNING_ASSISTANT_BUSY');
  await f.configure(0,{version:1,enabled:false});release();
  const result=await pending;assert.equal(result.status,409);assert.equal(result.body.answer,undefined);
  assert.equal(f.api.store.rows('SELECT requests FROM learning_assistant_usage')[0].requests,1);
});

test('logout while a response is pending prevents answer disclosure',async t=>{
  let release,started;const entered=new Promise(resolve=>{started=resolve;});
  const f=await fixture(t,{transport:async(url,opts,next)=>{if(url.endsWith('/ask')){started();await new Promise(resolve=>{release=resolve;});}return next(url,opts);}});
  await f.configure();const pending=f.request(f.learners[0],'/assistant/ask',f.ask());await entered;
  f.api.store.logout(f.learners[0].sessionToken);release();const result=await pending;
  assert.equal(result.status,401);assert.equal(result.body.answer,undefined);
});

test('owned structured task is authoritative and marked assisted before its response; other pupil tasks stay private',async t=>{
  let check;
  const f=await fixture(t,{transport:async(url,opts,next)=>{if(url.endsWith('/ask'))check(JSON.parse(opts.body));return next(url,opts);}});
  const p=catalog.find(p=>p.id==='triangle-congruence');await f.configure(0,{profileId:p.id});
  const generated=contracts.create('atanasyan-7-9','atanasyan-7-9-main-92-part-1',123);
  const a=f.api.store.newAttempt(f.learners[0].account.id,f.teacher.account.id,'atanasyan-7-9',generated);
  check=body=>{assert.equal(body.question,generated.taskSpec.prompt);assert.equal(f.api.store.getAttempt(f.learners[0].account,a.id).assistance.hints,true);assert(!JSON.stringify(body).includes(a.id));};
  const result=await f.request(f.learners[0],'/assistant/ask',f.ask({topic:p.topics[0].id,attemptId:a.id,question:'Другой текст из браузера'}));
  assert.equal(result.status,200);assert.equal(result.body.contextMode,'current-task');
  await f.configure(1,{profileId:p.id});
  assert.equal((await f.request(f.learners[1],'/assistant/ask',f.ask({topic:p.topics[0].id,attemptId:a.id}))).status,404);
});

test('course identifiers are resolved by the cabinet; injected condition, unknown steps and other profiles fail before reservation', async t => {
  const { resolveCourseContext } = require('../assistant-course-context');
  const courseContext = { courseId: 'atanasyan-first-steps', lessonId: 'atanasyan-7-9-main-153-part-1', stepIndex: 1 };
  const expected = resolveCourseContext(courseContext);
  const f = await fixture(t, { transport: async (url, options, next) => {
    if (!url.endsWith('/ask')) return next(url, options);
    const body = JSON.parse(options.body); f.calls.push({ url, body });
    assert.equal(body.question, expected.question);
    assert.equal(body.topic, expected.topic);
    assert.equal(body.courseRevision, expected.courseRevision);
    assert.deepEqual(body.courseContext, courseContext);
    assert(!JSON.stringify(body).includes(f.learners[0].account.id));
    return jsonResponse({ ok: true, answer: { ...sampleAnswer(body.topic), courseContext: body.courseContext, courseRevision: body.courseRevision } });
  } });
  await f.configure(0, { profileId: 'atanasyan-first-steps' });
  const ask = extra => ({ requestId: uuid(), courseContext, mode: 'hint', hintLevel: 1, simpler: false, externalConsent: false, ...extra });
  const initial = f.calls.length;
  for (const extra of [{ question: 'browser condition' }, { topic: expected.topic }, { solution: 'browser proof' }, { attemptId: 'foreign-attempt-value' },
    { externalConsent: true }, { courseContext: { ...courseContext, stepIndex: 3 } },
    { courseContext: { ...courseContext, stepIndex: 0.1 } }, { courseContext: { ...courseContext, lessonId: 'atanasyan-7-9-main-161-part-1' } },
    { courseContext: { ...courseContext, url: 'https://foreign.example.test' } }]) {
    const rejected = await f.request(f.learners[0], '/assistant/ask', ask(extra));
    assert(rejected.status >= 400, JSON.stringify(extra));
  }
  assert.equal((await f.request(f.learners[0], '/assistant/ask', f.ask({ topic: expected.topic }))).body.error, 'LEARNING_ASSISTANT_TOPIC_INVALID');
  assert.equal(f.calls.length, initial);
  assert.equal(f.api.store.row('SELECT COUNT(*) AS n FROM learning_assistant_requests').n, 0);
  const answer = await f.request(f.learners[0], '/assistant/ask', ask());
  assert.equal(answer.status, 200); assert.equal(answer.body.contextMode, 'course-task');
  assert.equal(answer.body.courseTask.title, expected.title); assert.deepEqual(answer.body.courseContext, courseContext);
  assert.equal(answer.body.remaining, 9);
  await f.configure(1, { profileId: 'triangle-congruence' });
  assert.equal((await f.request(f.learners[1], '/assistant/ask', ask())).body.error, 'LEARNING_ASSISTANT_TOPIC_INVALID');
});

test('course profile remains source-only and stale source/step responses cannot cross the cabinet boundary', async t => {
  const courseContext = { courseId: 'atanasyan-first-steps', lessonId: 'atanasyan-7-9-main-153-part-1', stepIndex: 0 };
  let wrong = 'revision';
  const f = await fixture(t, { external: true, transport: async (url, options, next) => {
    if (!url.endsWith('/ask')) return next(url, options);
    const body = JSON.parse(options.body);
    return jsonResponse({ ok: true, answer: { ...sampleAnswer(body.topic, wrong === 'model' ? 'model-unverified' : 'curated-guidance'),
      courseContext: wrong === 'step' ? { ...courseContext, stepIndex: 1 } : courseContext,
      courseRevision: wrong === 'revision' ? '0'.repeat(64) : body.courseRevision } });
  } });
  assert.equal((await f.configure(0, { profileId: 'atanasyan-first-steps', externalAllowed: true })).status, 409);
  await f.configure(0, { profileId: 'atanasyan-first-steps' });
  const status = await f.request(f.learners[0], '/assistant');
  assert.equal(status.body.externalEnabled, false); assert.equal(status.body.externalAvailable, false);
  for (wrong of ['revision', 'step', 'model']) {
    const result = await f.request(f.learners[0], '/assistant/ask', { requestId: uuid(), courseContext,
      mode: 'hint', hintLevel: 1, simpler: false });
    assert.equal(result.status, 503); assert.equal(result.body.answer, undefined);
  }
  assert.equal(f.api.store.row('SELECT COUNT(*) AS n FROM learning_assistant_requests').n, 3);
});

test('source course remains subject to assessment and late permission revocation fences', async t => {
  let release, entered; const pendingStarted = new Promise(resolve => { entered = resolve; });
  const courseContext = { courseId: 'atanasyan-first-steps', lessonId: 'atanasyan-7-9-main-153-part-1', stepIndex: 0 };
  const f = await fixture(t, { transport: async (url, options, next) => {
    if (!url.endsWith('/ask')) return next(url, options);
    const body = JSON.parse(options.body); entered(); await new Promise(resolve => { release = resolve; });
    return jsonResponse({ ok: true, answer: { ...sampleAnswer(body.topic), courseContext, courseRevision: body.courseRevision } });
  } });
  await f.configure(0, { profileId: 'atanasyan-first-steps' });
  const body = () => ({ requestId: uuid(), courseContext, mode: 'hint', hintLevel: 1, simpler: false });
  const pending = f.request(f.learners[0], '/assistant/ask', body()); await pendingStarted;
  await f.configure(0, { profileId: 'atanasyan-first-steps', version: 1, enabled: false });
  release();
  const denied = await pending; assert.equal(denied.status, 409); assert.equal(denied.body.answer, undefined);
  await f.configure(0, { profileId: 'atanasyan-first-steps', version: 2 });
  const { initializeRuns } = require('../learning-runs'); initializeRuns(f.api.store);
  f.api.store.run("INSERT INTO learning_runs(id,learner_id,teacher_id,kind,questions_json,answers_json,started_at) VALUES(?,?,?,'exam','[]','[]',?)",
    crypto.randomBytes(18).toString('base64url'), f.learners[0].account.id, f.teacher.account.id, f.now());
  assert.equal((await f.request(f.learners[0], '/assistant/ask', body())).body.error, 'LEARNING_RUN_ACTIVE');
});

test('unfinished assessment blocks even manual helper entry',async t=>{
  const f=await fixture(t);await f.configure();
  const {initializeRuns}=require('../learning-runs');initializeRuns(f.api.store);
  f.api.store.run("INSERT INTO learning_runs(id,learner_id,teacher_id,kind,questions_json,answers_json,started_at) VALUES(?,?,?,'exam','[]','[]',?)",crypto.randomBytes(18).toString('base64url'),f.learners[0].account.id,f.teacher.account.id,f.now());
  assert.equal((await f.request(f.learners[0],'/assistant')).body.examActive,true);
  assert.equal((await f.request(f.learners[0],'/assistant/ask',f.ask())).body.error,'LEARNING_RUN_ACTIVE');
});

test('teacher permission and per-request consent are independent gates; unsolicited model output is rejected',async t=>{
  const f=await fixture(t,{external:true,transport:async(url,opts,next)=>{
    if(url.endsWith('/ask'))return jsonResponse({ok:true,answer:sampleAnswer(JSON.parse(opts.body).topic,'model-unverified')});return next(url,opts);
  }});
  await f.configure();
  assert.equal((await f.request(f.learners[0],'/assistant/ask',f.ask({externalConsent:true}))).body.error,'LEARNING_ASSISTANT_EXTERNAL_UNAVAILABLE');
  assert.equal((await f.request(f.learners[0],'/assistant/ask',f.ask())).status,503);
  await f.configure(0,{version:1,externalAllowed:true});
  assert.equal((await f.request(f.learners[0],'/assistant')).body.externalEnabled,true);
  const result=await f.request(f.learners[0],'/assistant/ask',f.ask({externalConsent:true}));assert.equal(result.status,200);assert.equal(result.body.mode,'api');
});

test('feedback is owner-scoped, bounded to an answer, and counted at most once',async t=>{
  const f=await fixture(t);await f.configure();await f.configure(1);
  const result=await f.request(f.learners[0],'/assistant/ask',f.ask());const body={answerId:result.body.answer.answerId,rating:'simpler'};
  assert.equal((await f.request(f.learners[1],'/assistant/feedback',body)).status,404);
  assert.equal((await f.request(f.learners[0],'/assistant/feedback',body)).status,200);
  assert.equal((await f.request(f.learners[0],'/assistant/feedback',body)).body.duplicate,true);
  assert.equal((await f.request(f.learners[0],'/assistant/feedback',{...body,rating:'incorrect'})).status,409);
  assert.equal(f.calls.filter(c=>c.url.endsWith('/feedback')).length,1);
});

test('response transport refuses redirects and oversized bodies without surfacing raw upstream content',async()=>{
  const config={enabled:true,origin:'https://assistant.example.test',key:key(),timeoutMs:100};
  await assert.rejects(()=>bridgeCall(config,'ask',{},async(_url,options)=>{
    assert.equal(options.redirect,'error');return jsonResponse({ok:true,extra:'x'.repeat(65537)});
  }),error=>error.code==='LEARNING_ASSISTANT_RESPONSE_INVALID');
});

test('transport deadline bounds noncooperative fetch and body streams',async()=>{
  const config={enabled:true,origin:'https://assistant.example.test',key:key(),timeoutMs:30};
  await assert.rejects(()=>bridgeCall(config,'ask',{},async()=>new Promise(()=>{})),error=>error.code==='LEARNING_ASSISTANT_UNAVAILABLE');
  await assert.rejects(()=>bridgeCall(config,'ask',{},async()=>new Response(new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode('{'));}}),
    {headers:{'Content-Type':'application/json'}})),error=>error.code==='LEARNING_ASSISTANT_UNAVAILABLE');
});

test('bridge credential cannot return in identifiers, references, notice or text; long checked decimals remain valid',async t=>{
  const secret=key();
  for(const field of ['answerId','title','text','check'])assert.throws(()=>checkedAnswer({...sampleAnswer(),[field]:secret},topic,secret));
  assert.throws(()=>checkedAnswer({...sampleAnswer(),sourceIds:[secret]},topic,secret));
  const long={...sampleAnswer(topic,'deterministic'),steps:['Ответ: 0,015241383936.']};
  assert.equal(checkedAnswer(long,topic,secret).steps[0],long.steps[0]);
  const f=await fixture(t,{transport:async(url,options,next)=>{
    if(url.endsWith('/ask'))return jsonResponse({ok:true,answer:sampleAnswer(),notice:options.headers.Authorization.slice(7)});return next(url,options);
  }});await f.configure();
  const result=await f.request(f.learners[0],'/assistant/ask',f.ask());assert.equal(result.status,503);assert(!JSON.stringify(result.body).includes(f.bridgeKey));
});

test('task access revoked while upstream runs prevents its response from returning',async t=>{
  let release,started;const entered=new Promise(resolve=>{started=resolve;});
  const f=await fixture(t,{transport:async(url,options,next)=>{if(url.endsWith('/ask')){started();await new Promise(resolve=>{release=resolve;});}return next(url,options);}});
  const p=catalog.find(p=>p.id==='triangle-congruence');await f.configure(0,{profileId:p.id});
  const generated=contracts.create('atanasyan-7-9','atanasyan-7-9-main-92-part-1',123);
  const a=f.api.store.newAttempt(f.learners[0].account.id,f.teacher.account.id,'atanasyan-7-9',generated);
  const pending=f.request(f.learners[0],'/assistant/ask',f.ask({topic:p.topics[0].id,attemptId:a.id}));await entered;
  f.api.store.run('UPDATE attempts SET archived_at=? WHERE id=?',f.now(),a.id);release();
  const result=await pending;assert.equal(result.status,409);assert.equal(result.body.answer,undefined);
});

test('review metadata expires while replay tombstones and current allowance survive',async t=>{
  const f=await fixture(t);await f.configure();const body=f.ask();
  const result=await f.request(f.learners[0],'/assistant/ask',body);assert.equal(result.status,200);
  f.setNow(f.now()+31*86400000);
  assert.equal((await f.request(f.learners[0],'/assistant')).status,401);
  // Real cabinet sessions expire before this retention window. A new login
  // must still find the original allowance/tombstone rather than reset it.
  const renewed=f.api.store.createSession(f.learners[0].account.id);
  assert.equal((await f.request(renewed,'/assistant')).status,200);
  const old=f.api.store.row('SELECT * FROM learning_assistant_requests');
  for(const field of ['learner_id','profile_id','topic','answer_id','feedback','verification'])assert.equal(old[field],null);
  assert.equal((await f.request(renewed,'/assistant/ask',body)).body.error,'LEARNING_ASSISTANT_REQUEST_REPLAY');
});

test('real HTTP cabinet-to-assistant path uses separate offline service without provider traffic',async t=>{
  const {createAssistantServer}=await import(pathToFileURL(path.resolve(__dirname,'../../assistant-service/src/server.js')));
  const {loadConfig}=await import(pathToFileURL(path.resolve(__dirname,'../../assistant-service/src/config.js')));
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'mathexam-two-services-')),bridgeKey=key();let paid=0;
  const config={...loadConfig({ASSISTANT_DB_PATH:path.join(directory,'assistant.sqlite'),ASSISTANT_CABINET_BRIDGE_KEY:bridgeKey}),port:0};
  const app=createAssistantServer({config,fetchImpl:async()=>{paid++;throw Error('Paid transport forbidden');}});
  app.server.listen(0,'127.0.0.1');await once(app.server,'listening');config.publicOrigin=`http://127.0.0.1:${app.server.address().port}`;
  t.after(async()=>{await app.close();fs.rmSync(directory,{recursive:true,force:true});});
  // Route through real HTTP while keeping fixture authentication synthetic.
  const real=await fixture(t,{transport:(url,options)=>fetch(url,options)});real.config.origin=config.publicOrigin;real.config.key=bridgeKey;
  const configured=await real.configure();assert.equal(configured.status,200,JSON.stringify(configured.body));assert.equal(configured.body.mode,'offline');
  const answer=await real.request(real.learners[0],'/assistant/ask',real.ask({mode:'full'}));
  assert.equal(answer.status,200,JSON.stringify(answer.body));assert.equal(answer.body.answer.verification,'deterministic');assert.equal(paid,0);
  assert(JSON.stringify(answer.body.answer).includes('0,3'));
  const p=catalog.find(p=>p.id===profileId),multiply=p.topics.find(t=>/multiply/.test(t.id));
  assert(multiply);
  const long=await real.request(real.learners[0],'/assistant/ask',real.ask({topic:multiply.id,question:'0,123456 * 0,123456',mode:'full'}));
  assert.equal(long.status,200,JSON.stringify(long.body));assert(JSON.stringify(long.body.answer).includes('0,015241383936'));assert.equal(paid,0);
  const feedback=await real.request(real.learners[0],'/assistant/feedback',{answerId:answer.body.answer.answerId,rating:'helpful'});assert.equal(feedback.status,200,JSON.stringify(feedback.body));
  const serialized=JSON.stringify(app.store.db.prepare('SELECT * FROM requests').all());assert(!serialized.includes(real.learners[0].account.id));assert(!serialized.includes('0,1 + 0,2'));
});
