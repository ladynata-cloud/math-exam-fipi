(function(root){'use strict';
const KEY='mathexam.profileStart2027.v1';
function create(lessons,storage){
 const known=new Map(lessons.map(l=>[l.id,l])),tasks=new Set(lessons.flatMap(l=>l.tasks.map(t=>t.id)));let warning='',raw='',blocked=false;
 const data={version:1,records:{},seen:{},sessions:{}};
 try{raw=storage.getItem(KEY)||'';if(raw){const v=JSON.parse(raw);if(v.version!==1||!v.records||!v.seen||!v.sessions)throw Error();
  for(const l of lessons){const r=v.records[l.id];if(r&&typeof r==='object')data.records[l.id]={guided:[...new Set(Array.isArray(r.guided)?r.guided:[])].filter(id=>l.tasks.some(t=>t.id===id)).slice(0,20),independent:[...new Set(Array.isArray(r.independent)?r.independent:[])].filter(id=>l.tasks.slice(-3).some(t=>t.id===id)).slice(0,20),attempts:Math.max(0,Math.min(100000,Number(r.attempts)||0))};}
  for(const [id,n]of Object.entries(v.seen))if(tasks.has(id))data.seen[id]=Math.max(0,Math.min(100000,Math.floor(Number(n)||0)));
  for(const [key,s]of Object.entries(v.sessions)){const [id,mode]=key.split(':');const l=known.get(id);const t=l?.tasks.find(t=>t.id===s?.taskId);if(!t||!['guided','independent'].includes(mode)||!Number.isInteger(s.step)||s.step<0||s.step>t.steps.length)continue;
   data.sessions[key]={taskId:t.id,step:s.step,wrong:!!s.wrong,assisted:!!s.assisted,familiar:!!s.familiar,done:!!s.done,draft:typeof s.draft==='string'?s.draft.slice(0,200):'',answers:Array.isArray(s.answers)?s.answers.slice(0,15).map(String):[],started:typeof s.started==='string'?s.started:'',registered:!!s.registered};}
 }}catch(_){warning='Сохранение недоступно или повреждено. Старые данные оставлены без изменений; сейчас результаты хранятся только до закрытия страницы. Можно скачать резервную копию.';blocked=true;}
 function persist(){if(blocked)return false;try{
  const current=storage.getItem(KEY);if(current){let other;try{other=JSON.parse(current);if(other.version!==1||!other.records||!other.seen||!other.sessions)throw Error();}catch(_){blocked=true;raw=current;warning='Сохранение изменилось или повреждено. Оно оставлено без изменений; скачайте отчёт с текущими результатами.';return false;}
   // Preserve successes from another open tab instead of overwriting them.
   for(const l of lessons){const r=other.records[l.id];if(!r)continue;const own=record(l.id);for(const kind of ['guided','independent']){const pool=kind==='independent'?l.tasks.slice(-3):l.tasks.slice(0,-3);for(const id of Array.isArray(r[kind])?r[kind]:[])if(pool.some(t=>t.id===id)&&!own[kind].includes(id))own[kind].push(id);}own.attempts=Math.max(own.attempts,Math.min(100000,Number(r.attempts)||0));}
   for(const id of tasks)if(other.seen[id])data.seen[id]=Math.max(data.seen[id]||0,Math.min(100000,Number(other.seen[id])||0));
  }
  storage.setItem(KEY,JSON.stringify(data));return true;
 }catch(_){warning='Браузер не разрешил сохранить результаты. Скачайте отчёт перед закрытием страницы.';return false;}}
 function record(id){return data.records[id]||(data.records[id]={guided:[],independent:[],attempts:0});}
 function start(id,mode,fresh=false){const l=known.get(id);if(!l)throw Error('Unknown lesson');persist();const key=id+':'+mode;const old=data.sessions[key];if(old&&!fresh)return old;
 const pool=mode==='guided'?l.tasks.slice(0,-3):l.tasks.slice(-3);let t=pool.find(t=>!data.seen[t.id]);if(!t)t=pool.reduce((a,b)=>(data.seen[a.id]||0)<=(data.seen[b.id]||0)?a:b);
 const s={taskId:t.id,step:0,wrong:false,assisted:mode==='guided',familiar:!!data.seen[t.id],done:false,draft:'',answers:[],started:new Date().toISOString(),registered:false};
 data.seen[t.id]=(data.seen[t.id]||0)+1;data.sessions[key]=s;persist();return s;}
 function finish(id,mode,s){if(s.registered)return;const r=record(id);r.attempts++;if(mode==='guided'&&!r.guided.includes(s.taskId))r.guided.push(s.taskId);if(mode==='independent'&&!s.wrong&&!s.assisted&&!s.familiar&&!r.independent.includes(s.taskId))r.independent.push(s.taskId);s.done=true;s.registered=true;persist();}
 return {KEY,data,record,start,finish,persist,get warning(){return warning;},get original(){return raw;},export(){return {kind:'mathexam-profile-start',exportedAt:new Date().toISOString(),storage:'local-browser',...data};}};
}
const api={KEY,create};root.ProfileState=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
