(function(root){
'use strict';
const PREFIX='mathExam.profile.partTwo.v1.';
const safe=id=>typeof id==='string'&&/^[a-z0-9_-]{1,100}$/.test(id);
const plain=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const fresh=id=>({version:1,taskId:id,drafts:{final:[],steps:[],proof:''},solvedSteps:[],hints:[],proofChecks:[],attempts:[],attemptCount:0,wrong:0,helped:false,solution:false,solutionSteps:0,completed:false,independent:false,updatedAt:0});
function valid(v,id){return plain(v)&&v.version===1&&v.taskId===id&&plain(v.drafts)&&Array.isArray(v.drafts.final)&&v.drafts.final.length<=20&&v.drafts.final.every(x=>typeof x==='string'&&x.length<=500)&&Array.isArray(v.drafts.steps)&&v.drafts.steps.length<=100&&v.drafts.steps.every(x=>typeof x==='string'&&x.length<=500)&&typeof v.drafts.proof==='string'&&v.drafts.proof.length<=12000&&['solvedSteps','hints','proofChecks'].every(k=>Array.isArray(v[k])&&v[k].length<=100&&v[k].every(n=>Number.isInteger(n)&&n>=0&&n<100))&&v.solvedSteps.every((n,i)=>n===i)&&Array.isArray(v.attempts)&&v.attempts.length<=60&&v.attempts.every(a=>plain(a)&&typeof a.id==='string'&&typeof a.kind==='string'&&Array.isArray(a.answers)&&a.answers.length<=20&&a.answers.every(x=>typeof x==='string'&&x.length<=500)&&typeof a.correct==='boolean'&&typeof a.helped==='boolean'&&Number.isFinite(a.at))&&['attemptCount','wrong','updatedAt','solutionSteps'].every(k=>Number.isFinite(v[k])&&v[k]>=0)&&['helped','solution','completed','independent'].every(k=>typeof v[k]==='boolean');}
function create(storage,options={}){
 const memory=new Map(),blocked=new Set();let queue=Promise.resolve(),serial=0;
 const warn=()=>{if(typeof options.onWarning==='function')options.onWarning('Не удалось сохранить часть работы в браузере. Текущая работа остаётся на экране; прежнее сохранение не перезаписано.');};
 function read(id){
  if(!safe(id))throw Error('Unknown task identifier');
  if(blocked.has(id))return structured(memory.get(id)||fresh(id));
  try{const raw=storage&&storage.getItem(PREFIX+id);if(raw){const value=JSON.parse(raw);if(!valid(value,id)||(options.validate&&!options.validate(value,id)))throw Error('Invalid saved work');memory.set(id,value);return structured(value);}}
  catch(_){blocked.add(id);warn();}
  return structured(memory.get(id)||fresh(id));
 }
 function structured(v){return JSON.parse(JSON.stringify(v));}
 function patch(id,change){
  const run=async()=>{const action=()=>{const v=read(id);change(v);v.updatedAt=Date.now();if(!valid(v,id))throw Error('Invalid work update');memory.set(id,v);if(!blocked.has(id)){try{if(!storage)throw Error('No browser storage');storage.setItem(PREFIX+id,JSON.stringify(v));}catch(_){blocked.add(id);warn();}}return structured(v);};
   return options.locks?.request?options.locks.request(PREFIX+id,action):action();};
  const result=queue.then(run);queue=result.catch(()=>{});return result;
 }
 function attempt(id,{kind,answers,correct,mode,independentEligible=false}){return patch(id,v=>{
  const record={id:String(Date.now())+'-'+(++serial),kind,answers:answers.map(x=>String(x).slice(0,500)),correct:!!correct,helped:v.helped||mode!=='independent',at:Date.now()};
  v.attemptCount++;if(!correct)v.wrong++;v.attempts.push(record);
  // Preserve the first submission and the most recent 59. This is a bounded
  // attempt trace, not an unbounded learner-history export.
  if(v.attempts.length>60)v.attempts.splice(1,v.attempts.length-60);
  if(kind==='final'&&correct){v.completed=true;if(mode==='independent'&&!v.helped&&independentEligible)v.independent=true;}
 });}
 return {read,patch,attempt,flush:()=>queue,key:id=>PREFIX+id};
}
function canonical(value){return String(value).trim().toLowerCase().replace(/−|–/g,'-').replace(/\s+/g,'').replace(/\\pi|\bpi\b/g,'π').replace(/\\infty|infinity|бесконечность/g,'∞').replace(/(?:x|а|a)∈/g,'').replace(/или|∪/g,'U').replace(/\+∞/g,'∞').replace(/[{}]/g,'');}
function matches(answers,input,checker){
 if(!String(input).trim())return false;
 return (answers||[]).some(answer=>{
  if(checker?.check(answer,input,undefined,{strictNumeric:true}))return true;
  const expected=canonical(answer),actual=canonical(input);
  if(expected===actual)return true;
  // Only finite lists of numeric roots are unordered. Interval endpoints,
  // inequalities and formula strings retain their original structure.
  const a=expected.split(';'),b=actual.split(';');
  if(a.length>1&&a.length===b.length&&checker&&a.every(s=>Number.isFinite(checker.number(s)))&&b.every(s=>Number.isFinite(checker.number(s)))){
   const x=a.map(checker.number).sort((u,v)=>u-v),y=b.map(checker.number).sort((u,v)=>u-v);return x.every((v,i)=>Math.abs(v-y[i])<=1e-9);
  }
  const u=expected.split('U'),w=actual.split('U');return u.length>1&&u.length===w.length&&u.sort().every((s,i)=>s===w.sort()[i]);
 });
}
function summary(storage,lessons){
 const result={total:0,completed:0,independent:0,assisted:0,proofPending:0,started:0,unavailable:0,sections:{}};
 for(const lesson of lessons||[]){const section=result.sections[lesson.exam]||(result.sections[lesson.exam]={total:0,completed:0,independent:0,assisted:0,proofPending:0,started:0});
  for(const task of lesson.tasks||[]){result.total++;section.total++;try{const raw=storage?.getItem(PREFIX+task.id);if(!raw)continue;const v=JSON.parse(raw);if(!valid(v,task.id)||v.solvedSteps.length>task.steps.length||v.drafts.steps.length>task.steps.length||v.drafts.final.length>task.final.length)throw Error();if(v.updatedAt){result.started++;section.started++;}if(v.completed){result.completed++;section.completed++;if(v.independent){result.independent++;section.independent++;}else{result.assisted++;section.assisted++;}if(task.proof){result.proofPending++;section.proofPending++;}}}catch(_){result.unavailable++;}}
 }
 return result;
}
const api={create,valid,matches,canonical,summary,PREFIX};root.ProfilePartTwoState=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
