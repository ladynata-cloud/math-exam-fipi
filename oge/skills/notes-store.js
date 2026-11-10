/* Separate append-only learner explanations and self-review, with no auto-grading. */
(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory();else root.OgeSkillNotes=factory();})(typeof globalThis==='undefined'?this:globalThis,function(){
 'use strict';const PREFIX='mathExamOge.skillNotes.v1.';
 function create(catalog,storage,options){
  options=options||{};const now=options.now||Date.now,random=options.random||(()=>Math.random().toString(36).slice(2,12));
  let seq=0,cache=new Map(),pending=new Map(),notice='',reliable=true,lastTime=0;
  function warn(message){notice=message;reliable=false;}
  function valid(e){
   if(!e||e.version!==1||typeof e.id!=='string'||!/^[a-zA-Z0-9._-]{8,120}$/.test(e.id)||!Number.isSafeInteger(e.at)||e.at<=0||!catalog.byId[e.map])return false;
   const map=catalog.byId[e.map],node=map.nodes.find(n=>n.id===e.node);if(!node)return false;
   if(e.type==='note')return typeof e.text==='string'&&e.text.length<=5000;
   if(e.type==='review')return (e.noteId===null||typeof e.noteId==='string'&&/^[a-zA-Z0-9._-]{8,120}$/.test(e.noteId))&&Array.isArray(e.checks)&&new Set(e.checks).size===e.checks.length&&e.checks.every(i=>Number.isInteger(i)&&i>=0&&i<node.explain.criteria.length);
   if(e.type==='visit')return node.resources.some(r=>r.href===e.href);
   if(e.type==='cursor')return true;
   return false;
  }
  function read(){
   try{if(!storage)throw Error('blocked');const fresh=new Map(),keys=[];for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key?.startsWith(PREFIX+'event.'))keys.push(key);}if(keys.length>50000)throw Error('capacity');
    for(const key of keys){let e;try{e=JSON.parse(storage.getItem(key));}catch(_){warn('Одну из записей объяснений не удалось прочитать. Она оставлена без изменений.');continue;}
     if(!valid(e)||key!==PREFIX+'event.'+e.id){warn('Есть повреждённая запись объяснения. Прежние данные сохранены.');continue;}fresh.set(e.id,e);}
    cache=new Map([...fresh,...pending]);
   }catch(_){warn('Объяснения доступны в этой вкладке, но сохранение в браузере сейчас недоступно. Скачай свою работу перед закрытием.');}
   const events=[...cache.values()].sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id));for(const e of events)lastTime=Math.max(lastTime,e.at);return{events,notice,reliable,pending:pending.size};
  }
  function flush(){for(const e of [...pending.values()].sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id))){try{if(!storage)throw Error('blocked');storage.setItem(PREFIX+'event.'+e.id,JSON.stringify(e));pending.delete(e.id);}catch(_){warn('Не удалось сохранить последнее объяснение. Оно осталось в этой вкладке; можно скачать работу.');break;}}return pending.size===0;}
  function append(data){
   read();const e={version:1,...data,at:Math.max(now(),lastTime+1),id:'note-'+now().toString(36)+'-'+(++seq).toString(36)+'-'+random()};lastTime=e.at;if(!valid(e))throw Error('Invalid OGE note');cache.set(e.id,e);pending.set(e.id,e);flush();return e;
  }
  function latest(map,node){const events=read().events.filter(e=>e.map===map&&e.node===node);const note=events.filter(e=>e.type==='note').at(-1),review=events.filter(e=>e.type==='review'&&e.noteId===(note?.id||null)).at(-1);return{text:note?.text||'',checks:review?.checks||[],note:note||null,review:review||null,history:events.filter(e=>e.type==='note'),visits:events.filter(e=>e.type==='visit')};}
  function saveNote(map,node,text){text=String(text).slice(0,5000);const old=latest(map,node);if(old.text===text)return old.note;return append({type:'note',map,node,text});}
  function saveReview(map,node,checks,expectedNoteId){checks=[...new Set(checks)].sort((a,b)=>a-b);const old=latest(map,node),noteId=old.note?.id||null;if(arguments.length>=4&&expectedNoteId!==noteId)return null;if(JSON.stringify(old.checks)===JSON.stringify(checks))return old.review;return append({type:'review',map,node,checks,noteId});}
  function cursor(map,node){const last=read().events.filter(e=>e.type==='cursor').at(-1);if(last?.map===map&&last.node===node)return last;return append({type:'cursor',map,node});}
  function visit(map,node,href){return append({type:'visit',map,node,href});}
  return{read,flush,latest,saveNote,saveReview,cursor,visit,last:()=>read().events.filter(e=>e.type==='cursor').at(-1)||null,valid};
 }
 return{PREFIX,create};
});
