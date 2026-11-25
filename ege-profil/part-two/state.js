(function(root){
'use strict';
const PREFIX='mathExam.profile.partTwo.v1.';
const safe=id=>typeof id==='string'&&/^[a-z0-9_-]{1,100}$/.test(id);
const plain=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const normalizedProof=value=>value.replace(/\r\n?/g,'\n').trim();
function proofFieldsMatch(record){
 const proof=normalizedProof(record.drafts.proof),snapshot=record.proofReviewSnapshot,checks=record.proofChecks;
 return !!proof&&snapshot?.proof===proof&&Array.isArray(snapshot.checks)&&snapshot.checks.length===checks.length&&
  snapshot.checks.every((index,position)=>index===checks[position]);
}
function proofReviewCurrent(record){
 return !Number.isInteger(record.updatedAt)&&record.proofReviewSnapshot?.savedAt===record.updatedAt&&proofFieldsMatch(record);
}
function currentProofChecks(record){return proofReviewCurrent(record)?record.proofChecks:[];}
const equationKeys = Object.freeze(['general', 'selected', 'roots']);
const statusPattern = /^(?:correct|missing|(?:missing-)?extra(?:-outside-interval|-outside-domain|-not-root)?)$/;
const own = (object, key) => Object.hasOwn(object, key);
const recordObject = value => !!value && typeof value === 'object' && !Array.isArray(value);
const smallText = value => typeof value === 'string' && value.length <= 500;

function keyed(value, validate) {
  return value === undefined || (recordObject(value) &&
    Object.entries(value).every(([key, item]) => equationKeys.includes(key) && validate(item)));
}

function validEquationState(record) {
  return keyed(record.drafts.equationFinal, smallText) && keyed(record.equationChecks, check =>
    recordObject(check) && smallText(check.value) && typeof check.status === 'string' && statusPattern.test(check.status));
}

function equationDraft(record, key) {
  return record.drafts.equationFinal?.[key] ?? '';
}

function equationCheck(record, key) {
  const check = record.equationChecks?.[key];
  return check?.value === equationDraft(record, key) ? check.status : '';
}

function updateEquationDraft(record, expected, changes) {
  if (!Object.entries(expected).every(([key, value]) => equationDraft(record, key) === value)) return 'conflict';
  let changed = false;
  for (const [key, value] of Object.entries(changes)) {
    if (!equationKeys.includes(key) || !smallText(value) || !own(expected, key)) throw new TypeError('Invalid equation field update');
    if (equationDraft(record, key) === value) continue;
    (record.drafts.equationFinal ||= {})[key] = value;
    if (record.equationChecks) delete record.equationChecks[key];
    changed = true;
  }
  return changed ? 'updated' : 'unchanged';
}

function setEquationChecks(record, visible, statuses) {
  const fields = Object.keys(visible);
  if (!fields.length || fields.length !== Object.keys(statuses).length ||
      !fields.every(key => equationKeys.includes(key) && typeof statuses[key] === 'string' && statusPattern.test(statuses[key]))) {
    throw new TypeError('Invalid equation check');
  }
  if (!fields.every(key => equationDraft(record, key) === visible[key])) return 'conflict';
  const correct = fields.every(key => statuses[key] === 'correct');
  if (correct && fields.every(key => equationCheck(record, key) === 'correct')) return 'duplicate';
  const checks = record.equationChecks ||= {};
  for (const key of fields) checks[key] = { value: visible[key], status: statuses[key] };
  return correct ? 'correct' : 'wrong';
}

const fresh=id=>({version:1,taskId:id,drafts:{final:[],steps:[],proof:''},solvedSteps:[],hints:[],proofChecks:[],attempts:[],attemptCount:0,wrong:0,helped:false,solution:false,solutionSteps:0,completed:false,independent:false,updatedAt:0});
function valid(v,id){return plain(v)&&(v.constructionStep===undefined||Number.isInteger(v.constructionStep)&&v.constructionStep>=0&&v.constructionStep<=3)&&v.version===1&&v.taskId===id&&plain(v.drafts)&&(v.drafts.openFinal===undefined||typeof v.drafts.openFinal==='string'&&v.drafts.openFinal.length<=500)&&Array.isArray(v.drafts.final)&&v.drafts.final.length<=20&&v.drafts.final.every(x=>typeof x==='string'&&x.length<=500)&&Array.isArray(v.drafts.steps)&&v.drafts.steps.length<=100&&v.drafts.steps.every(x=>typeof x==='string'&&x.length<=500)&&typeof v.drafts.proof==='string'&&v.drafts.proof.length<=12000&&validEquationState(v)&&['solvedSteps','hints','proofChecks'].every(k=>Array.isArray(v[k])&&v[k].length<=100&&v[k].every(n=>Number.isInteger(n)&&n>=0&&n<100))&&v.solvedSteps.every((n,i)=>n===i)&&Array.isArray(v.attempts)&&v.attempts.length<=60&&v.attempts.every(a=>plain(a)&&typeof a.id==='string'&&typeof a.kind==='string'&&Array.isArray(a.answers)&&a.answers.length<=20&&a.answers.every(x=>typeof x==='string'&&x.length<=500)&&typeof a.correct==='boolean'&&typeof a.helped==='boolean'&&Number.isFinite(a.at))&&['attemptCount','wrong','updatedAt','solutionSteps'].every(k=>Number.isFinite(v[k])&&v[k]>=0)&&['helped','solution','completed','independent'].every(k=>typeof v[k]==='boolean');}
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
  const run=async()=>{const action=()=>{
    const v=read(id),previousReview=v.proofReviewSnapshot,hadCurrentReview=proofReviewCurrent(v);
    if(change(v)===false)return read(id);
    const keepReview=(v.proofReviewSnapshot!==previousReview||hadCurrentReview)&&proofFieldsMatch(v);
    // Earlier versions write integer milliseconds. A bound review uses a sub-millisecond
    // stamp, so a write by an older tab is distinguishable even in the same millisecond.
    v.updatedAt=Date.now()+(keepReview ? 0.5 : 0);
    if(keepReview)v.proofReviewSnapshot.savedAt=v.updatedAt;
    else delete v.proofReviewSnapshot;
    if(!valid(v,id))throw Error('Invalid work update');
    memory.set(id,v);
    if(!blocked.has(id)){try{if(!storage)throw Error('No browser storage');storage.setItem(PREFIX+id,JSON.stringify(v));}catch(_){blocked.add(id);warn();}}
    return structured(v);
   };
   return options.locks?.request?options.locks.request(PREFIX+id,action):action();};
  const result=queue.then(run);queue=result.catch(()=>{});return result;
 }
 function recordAttempt(v,{kind,answers,correct,mode,independentEligible}){
  const record={id:String(Date.now())+'-'+(++serial),kind,answers:answers.map(x=>String(x).slice(0,500)),correct:!!correct,helped:v.helped||mode!=='independent',at:Date.now()};
  v.attemptCount++;if(!correct)v.wrong++;v.attempts.push(record);
  // Preserve the first submission and the most recent 59. This is a bounded
  // attempt trace, not an unbounded learner-history export.
  if(v.attempts.length>60)v.attempts.splice(1,v.attempts.length-60);
  if(kind==='final'&&correct){v.completed=true;if(mode==='independent'&&!v.helped&&independentEligible)v.independent=true;}
 }
 function finishEquation(v,visible,statuses,{mode,independentEligible}){
  const outcome=setEquationChecks(v,visible,statuses);
  if(outcome==='correct'||outcome==='wrong')recordAttempt(v,{kind:'final',answers:Object.values(visible).map(value=>value.trim()),correct:outcome==='correct',mode,independentEligible});
  return outcome;
 }
 function attempt(id,{kind,answers,correct,mode,independentEligible=false,openFinal=false,saveFinalDraft=false}){return patch(id,v=>{
  if(kind==='final'&&saveFinalDraft){
   if(openFinal){
    const previous=v.attempts.at(-1);
    if(correct&&previous?.kind==='final'&&previous.correct&&previous.answers.length===1&&previous.answers[0]===answers[0])return;
    v.drafts.openFinal=answers[0];
   }else v.drafts.final=answers;
  }
  recordAttempt(v,{kind,answers,correct,mode,independentEligible});
 });}
 return {read,patch,attempt,finishEquation,flush:()=>queue,key:id=>PREFIX+id};
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
function parseEndpoint(raw,interval){
 const text=raw.trim();
 if(interval&&/^[+-]?(?:∞|\\infty|inf(?:inity)?)$/.test(text))return text.startsWith('-')?-Infinity:Infinity;
 const match=/^([+-]?)(\d*)(?:[.,](\d+))?(?:\s*\/\s*([+-]?\d+))?$/.exec(text);
 if(!match||(!match[2]&&!match[3]))return null;
 const fraction=match[3]||'';
 let numerator=BigInt(match[2]+fraction)*(match[1]==='-'?-1n:1n);
 let denominator=10n**BigInt(fraction.length)*BigInt(match[4]??1);
 if(!denominator)return null;
 if(denominator<0n){numerator=-numerator;denominator=-denominator;}
 return {numerator,denominator};
}
function compare(a,b){
 if(a===b)return 0;
 if(a===-Infinity||b===Infinity)return -1;
 if(a===Infinity||b===-Infinity)return 1;
 const difference=a.numerator*b.denominator-b.numerator*a.denominator;
 return difference<0n?-1:difference>0n?1:0;
}
function normalizeAnswerSet(value,rootList){
  const source=String(value).trim().toLowerCase().replace(/[−–]/g,'-').replace(/^x\s*∈\s*/,'');
  if(/^(?:∅|нет(?: корней| решений)?|\{\s*\})$/.test(source))return [];
  if(!source)return null;
  const intervals=rootList?[source.startsWith('{')&&source.endsWith('}')?source.slice(1,-1):source]:
   source.split(/∪|или|\\cup|\bu\b/u);
  const spans=[];
  for(const term of intervals){
   const points=/^\s*\{([^}]+)\}\s*$/.exec(term);
   if(rootList||points){
    for(const raw of (points?.[1]??term).split(';')){
     const point=parseEndpoint(raw,false);
     if(point===null)return null;
     spans.push({lo:point,hi:point,left:true,right:true});
    }
    continue;
   }
   const interval=/^\s*([[(])([^;]+);([^;]+)([)\]])\s*$/.exec(term);
   if(!interval)return null;
   const lo=parseEndpoint(interval[2],true),hi=parseEndpoint(interval[3],true);
   const left=interval[1]==='[',right=interval[4]===']';
   if(lo===null||hi===null||lo===Infinity||hi===-Infinity||lo===-Infinity&&left||hi===Infinity&&right||compare(lo,hi)>0)return null;
   if(compare(lo,hi)<0||left&&right)spans.push({lo,hi,left,right});
  }
  spans.sort((a,b)=>compare(a.lo,b.lo)||Number(b.left)-Number(a.left));
  const joined=[];
  for(const span of spans){
   const last=joined.at(-1),overlap=last?compare(span.lo,last.hi):1;
   if(overlap>0||overlap===0&&!last.right&&!span.left){joined.push(span);continue;}
   const end=compare(span.hi,last.hi);
   if(end>0){last.hi=span.hi;last.right=span.right;}
   if(end===0)last.right ||= span.right;
  }
  return joined;
}
function openAnswer(field,input){
 const rootList=field.excluded!==undefined;
 const normalize=value=>normalizeAnswerSet(value,rootList);
 const actual=normalize(input);
 if(!actual)return {recognized:false,correct:false};
 const correct=field.answers.some(answer=>{
  const expected=normalize(answer);
  return expected?.length===actual.length&&expected.every((span,i)=>{
   const given=actual[i];
   return span.left===given.left&&span.right===given.right&&compare(span.lo,given.lo)===0&&compare(span.hi,given.hi)===0;
  });
 });
 const excluded=rootList?parseEndpoint(String(field.excluded),false):null;
 const hint=excluded&&actual.some(span=>compare(span.lo,excluded)===0)
  ?'Одна из записанных точек обращает исходный знаменатель в нуль. Подставьте каждый кандидат в исходное уравнение.'
  :field.feedback;
 return {recognized:true,correct,hint};
}
const answerFormats={
 number:'Введите число или выражение с конечным действительным значением: 3/4, π/6, sqrt(2). Деление на ноль и корень из отрицательного числа недопустимы.',
 'yes-no':'Введите «да» или «нет».',
 constraint:'Запишите ограничение на t: знак сравнения и число, например t < 1.',
 monotonicity:'Введите «возрастает», «убывает» или другой вид монотонности: «не возрастает», «не убывает», «постоянна».',
 relation:'Введите знак сравнения: >, <, ≥, ≤, = или ≠. Можно использовать >=, <=, !=.',
 position:'Введите «внутри», «на границе» или «вне».',
 'number-or-none':'Введите конечное действительное число или «нет».',
 'number-or-infinity':'Введите конечное число либо «бесконечно много» или ∞.',
 'parameter-set':'Запишите множество значений a: неравенство, промежуток, отдельные точки или ∅. В промежутках разделяйте границы знаком ; и используйте целые числа, десятичные числа или дроби.',
 'solution-set':'Запишите множество решений: неравенство, промежуток, отдельные точки или «нет решений». В промежутках разделяйте границы знаком ; и используйте целые числа, десятичные числа или дроби.',
 'root-set':'Перечислите корни через ; или введите ∅. Используйте целые числа, десятичные числа или дроби.',
 'interval-set':'Запишите промежутки с границами через ; и объединением ∪. Используйте целые числа, десятичные числа, дроби и ∞; отдельную точку заключите в {}.'
};
function recognize(field,input,checker){
 // Format is authored for the field, never inferred from its correct answers.
 // A syntactically valid but mathematically wrong choice remains an attempt.
 const type=field.answerFormat||'number';
 const source=String(input??'').trim().toLowerCase().replace(/[−–]/g,'-');
 const compact=source.replace(/\s+/g,'').replace(/≥/g,'>=').replace(/≤/g,'<=').replace(/≠/g,'!=');
 const finite=value=>!!value&&Number.isFinite(checker?.number(value));
 const relation=/^(?:[<>]=?|!?=)$/;
 const empty=/^(?:∅|нет(?:корней|решений)?|пустоемножество|\{\})$/;
 const infinity=/^(?:\+?∞|бесконечномного|бесконечность|infinity|\\infty)$/;
 function inequality(variable,implicit=false){
  const text=variable==='a'?compact.replace(/а/g,'a'):compact;
  const value=implicit&&/^[<>=!]/.test(text)?variable+text:text;
  const parts=value.split(/(<=|>=|!=|[<>=])/);
  if(parts.length!==3&&parts.length!==5)return false;
  if(parts.filter((part,i)=>i%2===0&&part===variable).length!==1)return false;
  return parts.every((part,i)=>i%2?relation.test(part):part===variable||finite(part));
 }
 function set(variable){
  const value=source.replace(new RegExp('^['+(variable==='a'?'aа':'x')+']\\s*∈\\s*'),'');
  return empty.test(compact)||/^(?:r|ℝ)$/.test(compact)||inequality(variable)||
   normalizeAnswerSet(value,false)!==null||normalizeAnswerSet(value,true)!==null;
 }
 let recognized=false;
 if(source)switch(type){
  case 'number':recognized=finite(source);break;
  case 'yes-no':recognized=/^(?:да|нет)$/.test(compact);break;
  case 'constraint':recognized=inequality('t',true);break;
  case 'monotonicity':recognized=/^(?:возрастает|убывает|невозрастает|неубывает|постоянна)$/.test(compact);break;
  case 'relation':recognized=relation.test(compact);break;
  case 'position':recognized=/^(?:внутри|награнице|вне)$/.test(compact);break;
  case 'number-or-none':recognized=compact==='нет'||finite(source);break;
  case 'number-or-infinity':recognized=infinity.test(compact)||finite(source);break;
  case 'parameter-set':recognized=set('a');break;
  case 'solution-set':recognized=set('x');break;
  case 'root-set':recognized=normalizeAnswerSet(source,true)!==null;break;
  case 'interval-set':recognized=normalizeAnswerSet(source,false)!==null;break;
 }
 return {recognized,format:field.format||answerFormats[type]||'Проверьте формат, указанный у поля.'};
}
function summary(storage,lessons){
 const result={total:0,completed:0,independent:0,assisted:0,proofPending:0,started:0,unavailable:0,sections:{}};
 for(const lesson of lessons||[]){const section=result.sections[lesson.exam]||(result.sections[lesson.exam]={total:0,completed:0,independent:0,assisted:0,proofPending:0,started:0});
  for(const task of lesson.tasks||[]){result.total++;section.total++;try{const raw=storage?.getItem(PREFIX+task.id);if(!raw)continue;const v=JSON.parse(raw);if(!valid(v,task.id)||v.solvedSteps.length>task.steps.length||v.drafts.steps.length>task.steps.length||v.drafts.final.length>task.final.length)throw Error();if(v.updatedAt){result.started++;section.started++;}if(v.completed){result.completed++;section.completed++;if(v.independent){result.independent++;section.independent++;}else{result.assisted++;section.assisted++;}if(task.proof){result.proofPending++;section.proofPending++;}}}catch(_){result.unavailable++;}}
 }
 return result;
}
const api={create,valid,matches,openAnswer,recognize,canonical,summary,normalizedProof,currentProofChecks,equationDraft,equationCheck,updateEquationDraft,PREFIX};root.ProfilePartTwoState=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
