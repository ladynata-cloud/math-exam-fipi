/* Additive local-only records. Each event has its own key, so tabs cannot erase help. */
(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory(require('./route-core.js'));else root.FoundationRouteStore=factory(root.FoundationRoutesCore);})(typeof globalThis==='undefined'?this:globalThis,function(C){
'use strict';
function create(catalog,storage,options){
 options=options||{};const PREFIX=options.prefix||C.PREFIX;if(!['mathExamFoundations.routes.v1.','mathExamOge.skillMaps.v1.'].includes(PREFIX))throw Error('Unknown learning namespace');let cache=new Map(),volatile=new Map(),notice='',reliable=true,sequence=0;
 const now=options.now||Date.now,random=options.random||(()=>Math.random().toString(36).slice(2,12)),activeMemory={};
 function warn(message){notice=message;reliable=false;}
 function read(){
  try{
   if(!storage)throw Error('unavailable');
   const fresh=new Map(),keys=[];for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key&&key.startsWith(PREFIX+'event.'))keys.push(key);}
   if(keys.length>50000)throw Error('capacity');
   for(const key of keys){let e;try{e=JSON.parse(storage.getItem(key));}catch(_){warn('Часть сохранённых записей повреждена. Она оставлена без изменений; результат проверки не подтверждён.');continue;}
    if(!C.validEvent(e,catalog)||key!==PREFIX+'event.'+e.id){warn('Часть сохранённых записей не удалось прочитать. Прежние данные оставлены без изменений.');continue;}fresh.set(e.id,e);}
   cache=new Map([...fresh,...volatile]);
  }catch(_){warn('Браузер не разрешил прочитать или сохранить прогресс. Можно заниматься; эта работа может не сохраниться после закрытия страницы.');}
  return{events:[...cache.values()],notice,reliable,pending:volatile.size};
 }
 function write(key,value,preserveInvalid){
  try{if(!storage)throw Error('unavailable');if(preserveInvalid&&storage.getItem(key)!==null){try{const old=JSON.parse(storage.getItem(key));if(!old||old.version!==1||typeof old.session!=='string'||!/^[a-zA-Z0-9._-]{8,120}$/.test(old.session)||(value.question&&(old.session!==value.session||old.question!==value.question||typeof old.value!=='string'||old.value.length>100||!Number.isSafeInteger(old.at)||old.at<=0)))throw Error('format');}catch(_){warn('Повреждённая запись сохранена без изменений. Новая работа доступна в этой вкладке.');return false;}}
   storage.setItem(key,JSON.stringify(value));return true;
  }catch(_){warn('Браузер не разрешил сохранить прогресс. Можно закончить занятие; перед закрытием запишите результат.');return false;}
 }
 function flush(){for(const e of [...volatile.values()].sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id))){if(!write(PREFIX+'event.'+e.id,e,false))break;volatile.delete(e.id);}return volatile.size===0;}
 function uid(prefix){return prefix+'-'+now().toString(36)+'-'+(++sequence).toString(36)+'-'+random();}
 function append(data){
  const all=read().events,last=all.reduce((n,e)=>Math.max(n,e.at),0),e=C.event(Object.assign({},data,{id:uid('e'),at:Math.max(now(),last+1)}));
  if(!C.validEvent(e,catalog))throw Error('Invalid learning event');
  cache.set(e.id,e);volatile.set(e.id,e);flush();return e;
 }
 function start(routeId,mode,repeat){
  if(!catalog.byId[routeId]||!C.MODES.includes(mode))throw Error('Unknown route/session');
  const key=PREFIX+'active.'+routeId+'.'+mode;
  if(!repeat){let saved=activeMemory[key];try{const raw=storage&&storage.getItem(key);if(raw){const p=JSON.parse(raw);if(p.version!==1||typeof p.session!=='string')throw Error('format');saved=p.session;}}catch(_){warn('Ссылка на прежнее занятие не читается. Прежняя запись оставлена без изменений.');}
   const events=read().events,candidates=[...new Set([activeMemory[key],saved])].filter(Boolean).map(id=>C.session(catalog,events,id)).filter(state=>state&&state.route===routeId&&state.mode===mode).sort((a,b)=>b.startedAt-a.startedAt||b.id.localeCompare(a.id));if(candidates.length){activeMemory[key]=candidates[0].id;return candidates[0].id;}}
  const id=uid('s');append({type:'start',session:id,route:routeId,mode});activeMemory[key]=id;
  write(key,{version:1,session:id},true);return id;
 }
 function get(id){return C.session(catalog,read().events,id);}
 function act(id,type,question,value){
  flush();const state=get(id);if(!state)return null;const qs=C.questions(catalog.byId[state.route],state.mode);
  if(type==='finish'){if(state.complete&&!state.finished)append({type,session:id,route:state.route,mode:state.mode});return get(id);}
  if(state.complete||qs[state.index].id!==question)return state;
  if(type==='view'&&read().events.some(e=>e.session===id&&e.type==='view'&&e.question===question))return state;
  if(type==='hint'&&state.items[state.index].help||type==='reveal'&&state.items[state.index].revealed)return state;
  append({type,session:id,route:state.route,mode:state.mode,question,...(type==='submit'?{value:String(value).slice(0,100)}:{})});return get(id);
 }
 const drafts=new Map();
 function draftKey(id,q){return PREFIX+'draft.'+id+'.'+q;}
 function setDraft(id,q,value){const record={version:1,session:id,question:q,value:String(value).slice(0,100),at:now()},key=draftKey(id,q);drafts.set(key,record);write(key,record,true);}
 function getDraft(id,q){const key=draftKey(id,q);try{const raw=storage&&storage.getItem(key);if(raw){const p=JSON.parse(raw);if(!p||p.version!==1||p.session!==id||p.question!==q||typeof p.value!=='string'||p.value.length>100||!Number.isSafeInteger(p.at)||p.at<=0)throw Error('format');const local=drafts.get(key);if(local&&local.at>=p.at)return local.value;drafts.set(key,p);return p.value;}}catch(_){warn('Черновик не удалось прочитать. Прежняя запись оставлена без изменений.');}return drafts.get(key)?.value||'';}
 return{read,flush,start,get,act,setDraft,getDraft,summary:()=>C.summaries(catalog,read().events)};
}
return{create};
});
