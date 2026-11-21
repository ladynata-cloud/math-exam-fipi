(function(root){'use strict';
const KEY='mathexam.profileStart2027.v1';
function create(lessons,storage,{publicAttempts=false}={}){
 const known=new Map(lessons.map(l=>[l.id,l])),tasks=new Set(lessons.flatMap(l=>l.tasks.map(t=>t.id)));let warning='',raw='',blocked=false;
 const data={version:1,records:{},seen:{},sessions:{}};
 const syncedSessions=Object.create(null);let latestSessions=Object.create(null),preserved={};
 const traceBlocked=new Set();let traceWarning='';
 const copy=s=>({...s,answers:[...s.answers],...(s.submissions?{submissions:JSON.parse(JSON.stringify(s.submissions))}:{})});
 const helpRank={none:0,support:1,solution:2};
 function cleanTrace(value,maxSteps,session){
  if(!value||value.version!==1||value.taskId!==session.taskId||value.started!==session.started||typeof value.fromStart!=='boolean'||!Object.hasOwn(helpRank,value.help)||!Array.isArray(value.steps)||value.steps.length>Math.min(15,maxSteps))return null;
  const used=new Set(),steps=[];
  const event=e=>!!e&&typeof e.answer==='string'&&e.answer.length<=200&&typeof e.correct==='boolean'&&Object.hasOwn(helpRank,e.help)&&typeof e.at==='string'&&e.at.length<=32&&Number.isFinite(Date.parse(e.at));
  for(const item of value.steps){if(!item||!Number.isInteger(item.step)||item.step<0||item.step>=maxSteps||used.has(item.step)||!event(item.first)||!event(item.last)||Date.parse(item.first.at)>Date.parse(item.last.at))return null;used.add(item.step);steps.push({step:item.step,first:{answer:item.first.answer,correct:item.first.correct,help:item.first.help,at:item.first.at},last:{answer:item.last.answer,correct:item.last.correct,help:item.last.help,at:item.last.at}});}
  return {version:1,taskId:session.taskId,started:session.started,fromStart:value.fromStart,help:value.help,steps:steps.sort((a,b)=>a.step-b.step)};
 }
 function mergeTrace(own,incoming){
  if(!own)return incoming&&JSON.parse(JSON.stringify(incoming));if(!incoming)return JSON.parse(JSON.stringify(own));
  const steps=new Map(own.steps.map(item=>[item.step,JSON.parse(JSON.stringify(item))]));
  for(const item of incoming.steps){const old=steps.get(item.step);if(!old){steps.set(item.step,JSON.parse(JSON.stringify(item)));continue;}
   // The first committed answer wins a timestamp tie; later corrections never replace it.
   if(Date.parse(item.first.at)<=Date.parse(old.first.at))old.first={...item.first};
   if(Date.parse(item.last.at)>=Date.parse(old.last.at))old.last={...item.last};
  }
  return {version:1,taskId:own.taskId,started:own.started,fromStart:own.fromStart&&incoming.fromStart,help:helpRank[own.help]>=helpRank[incoming.help]?own.help:incoming.help,steps:[...steps.values()].sort((a,b)=>a.step-b.step).slice(0,15)};
 }
 function initTrace(s,key,fromStart){if(publicAttempts&&!traceBlocked.has(key)&&!s.submissions)s.submissions={version:1,taskId:s.taskId,started:s.started,fromStart,help:'none',steps:[]};}
 function noteHelp(s,kind='support'){
  if(!publicAttempts||!Object.hasOwn(helpRank,kind))return;
  const key=Object.keys(data.sessions).find(key=>data.sessions[key]===s);if(!key||traceBlocked.has(key))return;
  initTrace(s,key,false);if(helpRank[kind]>helpRank[s.submissions.help])s.submissions.help=kind;
 }
 function submitTrace(id,mode,s,input,correct){
  if(!publicAttempts||typeof input!=='string'||typeof correct!=='boolean')return false;
  const key=id+':'+mode;persist();const current=data.sessions[key];
  if(traceBlocked.has(key)||!sameAttempt(s,current)||current.done)return false;
  const task=known.get(id)?.tasks.find(t=>t.id===s.taskId),step=mode==='guided'?s.step:0;
  if(!task||step>=Math.min(15,mode==='guided'?task.steps.length:1)||(mode==='guided'?current.answers.length>step:current.answers.length>0))return false;
  initTrace(current,key,false);const trace=current.submissions;
  const previous=trace.steps.find(item=>item.step===step),latest=previous?Date.parse(previous.last.at):0;
  const event={answer:input.slice(0,200),correct,help:trace.help,at:new Date(Math.max(Date.now(),latest+1)).toISOString()};
  if(previous)previous.last=event;else trace.steps.push({step,first:{...event},last:event});
  trace.steps.sort((a,b)=>a.step-b.step);if(current!==s)s.submissions=JSON.parse(JSON.stringify(trace));persist();return true;
 }
 const sameAttempt=(a,b)=>!!a&&!!b&&a.taskId===b.taskId&&a.started===b.started;
 function sessionFor(key,s){const [id,mode,extra]=key.split(':');const l=known.get(id);const t=l?.tasks.find(t=>t.id===s?.taskId);if(extra!==undefined||!t||!['guided','plan','independent'].includes(mode)||!Number.isInteger(s.step)||s.step<0||s.step>t.steps.length)return null;
  let submissions;if(publicAttempts&&Object.hasOwn(s,'submissions')){
   submissions=cleanTrace(s.submissions,mode==='guided'?t.steps.length:1,s);
   const traceTask=l.tasks.find(task=>task.id===s.submissions?.taskId),traceStarted=s.submissions?.started;
   // An older tab can carry an opaque trace into a replacement session. Keep
   // that old trace on disk until new work starts, but never show it as this attempt.
   const historical=!submissions&&traceTask&&typeof traceStarted==='string'&&traceStarted.length<=32&&Number.isFinite(Date.parse(traceStarted))&&cleanTrace(s.submissions,mode==='guided'?traceTask.steps.length:1,{taskId:traceTask.id,started:traceStarted});
   if(!submissions&&!historical){traceBlocked.add(key);traceWarning='История первых ответов повреждена и оставлена без изменений. Новые отправки этой темы пока не записываются.';}
  }
  return {...(submissions?{submissions}:{}),taskId:t.id,step:s.step,wrong:!!s.wrong,assisted:!!s.assisted,familiar:!!s.familiar,done:!!s.done,draft:typeof s.draft==='string'?s.draft.slice(0,200):'',answers:Array.isArray(s.answers)?s.answers.slice(0,15).map(String):[],started:typeof s.started==='string'?s.started:'',registered:!!s.registered};}
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
  if(publicAttempts&&!traceBlocked.has(key)){const trace=mergeTrace(own.submissions,incoming.submissions);if(trace){target.submissions=trace;own.submissions=JSON.parse(JSON.stringify(trace));}}
 }return merged;}
 function refreshSession(key){const own=data.sessions[key],latest=latestSessions[key];if(sameAttempt(own,latest)){Object.assign(own,copy(latest));syncedSessions[key]=copy(own);}return data.sessions[key];}
 function startedAt(){let latest=Date.now()-1;for(const s of Object.values(data.sessions))latest=Math.max(latest,Date.parse(s.started)||0);return new Date(Math.max(Date.now(),latest+1)).toISOString();}
 try{raw=storage.getItem(KEY)||'';if(raw){const v=JSON.parse(raw);if(v.version!==1||!v.records||!v.seen||!v.sessions)throw Error();preserved=v;
  for(const l of lessons){const r=v.records[l.id];if(r&&typeof r==='object')data.records[l.id]={guided:[...new Set(Array.isArray(r.guided)?r.guided:[])].filter(id=>l.tasks.some(t=>t.id===id)).slice(0,20),independent:[...new Set(Array.isArray(r.independent)?r.independent:[])].filter(id=>l.tasks.slice(-3).some(t=>t.id===id)).slice(0,20),attempts:Math.max(0,Math.min(100000,Number(r.attempts)||0)),...Object.fromEntries(['recovered','checkpointIndependent','mistakes'].filter(kind=>Array.isArray(r[kind])).map(kind=>[kind,[...new Set(r[kind])].filter(id=>(kind==='mistakes'?l.tasks:l.tasks.slice(-3)).some(t=>t.id===id))]))};}
  for(const [id,n]of Object.entries(v.seen))if(tasks.has(id))data.seen[id]=Math.max(0,Math.min(100000,Math.floor(Number(n)||0)));
  for(const [key,s]of Object.entries(v.sessions)){const clean=sessionFor(key,s);if(clean){data.sessions[key]=clean;syncedSessions[key]=copy(clean);}}
 }}catch(_){warning='Сохранение недоступно или повреждено. Старые данные оставлены без изменений; сейчас результаты хранятся только до закрытия страницы. Можно скачать резервную копию.';blocked=true;}
 // Keep opaque fields and work from lessons outside this loaded catalog. They
 // must survive a narrower view without being admitted as local mastery.
 function snapshot(sessions){
  const records={...(preserved.records||{})},savedSessions={...(preserved.sessions||{})};
  for(const [id,r]of Object.entries(data.records)){
   const previous=preserved.records?.[id]||{},l=known.get(id);records[id]={...previous,...r};
   for(const kind of ['guided','independent','recovered','checkpointIndependent','mistakes'])if(Array.isArray(r[kind])&&Array.isArray(previous[kind])){
    const pool=['guided','mistakes'].includes(kind)?l.tasks:l.tasks.slice(-3);
    records[id][kind]=[...previous[kind].filter(value=>!pool.some(t=>t.id===value)),...r[kind]];
   }
  }
  for(const [key,s]of Object.entries(sessions)){savedSessions[key]={...(preserved.sessions?.[key]||{}),...s};if(traceBlocked.has(key)&&Object.hasOwn(preserved.sessions?.[key]||{},'submissions'))savedSessions[key].submissions=preserved.sessions[key].submissions;}
  return {...preserved,...data,records,seen:{...(preserved.seen||{}),...data.seen},sessions:savedSessions};
 }
 function persist(){if(blocked)return false;try{let merged=mergeSessions({});
  const current=storage.getItem(KEY);if(current){let other;try{other=JSON.parse(current);if(other.version!==1||!other.records||!other.seen||!other.sessions)throw Error();}catch(_){blocked=true;raw=current;warning='Сохранение изменилось или повреждено. Оно оставлено без изменений; скачайте отчёт с текущими результатами.';return false;}
   preserved=other;
   // Preserve successes from another open tab instead of overwriting them.
   for(const l of lessons){const r=other.records[l.id];if(!r)continue;const own=record(l.id);for(const kind of ['guided','independent','recovered','checkpointIndependent','mistakes']){const pool=['guided','mistakes'].includes(kind)?l.tasks:l.tasks.slice(-3);for(const id of Array.isArray(r[kind])?r[kind]:[])if(pool.some(t=>t.id===id)){own[kind]||=[];if(!own[kind].includes(id))own[kind].push(id);}}own.attempts=Math.max(own.attempts,Math.min(100000,Number(r.attempts)||0));}
   for(const id of tasks)if(other.seen[id])data.seen[id]=Math.max(data.seen[id]||0,Math.min(100000,Number(other.seen[id])||0));
   merged=mergeSessions(other.sessions);
  }
  for(const [key,session]of Object.entries(merged))if(session.wrong){const r=record(key.split(':')[0]);r.mistakes||=[];if(!r.mistakes.includes(session.taskId))r.mistakes.push(session.taskId);}
  storage.setItem(KEY,JSON.stringify(snapshot(merged)));latestSessions=merged;for(const [key,s]of Object.entries(data.sessions))syncedSessions[key]=copy(s);return true;
 }catch(_){blocked=true;warning='Браузер не разрешил сохранить результаты. Скачайте отчёт перед закрытием страницы.';return false;}}
 function record(id){return data.records[id]||(data.records[id]={guided:[],independent:[],attempts:0});}
 function start(id,mode,fresh=false){const l=known.get(id);if(!l||!['guided','plan','independent'].includes(mode))throw Error('Unknown lesson or mode');const key=id+':'+mode,hadSession=!!data.sessions[key];const saved=persist();const old=saved?refreshSession(key):data.sessions[key];if(old&&!fresh&&(hadSession||!old.done))return old;
 const pool=mode!=='independent'?l.tasks.slice(0,-3):l.tasks.slice(-3);let t=pool.find(t=>!data.seen[t.id]);if(!t)t=pool.reduce((a,b)=>(data.seen[a.id]||0)<=(data.seen[b.id]||0)?a:b);
 const s={taskId:t.id,step:0,wrong:false,assisted:mode!=='independent',familiar:!!data.seen[t.id],done:false,draft:'',answers:[],started:startedAt(),registered:false};
 data.seen[t.id]=(data.seen[t.id]||0)+1;initTrace(s,key,true);data.sessions[key]=s;persist();return s;}
 // Public result handoff: looking ahead does not open a condition. Execute
 // the choice again on click, after merging any work saved by another tab.
 function independentHandoff(id,completed,begin=false){
  const l=known.get(id);if(!l?.tasks.some(t=>t.id===completed?.taskId))throw Error('Unknown completed task');
  const key=id+':independent',saved=persist(),current=saved?refreshSession(key):data.sessions[key];
  const sourceTime=Date.parse(completed.started)||0,currentTime=Date.parse(current?.started)||0;
  // Only the identifiable, earlier assisted source of this same remediation
  // may be replaced. A newer attempt (even of the same task), accepted work,
  // or an old session without comparable timestamps must remain resumable.
  const remediated=current?.taskId===completed.taskId&&current.assisted&&!current.answers.length&&sourceTime>currentTime&&currentTime>0;
  if(current&&!current.done&&!remediated)return {kind:'resume',taskId:current.taskId,familiar:current.familiar,assisted:current.assisted||current.wrong,session:current};
  const r=data.records[id]||{},seen=new Set([completed.taskId]);
  for(const kind of ['guided','independent','recovered','checkpointIndependent','mistakes'])for(const taskId of r[kind]||[])seen.add(taskId);
  for(const mode of ['guided','plan','independent'])if(data.sessions[id+':'+mode])seen.add(data.sessions[id+':'+mode].taskId);
  const knownTask=t=>!!data.seen[t.id]||seen.has(t.id),pool=l.tasks.slice(-3).filter(t=>t.id!==completed.taskId);
  const t=pool.find(t=>!knownTask(t))||pool.reduce((a,b)=>(data.seen[a.id]||0)<=(data.seen[b.id]||0)?a:b),familiar=knownTask(t);
  const choice={kind:familiar?'familiar':'new',taskId:t.id,familiar,assisted:false};
  if(!begin)return choice;
  const s={taskId:t.id,step:0,wrong:false,assisted:false,familiar,done:false,draft:'',answers:[],started:startedAt(),registered:false};
  data.seen[t.id]=(data.seen[t.id]||0)+1;initTrace(s,key,true);data.sessions[key]=s;persist();
  return {...choice,session:s};
 }
 function finish(id,mode,s){
  // Read saved help/mistakes before awarding any credit, not after it.
  persist();const current=data.sessions[id+':'+mode];if(!sameAttempt(s,current)||current.registered)return false;
  if(current!==s){for(const flag of ['wrong','assisted','familiar'])current[flag]=current[flag]||s[flag];s=current;}
  const r=record(id);r.attempts++;if(mode!=='independent'&&!r.guided.includes(s.taskId))r.guided.push(s.taskId);if(mode==='independent'&&!s.wrong&&!s.assisted){const kind=s.familiar?'recovered':'independent';r[kind]||=[];if(!r[kind].includes(s.taskId))r[kind].push(s.taskId);}s.done=true;s.registered=true;persist();return true;}
 // A clean repeat is useful evidence of practice, never a new condition.
 function canAdvance(id){const r=record(id);return new Set([...r.independent,...(r.recovered||[])]).size>=2;}
 // Checkpoint reserves only unseen conditions and locks the first submitted
 // answer. Keep its fresh, unassisted successes with the corresponding lesson.
 function creditCheckpoint(item){
  const l=known.get(item?.lessonId);if(!l||!l.tasks.slice(-3).some(t=>t.id===item.taskId)||!item.submitted||!item.correct||item.assisted||item.unavailable)return false;
  if(data.records[l.id]?.checkpointIndependent?.includes(item.taskId)&&data.seen[item.taskId])return false;
  persist();const r=record(l.id);if(!data.seen[item.taskId]){data.seen[item.taskId]=1;persist();}if(r.checkpointIndependent?.includes(item.taskId))return false;
  if(!r.independent.includes(item.taskId)){r.independent.push(item.taskId);r.attempts++;}
  (r.checkpointIndependent||=[]).push(item.taskId);persist();return true;
 }
 function remediate(id,taskId){const l=known.get(id),t=l?.tasks.find(t=>t.id===taskId);if(!t)throw Error('Unknown remediation task');const saved=persist();const source=saved?refreshSession(id+':independent'):data.sessions[id+':independent'];if(source?.taskId===taskId&&!source.answers.length&&!source.done&&!source.registered){source.assisted=true;}
 const key=id+':guided',old=saved?refreshSession(key):data.sessions[key];if(old?.taskId===taskId&&!old.done){persist();return old;}
 const s={taskId,step:0,wrong:false,assisted:true,familiar:!!data.seen[taskId],done:false,draft:'',answers:[],started:startedAt(),registered:false};data.seen[taskId]=Math.max(1,data.seen[taskId]||0);initTrace(s,key,true);data.sessions[key]=s;persist();return s;}
 return {KEY,data,record,start,noteHelp,submitTrace,independentHandoff,finish,remediate,canAdvance,creditCheckpoint,persist,get warning(){return [warning,traceWarning].filter(Boolean).join(' ');},get original(){return raw;},export(){return {kind:'mathexam-profile-start',exportedAt:new Date().toISOString(),storage:'local-browser',...snapshot(mergeSessions(latestSessions))};}};
}
const api={KEY,create};root.ProfileState=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
