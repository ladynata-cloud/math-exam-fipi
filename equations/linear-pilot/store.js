(function(root){'use strict';
const PREFIX='mathexam.linearPilot.events.v1.';
const text=(s,n)=>typeof s==='string'&&s.length<=n,stage=n=>Number.isInteger(n)&&n>=0&&n<=6;
function valid(e){if(!e||!text(e.id,100)||!Number.isFinite(e.at)||!e.payload||typeof e.payload!=='object')return false;const p=e.payload;
if(e.type==='draft')return text(p.key,100)&&/^[a-zA-Z0-9_-]+$/.test(p.key)&&!['__proto__','constructor','prototype'].includes(p.key)&&(text(p.value,1600)||(text(p.base,100)&&Number.isInteger(p.prefix)&&p.prefix>=0&&p.prefix<=1600&&text(p.suffix,1600)));
if(!stage(p.stage))return false;if(e.type==='go')return true;
if(e.type==='check')return [0,5,6].includes(p.stage)&&Array.isArray(p.answers)&&p.answers.length===3&&p.answers.every(a=>a&&text(a.answer,40)&&text(a.work,1600))&&Array.isArray(p.probes)&&p.probes.length===(p.stage===0?3:0)&&p.probes.every(a=>text(a,40));
if(p.stage<1||p.stage>4||!Number.isInteger(p.task)||p.task<0||p.task>100000)return false;
if(e.type==='prediction')return p.stage===1&&text(p.value,1600)&&p.value.trim().length>0;
if(e.type==='attempt')return Number.isInteger(p.choice)&&p.choice>=-1&&p.choice<=2&&text(p.answer,40)&&text(p.work,1600)&&typeof p.correct==='boolean'&&text(p.feedback,500);
if(e.type==='help')return ['example','model','hint','solution','external','gap'].includes(p.kind);
return e.type==='next'||e.type==='finish';}
function reduce(events){const state={stage:0,checks:{},lessons:{},drafts:{},events},draftValues=new Map();
for(const ev of events){if(!valid(ev))continue;const p=ev.payload||{},i=p.stage;
if(ev.type==='go')state.stage=i;
if(ev.type==='draft'){const value=typeof p.value==='string'?p.value:(draftValues.get(p.base)||'').slice(0,p.prefix)+p.suffix;draftValues.set(ev.id,value);state.drafts[p.key]=value;}
if(ev.type==='check'){(state.checks[i]??=[]).push({...p,at:ev.at,id:ev.id});}
if(['attempt','help','next','finish','prediction'].includes(ev.type)){
const l=state.lessons[i]??={current:0,done:false,tasks:{}};const t=l.tasks[p.task]??={attempts:[],help:[],helpEvents:[]};
if(ev.type==='prediction'&&!t.prediction)t.prediction={value:p.value,at:ev.at};
if(ev.type==='attempt')t.attempts.push({...p,at:ev.at});
if(ev.type==='help'){t.helpEvents.push({kind:p.kind,at:ev.at});if(!t.help.includes(p.kind))t.help.push(p.kind);}
if(ev.type==='next')l.current=Math.max(l.current,p.task+1);
if(ev.type==='finish'){t.finished=true;t.finishedAt??=ev.at;}
}}
for(const l of Object.values(state.lessons))l.done=Object.values(l.tasks).some(t=>t.finished&&t.attempts.filter(a=>a.at<=t.finishedAt).length===1&&t.attempts[0].correct&&!t.helpEvents.some(h=>h.at<=t.finishedAt||h.kind==='external'));
return state;}
function create(storage,clock=Date.now,id=()=>crypto.randomUUID()){
const memory=new Map(),pending=new Map();let error='';
function read(){try{for(let i=0;i<storage.length;i++){const k=storage.key(i);if(!k?.startsWith(PREFIX))continue;try{const e=JSON.parse(storage.getItem(k));if(valid(e))memory.set(e.id,e);else error='Некоторые повреждённые записи пропущены; исходные данные в браузере не удалены.';}catch{}}}catch{error='Сохранение недоступно. Скачайте отчёт перед закрытием.';}
return [...memory.values()].sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id));}
function state(){return reduce(read());}
function append(type,payload){const all=read();if(type==='draft'&&typeof payload.value==='string'){const previous=all.findLast(e=>e.type==='draft'&&e.payload.key===payload.key),old=reduce(all).drafts[payload.key]||'';let prefix=0;while(prefix<old.length&&prefix<payload.value.length&&old[prefix]===payload.value[prefix])prefix++;payload={stage:payload.stage,key:payload.key,base:previous?.id||'',prefix,suffix:payload.value.slice(prefix)};}const at=Math.max(clock(),(all.at(-1)?.at||0)+1),ev={id:id(),at,type,payload};memory.set(ev.id,ev);pending.set(ev.id,ev);
for(const [key,event] of pending){try{storage.setItem(PREFIX+key,JSON.stringify(event));pending.delete(key);}catch{break;}}error=pending.size?'Не удалось сохранить. Работа осталась в этой вкладке: скачайте отчёт до закрытия.':'';return state();}
return {state,append,error:()=>error};}
root.LinearPilotStore={PREFIX,reduce,create};if(typeof module==='object')module.exports=root.LinearPilotStore;
})(typeof window==='object'?window:globalThis);
