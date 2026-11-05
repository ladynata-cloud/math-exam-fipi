import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {pathToFileURL} from 'node:url';
import {ROOT,hash,manifest,verifySources,current,privacy,cabinets,dialogue,adapter,validateModelAnswer,answerFitsDialogue,assessAnswer} from './source.mjs';
import {CampaignLedger} from './ledger.mjs';
export const CORPUS=JSON.parse(fs.readFileSync(path.join(ROOT,'cases.json'),'utf8'));
export const MODEL='gpt-5.4-mini-2026-03-17';
export const PRICE_DATE=Date.parse('2026-11-02T00:00:00Z');
export const PRICE_EXPIRY=Date.parse('2026-11-09T00:00:00Z');
export const CONFIG=Object.freeze({mode:'api',provider:'openai',providerUrl:'https://api.openai.com/v1/chat/completions',
 model:MODEL,currency:'USD',apiKey:'',maxInputTokens:16000,maxOutputTokens:500,inputPriceMicros:750000,
 outputPriceMicros:4500000,timeoutMs:15000,maxResponseBytes:65536,priceReviewedAt:PRICE_DATE,priceValidUntil:PRICE_EXPIRY});
export const CAP=500000;
const requireTrue=(v,code)=>{if(!v)throw Error(code);};
const codeOf=e=>/^[A-Z][A-Z0-9_]{0,90}$/.test(e.code||e.message||'')?(e.code||e.message):'EVAL_STOPPED';
export const fakeAnswer={title:'Симуляция',text:'Синтетическая заглушка транспорта; это не ответ GPT.',
 steps:['Выбери одно действие.'],check:'Математическое качество не измерено.'};
export function envelope(answer=fakeAnswer){
 return {model:MODEL,service_tier:'default',choices:[{finish_reason:'stop',message:{content:JSON.stringify(answer)}}],
  usage:{prompt_tokens:300,completion_tokens:90,total_tokens:390}};
}
export const mockFetch=async()=>Response.json(envelope());
export function build(row,index,previous=null,config=CONFIG,now=PRICE_DATE){
 const turn=row.turns[index];let input,cards,builder;
 const attempt=turn.attempt||'';
 if(row.profile){
  ({input,cards}=cabinets.prepareCabinetQuestion({profileId:row.profile,topic:row.topic,question:row.question,
   attempt,mode:turn.mode==='explain'?'full':'hint',hintLevel:turn.hintLevel,simpler:turn.simpler}));
  builder=index>0?dialogue.dialogueMessageBuilder({question:turn.followUp,
   turns:[{question:row.question,answer:validateModelAnswer(previous)}]}):cabinets.buildCabinetMessages;
 }else{
  input={...privacy.parseQuestion({topic:row.topic,question:row.question,attempt,mode:turn.mode,
   hintLevel:turn.hintLevel,externalConsent:true,requestId:'00000000-0000-4000-8000-000000000001'},
   current.listProviderTopics().map(t=>t.id)),simpler:turn.simpler};
  cards=current.getBuiltinKnowledge().filter(c=>c.topic===input.topic).slice(0,3);
  builder=(safe,knowledge)=>{
   const messages=current.buildMessages(safe,knowledge);
   if(index>0){const payload=JSON.parse(messages[1].content);
    messages[1].content=JSON.stringify({...payload,followUpQuestion:turn.followUp});}
   return messages;
  };
 }
 return {input,cards,prepared:adapter.prepareRequest(config,input,cards,now,builder),
  contextMode:row.profile?'cabinet-previous-turn':'original-task-and-latest-attempt-only'};
}
export function plan(){
 verifySources();
 const fileHashes=Object.fromEntries(['evaluate.mjs','source.mjs','ledger.mjs','sources.json','cases.json'].map(f=>[f,hash(fs.readFileSync(path.join(ROOT,f)))]));
 const p={campaignId:CORPUS.id,model:MODEL,currentCommit:manifest.currentCommit,adapterCommit:manifest.adapterCommit,
  fileHashes,sourceManifestHash:hash(manifest),corpusHash:hash(CORPUS),maxCalls:32,budgetMicros:CAP,
  maximumReservationMicros:32*14250,concurrency:1,retries:0,maxDurationMs:600000,
  maxOutputTokens:500,priceDate:PRICE_DATE,priceExpiry:PRICE_EXPIRY,syntheticOnly:true,pupilAccess:false};
 return {...p,digest:hash(p)};
}
export function coverage(){
 return CORPUS.coverageProbes.map(r=>{
  let reason=null;const t=current.listTopics().find(t=>t.id===r.topic);
  try{current.buildMessages({topic:r.topic,question:r.question,mode:'explain',hintLevel:1,attempt:''});}
  catch(e){reason=codeOf(e);}
  let local=null;try{local=current.answerOffline({topic:r.topic,question:r.question,attempt:r.reference,mode:'explain'});}catch{}
  return {...r,apiRoute:reason?'BLOCKED':'ACCEPTED',reason,localTopicExists:Boolean(t),
   localVerification:local?.verification||null,localAttemptStatus:local?.attemptStatus||null,
   localAnswer:local?{title:local.title,text:local.text,steps:local.steps,check:local.check}:null,
   modelQuality:'NOT_MEASURED',apiCostUsd:0};
 });
}
export function pending(p=plan()){
 return {status:'pending',planDigest:p.digest,checkedAt:null,expiresAt:null,grantExpiresAt:null,
  availableGrantUsd:null,organizationName:'mathexam',organizationId:null,projectId:null,
  ownerRequest:'ccfece5c-6513-4778-92b8-175963b34c7e',eligibilityEvidence:null,
  checks:{activeGrant:false,correctOrganization:false,eligibleModelAndEndpoint:false,supportedAccessConfirmed:false,
   syntheticDataOnly:false,pricesReviewed:false,autoRechargeOff:false,noOtherGrantConsumption:false,
   durableStateReviewed:false,technicalReviewComplete:false}};
}
export function validateAccount(c,p,now=Date.now()){
 requireTrue(c?.status==='ready'&&c.planDigest===p.digest,'EVAL_ACCOUNT_NOT_READY');
 requireTrue(Object.keys(pending(p).checks).every(k=>c.checks?.[k]===true),'EVAL_ACCOUNT_CHECKS_REQUIRED');
 requireTrue(typeof c.availableGrantUsd==='number'&&Number.isFinite(c.availableGrantUsd)&&c.availableGrantUsd>=.5&&c.organizationName==='mathexam','EVAL_GRANT_REQUIRED');
 requireTrue(/^org-[A-Za-z0-9_-]{8,100}$/.test(c.organizationId||'')&&/^proj_[A-Za-z0-9_-]{8,100}$/.test(c.projectId||''),'EVAL_ACCOUNT_REQUIRED');
 const start=Date.parse(c.checkedAt),end=Date.parse(c.expiresAt);
 requireTrue(start<=now&&now<end&&end<=start+86400000&&now>=PRICE_DATE&&end<=PRICE_EXPIRY
  &&end<=Date.parse(c.grantExpiresAt)&&end<=Date.parse('2026-11-30T00:00:00Z'),'EVAL_ACCOUNT_EXPIRED');
 requireTrue(typeof c.eligibilityEvidence==='string'&&c.eligibilityEvidence.length>=20,'EVAL_GEOGRAPHY_EVIDENCE_REQUIRED');
 requireTrue(c.ownerRequest==='ccfece5c-6513-4778-92b8-175963b34c7e','EVAL_SCOPE_REQUIRED');
}
function write(file,value){fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n',{mode:0o600});}
export function reviewTemplate(report){
 return {reportDigest:report.digest,reviewer:'',reviewedAt:null,rows:report.results.map(r=>({
  id:r.id,math:null,clarity:null,feedback:null,hint:r.turn===1?null:'NA',
  context:r.contextMode==='cabinet-previous-turn'&&r.turn===2?null:'NA',
  honesty:null,requiredPointsMet:null,criticalError:null,notes:''}))};
}
export function score(report,review){
 const {digest,...rest}=report;requireTrue(hash(rest)===digest&&review.reportDigest===digest,'EVAL_REPORT_MISMATCH');
 requireTrue(report.kind==='LIVE_SYNTHETIC'&&report.status==='completed'&&report.liveCalls===32
  &&report.results.length===32,'EVAL_NOT_REVIEWABLE');
 requireTrue(review.reviewer&&Number.isFinite(Date.parse(review.reviewedAt))&&review.rows?.length===32,'EVAL_REVIEW_REQUIRED');
 const ids=new Set();let passed=0,critical=0;
 for(const result of report.results){
  const r=review.rows.find(x=>x.id===result.id);requireTrue(r&&!ids.has(r.id),'EVAL_REVIEW_REQUIRED');ids.add(r.id);
  const dims=['math','clarity','feedback','honesty',...(result.turn===1?['hint']:[]),
   ...(result.contextMode==='cabinet-previous-turn'&&result.turn===2?['context']:[])];
  for(const key of ['math','clarity','feedback','honesty','hint','context'])
   requireTrue(dims.includes(key)?Number.isInteger(r[key])&&r[key]>=0&&r[key]<=2:r[key]==='NA','EVAL_REVIEW_REQUIRED');
  requireTrue(typeof r.requiredPointsMet==='boolean'&&typeof r.criticalError==='boolean','EVAL_REVIEW_REQUIRED');
  const row=CORPUS.dialogs.find(x=>x.id===result.dialog);
  requireTrue(row&&[1,2].includes(result.turn)&&result.id===row.id+'-t'+result.turn,'EVAL_REPORT_CASE_INVALID');
  const input={topic:row.topic,question:row.question,mode:row.turns[result.turn-1].mode};
  const automatic=assessAnswer(input,result.answer);
  const bad=automatic.blocksPositiveReview||(result.turn===1&&automatic.mathematics.finalAnswer==='matched')||r.criticalError||r.math===0||r.honesty===0||(result.turn===1&&r.hint===0);
  if(bad)critical++;
  if(!bad&&r.math===2&&r.requiredPointsMet&&dims.every(d=>r[d]>=1)&&dims.reduce((s,k)=>s+r[k],0)>=.8*2*dims.length)passed++;
 }
 return {passed,total:32,critical,verdict:passed>=29&&critical===0?'SMALL_SET_PASSED':'REVISE',
  pupilAccessAuthorized:false,fullCourseCoverage:false};
}
export async function run({mode,ledger,account=null,fetchImpl,now=Date.now,save=()=>{}}){
 requireTrue(['live','dry-run'].includes(mode),'EVAL_MODE_INVALID');
 requireTrue(mode!=='live'||typeof fetchImpl==='function','EVAL_EXPLICIT_TRANSPORT_REQUIRED');
 fetchImpl=fetchImpl||mockFetch;
 const p=plan();if(mode==='live')validateAccount(account,p,now());
 const results=[],start=now();let id;const config={...CONFIG,apiKey:mode==='live'?process.env.MATHEXAM_OPENAI_TRIAL_KEY:''};
 const deadline=mode==='live'?Math.min(start+600000,Date.parse(account.expiresAt)):start+600000;
 ledger.start({planDigest:p.digest,approvalDigest:mode==='live'?hash(account):null,mode,maxRequests:32,totalBudgetMicros:CAP,startedAt:start,deadlineAt:deadline});
 const cov=coverage();
 function report(){
  const snap=ledger.snapshot();const completed=snap.rows.filter(x=>x.status==='completed');
  const usageEstimateMicros=completed.reduce((n,r)=>n+Math.ceil(.75*r.usage.prompt_tokens+4.5*r.usage.completion_tokens),0);
  const x={kind:mode==='live'?'LIVE_SYNTHETIC':'SIMULATION_NOT_MODEL_OUTPUT',model:MODEL,planDigest:p.digest,
   currentCommit:p.currentCommit,adapterCommit:p.adapterCommit,status:snap.campaign.status,
   liveCalls:mode==='live'?snap.rows.length:0,simulatedCalls:mode==='dry-run'?snap.rows.length:0,
   reservedMicros:mode==='live'?snap.campaign.reservedMicros:0,
   reportedUsageEstimateMicros:mode==='live'?usageEstimateMicros:0,
   costNote:'Estimate, not an invoice. Failed requests retain reservations and may be billed.',
   quality:mode==='live'?'HUMAN_REVIEW_REQUIRED':'NOT_MEASURED',results,coverage:cov,error:snap.campaign.errorCode,
   deploymentAuthorized:false,pupilAccessAuthorized:false};
  return {...x,digest:hash(x)};
 }
 try{
  save(report());
  for(const row of CORPUS.dialogs){
   let previous=null;
   for(let index=0;index<2;index++){
    id=row.id+'-t'+(index+1);verifySources();
    requireTrue(plan().digest===p.digest,'EVAL_SOURCE_CHANGED');
    if(mode==='live')validateAccount(account,p,now());
    requireTrue(now()+CONFIG.timeoutMs<deadline,'EVAL_DEADLINE');
    const r=build(row,index,previous,config,mode==='live'?now():PRICE_DATE);
    ledger.reserve({caseId:id,requestDigest:hash(r.prepared.body),reservedMicros:r.prepared.reservedMicros,now:now()});
    const started=now();
    const v=await adapter.callProvider({config,...r,fetchImpl});
    previous=validateModelAnswer({title:v.answer.title,text:v.answer.text,steps:v.answer.steps,check:v.answer.check});
    // Keep mathematics intact; reject an answer that cannot be carried into
    // a bounded follow-up, including expansion during NFKC normalization.
    requireTrue(!row.profile||answerFitsDialogue(previous,index?row.turns[index].followUp:row.question),'EVAL_DIALOGUE_ANSWER_LIMIT');
    ledger.complete({caseId:id,...v,latencyMs:Math.max(0,now()-started),now:now()});
    const automatic=assessAnswer(r.input,previous);
    const local=row.profile?cabinets.answerCabinetOffline(r.input,r.cards):current.answerOffline(r.input);
    const baseline={answer:{title:local.title,text:local.text,steps:local.steps,check:local.check},
     verification:local.verification,attemptStatus:local.attemptStatus,apiCostUsd:0,
     followUpUnderstanding:'NOT_TESTED'};
    results.push({id,dialog:row.id,turn:index+1,grade:row.grade,label:row.label,input:r.input,
     contextMode:r.contextMode,payload:r.prepared.body,requestHash:hash(r.prepared.body),
     reference:row.reference,answer:previous,usage:v.usage,baseline,
     automaticAssessment:mode==='live'?automatic:null,
     usageEstimateMicros:mode==='live'?Math.ceil(.75*v.usage.prompt_tokens+4.5*v.usage.completion_tokens):0,
     mathematicalVerdict:mode==='live'?(automatic.blocksPositiveReview?'AUTOMATIC_REJECTION':'HUMAN_REVIEW_REQUIRED'):'NOT_MEASURED'});
    save(report());
   }
  }
  ledger.finish(now());
 }catch(e){ledger.fail({caseId:id,code:codeOf(e),now:now()});}
 const final=report();save(final);return final;
}
export async function audit(){
 const rows=[];
 for(const d of CORPUS.dialogs)for(let i=0;i<2;i++){
  const r=build(d,i,i?fakeAnswer:null);rows.push({id:d.id+'-t'+(i+1),inputBound:r.prepared.inputBound,
   reservationMicros:r.prepared.reservedMicros,contextMode:r.contextMode,payload:r.prepared.body});
 }
 const row=CORPUS.dialogs.find(r=>r.id==='d04'),r=build(row,0);
 const fabricated={title:'Подсказка',text:'Значение x равно 6.',steps:['Запиши x = 6.'],check:'Можно продолжить.'};
 let accepted=false;try{await adapter.callProvider({config:CONFIG,...r,fetchImpl:async()=>Response.json(envelope(fabricated))});accepted=true;}catch{}
 const cabinet=CORPUS.dialogs.find(r=>r.profile);
 const historyBoundaryCases=[
  {id:'nfkc-expansion',answer:{title:'Шаг',text:'㍍'.repeat(300),steps:['Проверь действие.'],check:'Подумай.'}},
  {id:'cyrillic-envelope',answer:{title:'Шаг',text:'П'.repeat(1600),steps:['П'.repeat(90)],check:'Подумай.'}}
 ].map(({id,answer})=>{
  let answerValid=false,historyCode=null;
  try{validateModelAnswer(answer);answerValid=true;build(cabinet,1,answer);}catch(e){historyCode=codeOf(e);}
  return {id,answerValid,historyCode,rejectedByDialogueGuard:!answerFitsDialogue(answer,cabinet.question)};
 });
 return {plan:plan(),calls:rows.length,liveCalls:0,modelQuality:'NOT_MEASURED',
  planningReservationWithPlaceholderMicros:rows.reduce((n,r)=>n+r.reservationMicros,0),
  findings:{fabricatedWrongFinalAnswerPassesSchema:accepted,
   fabricatedWrongFinalAnswerBlockedByAssessment:assessAnswer(r.input,fabricated).blocksPositiveReview,
   correctChainedEquationAccepted:!assessAnswer({...r.input,mode:'explain'},
    {title:'Уравнение',text:'Вычтем 4 из обеих частей.',steps:['−3x = 19 − 4 = 15','x = −5'],check:'−3 · (−5) + 4 = 19'}).blocksPositiveReview,
   schemaValidAnswerCanExceedDialogueLimit:historyBoundaryCases.some(r=>r.answerValid&&r.historyCode==='CABINET_DIALOGUE_LIMIT'),
   historyBoundaryCases,standalonePreviousTurnsAbsent:rows.filter(r=>r.contextMode==='original-task-and-latest-attempt-only').every(r=>!r.payload.messages.some(m=>m.content.includes('previousTurns')))},
  requests:rows,coverage:coverage()};
}
async function main(){
 const command=process.argv[2]||'audit',out=path.join(ROOT,'results');
 if(command==='audit'){const a=await audit();write(path.join(out,'audit.json'),a);write(path.join(out,'preflight.pending.json'),pending(a.plan));
  console.log(JSON.stringify({calls:a.calls,liveCalls:0,findings:a.findings,coverage:a.coverage.map(r=>({id:r.id,apiRoute:r.apiRoute,local:r.localVerification})),plan:a.plan.digest}));return;}
 if(command==='score'){const dir=process.env.MATHEXAM_EVAL_STATE_DIR;requireTrue(dir&&path.isAbsolute(dir),'EVAL_DURABLE_STATE_REQUIRED');
  const r=score(JSON.parse(fs.readFileSync(path.join(dir,'live.json'))),JSON.parse(fs.readFileSync(path.join(dir,'scores.json'))));
  write(path.join(dir,'scores-summary.json'),r);console.log(JSON.stringify(r));return;}
 requireTrue(['dry-run','live'].includes(command),'EVAL_ARGUMENT_INVALID');
 const live=command==='live';let account=null,folder,transport=mockFetch;
 if(live){
  requireTrue(!process.env.CI&&!process.env.GITHUB_ACTIONS,'EVAL_EPHEMERAL_CI_LIVE_DISABLED');
  requireTrue(process.env.MATHEXAM_OPENAI_TRIAL_ALLOW==='1','EVAL_LIVE_DISABLED');
  requireTrue(/^[\x21-\x7e]{16,2048}$/.test(process.env.MATHEXAM_OPENAI_TRIAL_KEY||''),'EVAL_PROTECTED_KEY_REQUIRED');
  folder=process.env.MATHEXAM_EVAL_STATE_DIR;requireTrue(folder&&path.isAbsolute(folder),'EVAL_DURABLE_STATE_REQUIRED');
  account=JSON.parse(fs.readFileSync(path.join(ROOT,'preflight.local.json'),'utf8'));validateAccount(account,plan());
  transport=async(url,opts)=>{
   requireTrue(url===CONFIG.providerUrl&&opts.redirect==='error'&&opts.method==='POST','EVAL_ENDPOINT_CHANGED');
   return fetch(url,{...opts,headers:{...opts.headers,'OpenAI-Organization':account.organizationId,'OpenAI-Project':account.projectId}});
  };
 }else folder=fs.mkdtempSync(path.join(os.tmpdir(),'mathexam-quality-dry-'));
 const ledger=new CampaignLedger(path.join(folder,'campaign.sqlite'));
 try{
  const r=await run({mode:command,ledger,account,fetchImpl:transport,save:r=>write(path.join(live?folder:out,live?'live.json':'simulation.json'),r)});
  write(path.join(live?folder:out,'review-template.json'),reviewTemplate(r));
  console.log(JSON.stringify({status:r.status,liveCalls:r.liveCalls,simulatedCalls:r.simulatedCalls,quality:r.quality,error:r.error}));
  if(r.status!=='completed')process.exitCode=1;
 }finally{ledger.close();if(!live)fs.rmSync(folder,{recursive:true,force:true});}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)
 main().catch(e=>{console.error(JSON.stringify({status:'STOPPED',code:codeOf(e),liveResultNotClaimed:true}));process.exitCode=1;});
