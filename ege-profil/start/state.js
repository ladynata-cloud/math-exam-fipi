(function(root){'use strict';
const KEY='mathexam.profileStart2027.v1';
function create(lessons,storage){
 const known=new Map(lessons.map(l=>[l.id,l])),tasks=new Set(lessons.flatMap(l=>l.tasks.map(t=>t.id)));let warning='',raw='',blocked=false;
 const data={version:1,records:{},seen:{},sessions:{}};
 const syncedSessions=Object.create(null);let latestSessions=Object.create(null);
 const copy=s=>({...s,answers:[...s.answers]});
 const sameAttempt=(a,b)=>!!a&&!!b&&a.taskId===b.taskId&&a.started===b.started;
 function sessionFor(key,s){const [id,mode,extra]=key.split(':');const l=known.get(id);const t=l?.tasks.find(t=>t.id===s?.taskId);if(extra!==undefined||!t||!['guided','plan','independent'].includes(mode)||!Number.isInteger(s.step)||s.step<0||s.step>t.steps.length)return null;
  return {taskId:t.id,step:s.step,wrong:!!s.wrong,assisted:!!s.assisted,familiar:!!s.familiar,done:!!s.done,draft:typeof s.draft==='string'?s.draft.slice(0,200):'',answers:Array.isArray(s.answers)?s.answers.slice(0,15).map(String):[],started:typeof s.started==='string'?s.started:'',registered:!!s.registered};}
 function mergeSessions(saved){const merged=Object.fromEntries(Object.entries(data.sessions).map(([key,s])=>[key,copy(s)]));for(const [key,value]of Object.entries(saved)){const incoming=sessionFor(key,value);if(!incoming)continue;const own=data.sessions[key],previous=syncedSessions[key];
  if(!own){data.sessions[key]=incoming;merged[key]=copy(incoming);continue;}
  if(!sameAttempt(own,incoming)){
   // A stale tab must never replace a later attempt. Do not mutate its old
   // object into the new attempt: callers may still hold that old reference.
   const ownTime=Date.parse(own.started)||0,incomingTime=Date.parse(incoming.started)||0;
   if(incomingTime>ownTime||(incomingTime===ownTime&&sameAttempt(own,previous))){data.sessions[key]=incoming;merged[key]=copy(incoming);}
   continue;
  }
  // Flags merge into the held object. Progress/draft merge into the saved
  // snapshot only: changing the live step during typing would mismatch the
  // question currently on screen. start() refreshes them before the next render.
  const target=merged[key];
  const ownProgress=Math.max(own.step,own.answers.length),incomingProgress=Math.max(incoming.step,incoming.answers.length);
  const localDraftChanged=!sameAttempt(own,previous)||own.draft!==previous.draft;
  const draft=incomingProgress>ownProgress?incoming.draft:ownProgress>incomingProgress?own.draft:localDraftChanged?own.draft:incoming.draft;
  if(incoming.answers.length>own.answers.length||(incoming.answers.length===own.answers.length&&sameAttempt(own,previous)&&JSON.stringify(own.answers)===JSON.stringify(previous.answers)))target.answers=[...incoming.answers];
  target.step=Math.max(own.step,incoming.step);
  for(const flag of ['wrong','assisted','familiar','done','registered'])target[flag]=own[flag]=!!own[flag]||incoming[flag];
  target.draft=draft;
 }return merged;}
 function refreshSession(key){const own=data.sessions[key],latest=latestSessions[key];if(sameAttempt(own,latest)){Object.assign(own,copy(latest));syncedSessions[key]=copy(own);}return data.sessions[key];}
 function startedAt(){let latest=Date.now()-1;for(const s of Object.values(data.sessions))latest=Math.max(latest,Date.parse(s.started)||0);return new Date(Math.max(Date.now(),latest+1)).toISOString();}
 try{raw=storage.getItem(KEY)||'';if(raw){const v=JSON.parse(raw);if(v.version!==1||!v.records||!v.seen||!v.sessions)throw Error();
  for(const l of lessons){const r=v.records[l.id];if(r&&typeof r==='object')data.records[l.id]={guided:[...new Set(Array.isArray(r.guided)?r.guided:[])].filter(id=>l.tasks.some(t=>t.id===id)).slice(0,20),independent:[...new Set(Array.isArray(r.independent)?r.independent:[])].filter(id=>l.tasks.slice(-3).some(t=>t.id===id)).slice(0,20),attempts:Math.max(0,Math.min(100000,Number(r.attempts)||0))};}
  for(const [id,n]of Object.entries(v.seen))if(tasks.has(id))data.seen[id]=Math.max(0,Math.min(100000,Math.floor(Number(n)||0)));
  for(const [key,s]of Object.entries(v.sessions)){const clean=sessionFor(key,s);if(clean){data.sessions[key]=clean;syncedSessions[key]=copy(clean);}}
 }}catch(_){warning='Сохранение недоступно или повреждено. Старые данные оставлены без изменений; сейчас результаты хранятся только до закрытия страницы. Можно скачать резервную копию.';blocked=true;}
 function persist(){if(blocked)return false;try{let merged=mergeSessions({});
  const current=storage.getItem(KEY);if(current){let other;try{other=JSON.parse(current);if(other.version!==1||!other.records||!other.seen||!other.sessions)throw Error();}catch(_){blocked=true;raw=current;warning='Сохранение изменилось или повреждено. Оно оставлено без изменений; скачайте отчёт с текущими результатами.';return false;}
   // Preserve successes from another open tab instead of overwriting them.
   for(const l of lessons){const r=other.records[l.id];if(!r)continue;const own=record(l.id);for(const kind of ['guided','independent']){const pool=kind==='independent'?l.tasks.slice(-3):l.tasks;for(const id of Array.isArray(r[kind])?r[kind]:[])if(pool.some(t=>t.id===id)&&!own[kind].includes(id))own[kind].push(id);}own.attempts=Math.max(own.attempts,Math.min(100000,Number(r.attempts)||0));}
   for(const id of tasks)if(other.seen[id])data.seen[id]=Math.max(data.seen[id]||0,Math.min(100000,Number(other.seen[id])||0));
   merged=mergeSessions(other.sessions);
  }
  storage.setItem(KEY,JSON.stringify({...data,sessions:merged}));latestSessions=merged;for(const [key,s]of Object.entries(data.sessions))syncedSessions[key]=copy(s);return true;
 }catch(_){blocked=true;warning='Браузер не разрешил сохранить результаты. Скачайте отчёт перед закрытием страницы.';return false;}}
 function record(id){return data.records[id]||(data.records[id]={guided:[],independent:[],attempts:0});}
 function start(id,mode,fresh=false){const l=known.get(id);if(!l||!['guided','plan','independent'].includes(mode))throw Error('Unknown lesson or mode');const key=id+':'+mode,hadSession=!!data.sessions[key];const saved=persist();const old=saved?refreshSession(key):data.sessions[key];if(old&&!fresh&&(hadSession||!old.done))return old;
 const pool=mode!=='independent'?l.tasks.slice(0,-3):l.tasks.slice(-3);let t=pool.find(t=>!data.seen[t.id]);if(!t)t=pool.reduce((a,b)=>(data.seen[a.id]||0)<=(data.seen[b.id]||0)?a:b);
 const s={taskId:t.id,step:0,wrong:false,assisted:mode!=='independent',familiar:!!data.seen[t.id],done:false,draft:'',answers:[],started:startedAt(),registered:false};
 data.seen[t.id]=(data.seen[t.id]||0)+1;data.sessions[key]=s;persist();return s;}
 function finish(id,mode,s){
  // Read saved help/mistakes before awarding any credit, not after it.
  persist();const current=data.sessions[id+':'+mode];if(!sameAttempt(s,current)||current.registered)return false;
  if(current!==s){for(const flag of ['wrong','assisted','familiar'])current[flag]=current[flag]||s[flag];s=current;}
  const r=record(id);r.attempts++;if(mode!=='independent'&&!r.guided.includes(s.taskId))r.guided.push(s.taskId);if(mode==='independent'&&!s.wrong&&!s.assisted&&!s.familiar&&!r.independent.includes(s.taskId))r.independent.push(s.taskId);s.done=true;s.registered=true;persist();return true;}
 function remediate(id,taskId){const l=known.get(id),t=l?.tasks.find(t=>t.id===taskId);if(!t)throw Error('Unknown remediation task');const saved=persist();const source=saved?refreshSession(id+':independent'):data.sessions[id+':independent'];if(source?.taskId===taskId&&!source.answers.length&&!source.done&&!source.registered){source.assisted=true;}
 const key=id+':guided',old=saved?refreshSession(key):data.sessions[key];if(old?.taskId===taskId&&!old.done){persist();return old;}
 const s={taskId,step:0,wrong:false,assisted:true,familiar:!!data.seen[taskId],done:false,draft:'',answers:[],started:startedAt(),registered:false};data.seen[taskId]=Math.max(1,data.seen[taskId]||0);data.sessions[key]=s;persist();return s;}
 return {KEY,data,record,start,finish,remediate,persist,get warning(){return warning;},get original(){return raw;},export(){return {kind:'mathexam-profile-start',exportedAt:new Date().toISOString(),storage:'local-browser',...data,sessions:mergeSessions(latestSessions)};}};
}
const api={KEY,create};root.ProfileState=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
