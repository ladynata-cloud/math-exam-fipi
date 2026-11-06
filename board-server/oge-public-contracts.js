'use strict';
const {loadTrainer,mulberry32}=require('./oge-native-math');
const {requireValue,exactKeys}=require('./learning-auth');
const cards=require('../trainers/task19-visual-data').cards;
const room19=require('../trainers/task19-board-session').create(cards,require('../trainers/task19-visual-models'),require('../trainers/task19-reference'));
const files={11:'graphs-trainer',15:'triangles',16:'circle',17:'quadrilaterals',18:'grid'};
const contexts=new Map();
const copy=x=>JSON.parse(JSON.stringify(x));
const text=x=>String(x||'').replace(/<sup>(.*?)<\/sup>/g,'^$1').replace(/<[^>]*>/g,' ').replace(/&(gt|lt|nbsp|amp|minus|sup2|sup3|deg);/g,(_,k)=>({gt:'>',lt:'<',nbsp:' ',amp:'&',minus:'−',sup2:'²',sup3:'³',deg:'°'})[k]).replace(/\s+/g,' ').trim();
function engine(n){if(!contexts.has(n))contexts.set(n,loadTrainer(`trainers/oge-task${n}-${files[n]}.html`,{search:'?board=1'}));return contexts.get(n);}
function create(contentId,seed){
 seed=seed||1;const n=Number(contentId);requireValue([11,15,16,17,18,19].includes(n),'LEARNING_TRAINER_UNKNOWN');
 let descriptor,task;
 if(n===19){const c=cards[seed%cards.length];descriptor={id:c.id};task={q:c.text||c.statement,answer:String(c.truth),kind:'boolean',steps:[]};}
 else {
  const e=engine(n);e.ctx.Math.random=mulberry32(seed);
  const keys=n===11?['t41','t42','t43','t44','t45']:copy(e.run(n===15?'window.__oge15.TASK_VARIANTS.map(v=>v.id)':`Object.keys(${n===17?'S17':'SUBS'})`));
  const key=keys[seed%keys.length];e.ctx.managedKey=key;e.ctx.managedSeed=seed;
  let t;
  if(n===11){descriptor={type:key,seed};t=JSON.parse(e.run('JSON.stringify(m4Make(managedKey))'));task={q:text(t.taskline)+' '+t.items.map(i=>text(i.desc)).join('; '),answer:t.key.join(''),kind:'matching',steps:[],parameters:{type:key,items:t.items.map(i=>i.p),order:t.order}};}
  else {
   descriptor=n===15?{variantId:key,seed}:{key,source:'generator',value:seed};
   t=JSON.parse(e.run(n===15?'JSON.stringify(window.__oge15.buildSeeded(managedKey,managedSeed))':`JSON.stringify(build(managedKey,${n===17?'S17':'SUBS'}[managedKey].gen(),{}))`));
   task={q:text(t.text),answer:String(t.ans),kind:t.ansFmt==='concat'?'concat':'number',steps:(t.steps||t.sol||[]).map(s=>({q:text(s.q||s.t||s.text),answer:String(s.a??s.ans??''),why:text(s.why||s.explain||'')})),parameters:t.p};
  }
 }
 requireValue(typeof task.q==='string'&&task.q.length>0,'LEARNING_TASK_INVALID');
 return {taskSpec:{trainerId:'oge-public',contentId:String(n),id:String(n),seed,contentVersion:1,descriptor,task},state:{native:null,answer:'',helpUsed:false}};
}
function hasHelp(n,s){
 if(!s)return false;
 if(n===19)return !!(s.current?.helpUsed||s.current?.hintOpen||s.current?.modelState||s.view?.textbook||s.view?.reference?.some(Boolean));
 if(n===15)return !!(s.helpUsed||s.hintOpen||s.guided||s.referenceOpen||s.steps?.some(x=>x.hint||x.revealed));
 return !!(s.helpUsed||s.helpOpen||s.model?.open||s.details?.some(Boolean)||s.referenceZoom?.some(Boolean)||([16,17,18].includes(n)&&s.actions?.some(a=>a[0]!=='check'||a[2])));
}
function safeNative(value,depth=0){
 requireValue(depth<=12,'LEARNING_STATE_INVALID');
 if(typeof value==='string')requireValue(value.length<=200&&!/[<>\u0000-\u001f]/.test(value),'LEARNING_STATE_INVALID');
 else if(typeof value==='number')requireValue(Number.isFinite(value),'LEARNING_STATE_INVALID');
 else if(value&&typeof value==='object'){requireValue(Object.keys(value).length<=500,'LEARNING_STATE_INVALID');for(const [k,v]of Object.entries(value)){requireValue(!['__proto__','prototype','constructor'].includes(k),'LEARNING_STATE_INVALID');safeNative(v,depth+1);}}
 else requireValue(value===null||typeof value==='boolean','LEARNING_STATE_INVALID');
}
function shape(n,s){
 const check=x=>requireValue(x,'LEARNING_STATE_INVALID');
 const bools=(o,keys)=>keys.forEach(k=>check(typeof o[k]==='boolean'));
 const list=(a,max,p)=>check(Array.isArray(a)&&a.length<=max&&a.every(p));
 const math=x=>typeof x==='string'&&x.length<=96&&!/[<>\u0000-\u001f]/.test(x);
 if(n===11){
  check(s.version===1&&s.algebra===null);bools(s,['helpUsed']);
  list(s.actions,320,a=>Array.isArray(a)&&a.length===4&&['click','input','change','enter','probe','details'].includes(a[0])&&Number.isInteger(a[1])&&a[1]>=0&&a[1]<300&&['button','input:text','input:number','input:range','input:checkbox','select','details','probe'].includes(a[2])&&(a[3]===null||typeof a[3]==='boolean'||typeof a[3]==='number'||math(a[3])));
  list(s.view,300,a=>Array.isArray(a)&&a.length===3&&Number.isInteger(a[0])&&a[0]>=0&&a[0]<300&&['input:text','input:number','input:range','input:checkbox','select','details'].includes(a[1])&&(typeof a[2]==='boolean'||math(a[2])));
 } else if(n===15){
  check(math(s.answer)&&typeof s.topic==='string');bools(s,['checked','hintOpen','helpUsed','guided','referenceOpen','settingsOpen']);
  list(s.steps,30,e=>{exactKeys(e,['draft','checked','hint','revealed'],['draft','checked','hint','revealed']);bools(e,['checked','hint','revealed']);return math(e.draft);});
 } else if(n===19){
  check(s.topic===''&&s.review===false);exactKeys(s.current,['id','answer','hintOpen','helpUsed','modelState'],['id','answer','hintOpen','helpUsed','modelState']);
  bools(s.current,['hintOpen','helpUsed']);check(s.current.answer===null||typeof s.current.answer==='boolean');
  exactKeys(s.view,['settings','textbook','reference'],['settings','textbook','reference']);bools(s.view,['settings','textbook']);list(s.view.reference,30,x=>typeof x==='boolean');
  list(s.answers,1,a=>Array.isArray(a)&&a.length===3&&typeof a[0]==='string'&&typeof a[1]==='boolean'&&typeof a[2]==='boolean');
  if(s.current.modelState!==null){exactKeys(s.current.modelState,['params','measured'],['params','measured']);bools(s.current.modelState,['measured']);check(Object.keys(s.current.modelState.params).length<=20&&Object.values(s.current.modelState.params).every(x=>typeof x==='number'&&Number.isFinite(x)));}
 } else {
  check(math(s.answer));bools(s,['helpUsed','helpOpen','settingsOpen']);
  exactKeys(s.filter,['topic','source','sub'],['topic','source','sub']);check(s.filter.topic==='all'&&s.filter.sub==='all'&&s.filter.source===(n===16?'mix':'all'));
  list(s.actions,128,a=>Array.isArray(a)&&a.length===3&&['check','give','step','first'].includes(a[0])&&math(a[1])&&typeof a[2]==='boolean');
  list(s.details,30,x=>typeof x==='boolean');list(s.referenceZoom,30,x=>typeof x==='boolean');
  if(s.model!==null){exactKeys(s.model,['kind','open','controls','toggles'],['kind','open','controls','toggles']);check(typeof s.model.kind==='string'&&typeof s.model.open==='boolean');check(Object.keys(s.model.controls).length<=20&&Object.values(s.model.controls).every(x=>typeof x==='number'&&Number.isFinite(x)));list(s.model.toggles,20,x=>typeof x==='boolean');}
 }
}
function normalize(spec,state,previous){
 requireValue(spec.trainerId==='oge-public'&&spec.contentVersion===1,'LEARNING_TASK_INVALID');
 exactKeys(state,['native','answer','helpUsed'],['native','answer','helpUsed']);
 requireValue(typeof state.answer==='string'&&state.answer.length<=96&&!/[<>\u0000-\u001f]/.test(state.answer)&&typeof state.helpUsed==='boolean','LEARNING_STATE_INVALID');
 const n=Number(spec.contentId),s=state.native;
 if(s!==null){
  safeNative(s);
  const keys=n===11?['version','task','actions','view','helpUsed','algebra']:n===15?['variantId','seed','topic','answer','checked','hintOpen','helpUsed','guided','steps','referenceOpen','settingsOpen']:n===19?['topic','review','current','answers','view']:['task','filter','actions','answer','helpUsed','helpOpen','settingsOpen','details','referenceZoom','model'];
  exactKeys(s,keys,keys);
  shape(n,s);
  if(n===19){try{room19.validate(s);}catch(_){requireValue(false,'LEARNING_STATE_INVALID');}}
  if(n===15){
   requireValue(s.topic==='all'&&s.steps.length<=spec.task.steps.length&&(s.guided?s.steps.length>0:s.steps.length===0)&&(!(s.hintOpen||s.referenceOpen)||s.helpUsed)&&s.steps.every(e=>(!(e.hint||e.revealed)||s.helpUsed)&&!(e.revealed&&e.checked)),'LEARNING_STATE_INVALID');
  }
  const d=n===15?{variantId:s.variantId,seed:s.seed}:n===19?{id:s.current?.id}:s.task;
  requireValue(JSON.stringify(d)===JSON.stringify(spec.descriptor),'LEARNING_TASK_MISMATCH');
  if(n===19)requireValue(s.answers.every(a=>a[0]===spec.descriptor.id),'LEARNING_TASK_MISMATCH');
  if([15,16,17,18].includes(n))requireValue(s.answer===state.answer,'LEARNING_ANSWER_INVALID');
  if(n===19)requireValue((s.current.answer===null?'':String(s.current.answer))===state.answer,'LEARNING_ANSWER_INVALID');
 }
 // Assistance is append-only for an attempt, even if a stale/replayed UI closes help.
 return {native:copy(s),answer:state.answer,helpUsed:!!(state.helpUsed||previous?.helpUsed||hasHelp(n,s))};
}
function evaluate(spec,details,state){
 exactKeys(details,['scope','answer','step'],['scope','answer']);
 requireValue(state.native!==null,'LEARNING_CHECK_INVALID');
 if(details.scope==='step'){
  requireValue(spec.contentId==='15'&&Number.isInteger(details.step)&&details.step>=0&&details.step<spec.task.steps.length&&state.native.steps[details.step]?.draft===details.answer,'LEARNING_CHECK_INVALID');
  const e=engine(15);e.ctx.managedAnswer=details.answer;e.ctx.managedExpected=Number(spec.task.steps[details.step].answer);
  return {correct:!!e.run('Number.isFinite(parseAns(managedAnswer))&&(eqAns(parseAns(managedAnswer),managedExpected)||(Math.abs(Math.round(managedExpected*1e4)-managedExpected*1e4)>=1e-6&&Math.abs(parseAns(managedAnswer)-managedExpected)<=.005))'),complete:false,assisted:true};
 }
 requireValue(details.scope==='final'&&details.step===undefined&&details.answer===state.answer,'LEARNING_CHECK_INVALID');
 const raw=details.answer,n=Number(spec.contentId);let correct=false;
 if(n===19)correct=raw===spec.task.answer;
 else if(n===11)correct=/^[123]{3}$/.test(raw)&&raw===spec.task.answer;
 else {const e=engine(n);e.ctx.managedAnswer=raw;e.ctx.managedExpected=Number(spec.task.answer);e.ctx.managedTask={ans:spec.task.kind==='concat'?spec.task.answer:Number(spec.task.answer),ansFmt:spec.task.kind==='concat'?'concat':'num'};
 correct=!!e.run(n===17?'isRight(managedTask,managedAnswer)':n===18?'Number.isFinite(parseAns(managedAnswer))&&near(parseAns(managedAnswer),managedExpected,1e-6)':'Number.isFinite(parseAns(managedAnswer))&&eqAns(parseAns(managedAnswer),managedExpected)');}
 return {correct,complete:correct};
}
module.exports={create,normalize,evaluate,hasHelp,describe:spec=>({title:'ОГЭ №'+spec.contentId,prompt:spec.task.q,contentId:spec.contentId,position:null,steps:1})};
