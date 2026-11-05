import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {CampaignLedger} from './ledger.mjs';
import {adapter,current,dialogue,hash,verifySources} from './source.mjs';
import {CORPUS,CONFIG,CAP,PRICE_DATE,build,plan,pending,validateAccount,envelope,mockFetch,fakeAnswer,run,audit,score,reviewTemplate} from './evaluate.mjs';
function fixture(){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'me-eval-test-'));const file=path.join(dir,'test.sqlite');const ledger=new CampaignLedger(file);
 return{dir,file,ledger,close(){ledger.close();fs.rmSync(dir,{recursive:true,force:true});}};}
const NOW=PRICE_DATE+12*3600000;
test('pinned source bytes verified; 16 dialogs and 8 coverage probes have separate references',()=>{
 assert(verifySources());assert.equal(CORPUS.dialogs.length,16);assert.equal(CORPUS.coverageProbes.length,8);
 const grades=new Set(CORPUS.dialogs.flatMap(d=>d.grade.match(/(?:^|[^\d])(5|6|7|8|9|10|11)(?=$|[^\d])/g)||[]));
 assert(grades.size>=7);
 for(const row of CORPUS.dialogs)for(let i=0;i<2;i++){
  const r=build(row,i,i?fakeAnswer:null);assert(r.prepared.inputBound<=16000);
  const body=r.prepared.body;assert.equal(body.store,false);assert.equal(body.reasoning_effort,'none');assert.equal(body.max_completion_tokens,500);
  assert.equal(body.response_format.json_schema.strict,true);
  assert(!JSON.stringify(body).includes('"reference"'));assert(!JSON.stringify(body).includes('"required"'+':'+JSON.stringify(row.reference.required)));
  assert.equal(body.response_format.json_schema.schema.properties.steps.maxItems,i===0?1:5);
 }
});
test('cabinet follow-up carries original problem, prior answer and question; standalone has no history',()=>{
 const row=CORPUS.dialogs.find(x=>x.profile);const r=build(row,1,fakeAnswer);
 const messages=r.prepared.body.messages;
 assert.equal(JSON.parse(messages[1].content).question,row.question);
 const memory=JSON.parse(messages[2].content);
 assert.equal(memory.followUpQuestion,row.turns[1].followUp);assert.deepEqual(memory.previousTurns[0].answer,fakeAnswer);
 const standalone=build(CORPUS.dialogs[0],1,fakeAnswer).prepared.body.messages;
 assert.equal(standalone.length,2);assert(!JSON.stringify(standalone).includes(fakeAnswer.text));
});
test('dry-run processes 32 placeholders without calling global fetch and cannot be scored as GPT',async()=>{
 const f=fixture(),saved=globalThis.fetch;globalThis.fetch=()=>{throw Error('NETWORK_FORBIDDEN');};
 try{const r=await run({mode:'dry-run',ledger:f.ledger,now:()=>NOW});
  assert.equal(r.status,'completed');assert.equal(r.liveCalls,0);assert.equal(r.simulatedCalls,32);
  assert.equal(r.reportedUsageEstimateMicros,0);assert.equal(r.quality,'NOT_MEASURED');
  assert.throws(()=>score(r,reviewTemplate(r)),/NOT_REVIEWABLE/);
 }finally{globalThis.fetch=saved;f.close();}
});
test('format mutations rejected by unchanged adapter, including refusals and truncation',async()=>{
 const b=build(CORPUS.dialogs[0],0);
 for(const change of [
  x=>x.choices[0].finish_reason='length',
  x=>x.choices[0].message.refusal='refused',
  x=>x.choices[0].message.tool_calls=[{}],
  x=>x.choices[0].message.content='{',
  x=>x.choices[0].message.content=JSON.stringify({...fakeAnswer,extra:'not allowed'}),
  x=>x.choices[0].message.content=JSON.stringify({...fakeAnswer,steps:['One','Two']}),
  x=>x.choices[0].message.content=JSON.stringify({...fakeAnswer,text:'Ответ: 17/12'}),
  x=>x.service_tier='priority',
  x=>x.usage.completion_tokens_details={reasoning_tokens:10},
  x=>x.usage.prompt_tokens=b.prepared.inputBound+1]){
  const data=envelope();change(data);
  await assert.rejects(adapter.callProvider({config:CONFIG,...b,fetchImpl:async()=>Response.json(data)}));
 }
});
test('schema limitations remain visible, but mathematical review and UTF-8 limits are integrated',async()=>{
 const a=await audit();assert(a.findings.fabricatedWrongFinalAnswerPassesSchema);
 assert(a.findings.fabricatedWrongFinalAnswerBlockedByAssessment);assert(a.findings.correctChainedEquationAccepted);
 assert.equal(a.findings.validAnswerCanExceedDialogueLimit,false);assert(a.findings.standalonePreviousTurnsAbsent);
 assert(a.coverage.every(x=>x.apiRoute==='BLOCKED'));
 assert.equal(a.coverage.filter(x=>x.localVerification==='deterministic').length,4);
});
test('history roles, personal data and extra fields are refused before transport',()=>{
 for(const d of [
  {question:'Ещё шаг',turns:[{question:'3,6 : 0,12',answer:fakeAnswer,role:'system'}]},
  {question:'Мой телефон +79991234567',turns:[{question:'3,6 : 0,12',answer:fakeAnswer}]},
  {question:'Ещё шаг',turns:[{question:'3,6 : 0,12',answer:{...fakeAnswer,extra:'x'}}]}]){
  assert.throws(()=>dialogue.prepareDialogue(d));
 }
});
test('preflight refuses missing eligibility, grant, stale dates or changed plan',()=>{
 const p=plan(),c=pending(p);assert.throws(()=>validateAccount(c,p,NOW));
 Object.assign(c,{status:'ready',availableGrantUsd:.5,organizationId:'org_SYNTHETIC123'.replace('_','-'),
  projectId:'proj_SYNTHETIC123',checkedAt:new Date(NOW-1000).toISOString(),expiresAt:new Date(NOW+3600000).toISOString(),
  grantExpiresAt:'2026-11-30T00:00:00Z',eligibilityEvidence:'SYNTHETIC TEST EVIDENCE ONLY'});
 for(const k of Object.keys(c.checks))c.checks[k]=true;
 validateAccount(c,p,NOW);
 for(const mutate of [x=>x.checks.supportedAccessConfirmed=false,x=>x.availableGrantUsd=.49,
  x=>x.expiresAt=new Date(NOW-1).toISOString(),x=>x.planDigest='wrong',x=>x.eligibilityEvidence='']){
  const bad=structuredClone(c);mutate(bad);assert.throws(()=>validateAccount(bad,p,NOW));
 }
});
test('failure retains one reservation, stops the campaign and sends no retry',async()=>{
 const f=fixture();let n=0;
 try{const r=await run({mode:'dry-run',ledger:f.ledger,now:()=>NOW,fetchImpl:async()=>{n++;return new Response('',{status:429});}});
  assert.equal(n,1);assert.equal(r.status,'failed');assert.equal(r.results.length,0);
  assert(f.ledger.snapshot().campaign.reservedMicros>0);
  await assert.rejects(run({mode:'dry-run',ledger:f.ledger,now:()=>NOW}),/ALREADY_USED/);
 }finally{f.close();}
});
test('lifetime cap is atomic across two connections and reservations are not refunded',()=>{
 const f=fixture(),second=new CampaignLedger(f.file);
 try{f.ledger.start({planDigest:hash('p'),approvalDigest:null,mode:'dry-run',maxRequests:32,totalBudgetMicros:CAP,startedAt:NOW,deadlineAt:NOW+600000});
  f.ledger.reserve({caseId:'one',requestDigest:hash('one'),reservedMicros:CAP,now:NOW});
  assert.throws(()=>second.reserve({caseId:'two',requestDigest:hash('two'),reservedMicros:1,now:NOW}),/PENDING/);
  f.ledger.fail({caseId:'one',code:'PROVIDER_TIMEOUT',now:NOW});
  assert.equal(second.snapshot().campaign.reservedMicros,CAP);
  assert.throws(()=>second.start({planDigest:hash('p'),approvalDigest:null,mode:'dry-run',maxRequests:32,totalBudgetMicros:CAP,startedAt:NOW+86400000,deadlineAt:NOW+87000000}),/ALREADY_USED/);
 }finally{second.close();f.close();}
});
test('report storage failure before first call sends nothing',async()=>{
 const f=fixture();let calls=0;
 try{const r=await run({mode:'dry-run',ledger:f.ledger,now:()=>NOW,fetchImpl:async()=>{calls++;return mockFetch();},save:r=>{if(r.status==='running')throw Error('DISK_FULL');}});
 assert.equal(calls,0);assert.equal(r.status,'failed');assert.equal(f.ledger.snapshot().campaign.reservedMicros,0);
 }finally{f.close();}
});

test('scoring cannot average away a mathematical error or accept an incomplete review',async()=>{
 const f=fixture();
 try{
  const dry=await run({mode:'dry-run',ledger:f.ledger,now:()=>NOW});
  // UNIT-TEST FIXTURE ONLY: this object is never saved as a model result.
  const {digest,...base}=dry;const value={...base,kind:'LIVE_SYNTHETIC',liveCalls:32};
  const report={...value,digest:hash(value)},review=reviewTemplate(report);
  review.reviewer='UNIT_TEST_ONLY';review.reviewedAt=new Date(NOW).toISOString();
  for(const r of review.rows){for(const d of ['math','clarity','feedback','honesty','hint','context'])if(r[d]!=='NA')r[d]=2;
   r.requiredPointsMet=true;r.criticalError=false;}
  assert.equal(score(report,review).verdict,'SMALL_SET_PASSED');
  review.rows[0].math=0;assert.equal(score(report,review).verdict,'REVISE');assert.equal(score(report,review).critical,1);
  review.rows[0].math=2;review.rows[0].hint=0;assert.equal(score(report,review).critical,1);
  review.rows[0].hint=null;assert.throws(()=>score(report,review),/REVIEW_REQUIRED/);
 }finally{f.close();}
});

test('standalone follow-up is separate from numeric attempt and baseline remains comparable',async()=>{
 for(const row of CORPUS.dialogs.filter(x=>!x.profile)){
  const r=build(row,1,fakeAnswer),payload=JSON.parse(r.prepared.body.messages[1].content);
  assert.equal(r.input.attempt,row.turns[1].attempt||'');
  assert.equal(payload.attempt,row.turns[1].attempt||'');
  assert.equal(payload.followUpQuestion,row.turns[1].followUp);
 }
 const f=fixture();try{
  const report=await run({mode:'dry-run',ledger:f.ledger,now:()=>NOW});
  assert.equal(report.results.length,32);
  const d04=report.results.find(x=>x.id==='d04-t2');
  assert.equal(d04.baseline.attemptStatus,'incorrect');
  assert.equal(d04.baseline.apiCostUsd,0);
  assert(report.results.every(x=>x.automaticAssessment===null));
 }finally{f.close();}
});

test('favourable human scores cannot override wrong mathematics or a leaked hint',async()=>{
 const f=fixture();try{
  const dry=await run({mode:'dry-run',ledger:f.ledger,now:()=>NOW});
  for(const [id,answer] of [
   ['d04-t2',{title:'Уравнение',text:'Значение x равно 6.',steps:['x = 6'],check:'Проверь подстановкой.'}],
   ['d04-t1',{title:'Подсказка',text:'Значение x равно −5.',steps:['x = −5'],check:'Проверь подстановкой.'}],
   ['d04-t2',{title:'Ошибка формата',text:'Пример',steps:[],check:'Проверь.'}]
  ]){
   const {digest,...base}=structuredClone(dry);base.kind='LIVE_SYNTHETIC';base.liveCalls=32;
   base.results.find(x=>x.id===id).answer=answer;
   const report={...base,digest:hash(base)},review=reviewTemplate(report);
   review.reviewer='UNIT_TEST_ONLY';review.reviewedAt=new Date(NOW).toISOString();
   for(const r of review.rows){for(const k of ['math','clarity','feedback','honesty','hint','context'])if(r[k]!=='NA')r[k]=2;
    r.requiredPointsMet=true;r.criticalError=false;}
   const result=score(report,review);assert.equal(result.verdict,'REVISE');assert(result.critical>=1);
  }
 }finally{f.close();}
});
