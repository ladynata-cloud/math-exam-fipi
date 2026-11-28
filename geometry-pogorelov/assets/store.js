(function(root){'use strict';
const KEY='mathExamGeometry.pogorelov.v1',LEGACY='mathExamCourseProgress.pogorelov.v1';
const plain=x=>x&&typeof x==='object'&&!Array.isArray(x),finite=x=>typeof x==='number'&&Number.isFinite(x),str=(x,n)=>typeof x==='string'?x.slice(0,n):'',num=(x,max)=>finite(x)?Math.max(0,Math.min(max,Math.floor(x))):0;
function drawing(x){if(!plain(x)||!Array.isArray(x.points)||!Array.isArray(x.objects)||x.points.length>150||x.objects.length>180)return null;const kinds=['free','midpoint','sum','perp','iso','equalarm','onCircle','rightArc','foot','parallel','normal','bisector','affine','reflection','intersection'];const ids=new Set();for(const p of x.points){if(!plain(p)||!/^([A-Z][A-Z0-9]*|P\d+)$/.test(p.id)||ids.has(p.id)||!kinds.includes(p.kind)||!finite(p.x)||!finite(p.y)||Math.abs(p.x)+Math.abs(p.y)>1e7)return null;ids.add(p.id);for(const k of ['k','t'])if(p[k]!==undefined&&!finite(p[k]))return null;}const os=new Set();for(const o of x.objects){if(!plain(o)||typeof o.id!=='string'||o.id.length>40||os.has(o.id)||!['line','circle'].includes(o.type)||!ids.has(o.a)||!ids.has(o.b))return null;os.add(o.id);}for(const p of x.points){for(const k of ['a','b','c'])if(p[k]!==undefined&&!ids.has(p[k]))return null;for(const k of ['o1','o2'])if(p[k]!==undefined&&!os.has(p[k]))return null;}
 const pc=['id','kind','x','y','a','b','c','k','t','o1','o2','branch','draggable','added'],oc=['id','type','extent','a','b','added','construction'];return {points:x.points.map(p=>Object.fromEntries(pc.filter(k=>p[k]!==undefined).map(k=>[k,p[k]]))),objects:x.objects.map(o=>Object.fromEntries(oc.filter(k=>o[k]!==undefined).map(k=>[k,o[k]])))};}
function model(x){if(!plain(x)||!['box','pyramid','tetrahedron','octahedron','prism','frustum','cylinder','cone','cone-frustum','sphere'].includes(x.kind))return null;const out={kind:x.kind};for(const [k,lo,hi,d] of [['a',1,6,4],['b',.5,6,3],['h',1,6,4],['level',-.2,1.2,.5],['tilt',0,90,0],['turn',0,360,0]])out[k]=finite(x[k])?Math.max(lo,Math.min(hi,x[k])):d;out.points=Array.isArray(x.points)?x.points.slice(0,30).filter(p=>plain(p)&&/^[A-Z][0-9]*$/.test(p.id)&&['edge','foot'].includes(p.kind)).map(p=>p.kind==='edge'?{id:p.id,kind:p.kind,edge:num(p.edge,2000),t:finite(p.t)?Math.max(0,Math.min(1,p.t)):.5}:{id:p.id,kind:p.kind,source:str(p.source,10)}):[];out.lines=Array.isArray(x.lines)?x.lines.slice(0,100).filter(p=>plain(p)).map(p=>({a:str(p.a,10),b:str(p.b,10)})):[];out.planeMode=x.planeMode==='points'?'points':'slider';out.planeIds=Array.isArray(x.planeIds)?x.planeIds.slice(0,3).map(v=>str(v,10)):[];return out;}
const revisedLessons=new Set(['7-16','7-20','7-39','8-61','8-62','8-67','8-80','8-98','9-112','9-127','9-131'].map(suffix=>'pogorelov-base-'+suffix));
function cleanOriginal(x){if(!plain(x))return null;return {model:model(x.model),updated:num(x.updated,9e15),stage:num(x.stage,5),seed:num(x.seed,1e8),taskStep:num(x.taskStep,20),draft:str(x.draft,300),seenTasks:Array.isArray(x.seenTasks)?[...new Set(x.seenTasks.filter(k=>typeof k==='string'&&k.length>0&&k.length<=1000))].slice(-2048):[],currentTaskKey:str(x.currentTaskKey,1000),repeatedTask:!!x.repeatedTask,diagnosis:str(x.diagnosis,5000),written:str(x.written,20000),observation:str(x.observation,5000),proofDone:Array.isArray(x.proofDone)?x.proofDone.filter(s=>typeof s==='string'&&/^s\d+$/.test(s)).slice(0,20):[],moved:!!x.moved,construction:!!x.construction,guided:!!x.guided,proof:!!x.proof,complete:!!x.complete,independent:num(x.independent,1e6),attempts:num(x.attempts,1e6),hints:num(x.hints,1e6),assisted:!!x.assisted,checked:!!x.checked,drawing:drawing(x.drawing),events:Array.isArray(x.events)?x.events.slice(-300).filter(e=>plain(e)&&typeof e.type==='string').map(e=>({type:str(e.type,40),time:num(e.time,9e15)})):[]};}
// A previous task can have the same step IDs and a completely different question.
function clean(x){
 const entry=cleanOriginal(x);
 if(entry&&x.topicEdition===2){
  entry.topicEdition=2;
  entry.forecast=str(x.forecast,5000);
  const archive=cleanOriginal(x.previousEdition);
  if(archive)entry.previousEdition=archive;
 }
 return entry;
}
function recordFor(id,x){
 const entry=clean(x);
 if(!entry||!revisedLessons.has(id)||entry.topicEdition===2)return entry;
 const revised=clean({topicEdition:2,seed:1});
 revised.previousEdition=entry;
 return revised;
}
function retainArchive(current,other){
 if(current.topicEdition===2&&other?.previousEdition&&(!current.previousEdition||other.previousEdition.updated>current.previousEdition.updated)){
  current.previousEdition=other.previousEdition;
 }
 return current;
}
function validate(x,allowed){if(!plain(x)||x.version!==1||!plain(x.units))throw Error('Это не файл прогресса курса геометрии.');const units={};for(const [id,v] of Object.entries(x.units)){if(allowed.includes(id)){const c=recordFor(id,v);if(!c)throw Error('Повреждена запись урока '+id);units[id]=c;}}return {version:1,units};}
const TAB_COPY = KEY + '.tab-conflicts';
const conflictWarning = 'В другой вкладке уже изменили этот урок. Здесь осталась отдельная версия. Нажмите «Скачать прогресс» перед закрытием вкладки.';
function initialEntry(id) {
 return clean(revisedLessons.has(id) ? {topicEdition:2,seed:1} : {seed:1});
}
function sameWork(left,right) {
 // Opening a second tab records a visit without changing the learner's work.
 const withoutVisit = entry => ({...entry,updated:0,events:[]});
 return JSON.stringify(withoutVisit(left)) === JSON.stringify(withoutVisit(right));
}
function withEvent(candidate,previous,event) {
 candidate.updated=Math.max(Date.now(),(previous?.updated || 0)+1);
 const events=new Map();
 for (const item of [...(previous?.events || []),...candidate.events]) events.set(item.time+':'+item.type,item);
 if (event) events.set(candidate.updated+':'+event,{type:event,time:candidate.updated});
 candidate.events=[...events.values()].slice(-300);
 return candidate;
}
function updateLegacy(id,entry,warn) {
 try {
  const raw=localStorage.getItem(LEGACY),old=raw?JSON.parse(raw):{};
  if (!plain(old)) return;
  const key='pogorelov-'+id,prior=plain(old[key])?old[key]:{};
  old[key]={...prior,runs:Math.max(num(prior.runs,1e6),entry.attempts+(entry.previousEdition?.attempts||0)),best:Math.max(num(prior.best,100),entry.independent?100:0),passed:!!(prior.passed||entry.independent||entry.previousEdition?.independent),events:entry.events};
  localStorage.setItem(LEGACY,JSON.stringify(old));
 } catch { warn('Новая запись доступна в курсе; общий старый журнал обновить не удалось.'); }
}
function open(allowed,onError) {
 let blocked=false,memory={version:1,units:{}};
 const warn=message=>{if(onError)onError(message);};
 function read() {
  if (blocked) return memory;
  try {
   const raw=localStorage.getItem(KEY);
   return raw ? validate(JSON.parse(raw),allowed) : {version:1,units:{}};
  } catch {
   blocked=true;
   warn('Сохранение в браузере недоступно или повреждено. Прогресс этой вкладки можно скачать файлом.');
   return memory;
  }
 }
 function write(data) {
  memory=data;
  if (blocked) return;
  try { localStorage.setItem(KEY,JSON.stringify(data)); }
  catch { blocked=true;warn('В браузере не удалось сохранить изменения. Скачайте файл прогресса.'); }
 }
 memory=read();
 const baseline={...memory.units};
 let copies={};
 try {
  const raw=sessionStorage.getItem(TAB_COPY);
  if (raw) copies=validate(JSON.parse(raw),allowed).units;
 } catch { /* The current tab can still keep an exportable copy in memory. */ }
 if (Object.keys(copies).length) warn(conflictWarning);
 function saveTabCopy(id,work) {
  copies[id]=work;
  try { sessionStorage.setItem(TAB_COPY,JSON.stringify({version:1,units:copies})); }
  catch { warn('Отдельная версия этой вкладки хранится в памяти. Скачайте прогресс до обновления или закрытия страницы.');return; }
  warn(conflictWarning);
 }
 function view() { return {version:1,units:{...read().units,...copies}}; }
 return {
  get(id) {
   if (copies[id]) return clean(copies[id]);
   const current=read().units[id];
   baseline[id]=current;
   return clean(current)||initialEntry(id);
  },
  all:view,
  put(id,value,event) {
   if (!allowed.includes(id)) return;
   const data=read(),current=data.units[id],before=baseline[id]||initialEntry(id);
   let candidate=recordFor(id,value);
   if (!candidate) return;
   if (copies[id]) {
    saveTabCopy(id,withEvent(retainArchive(candidate,copies[id]),copies[id],event));
    return;
   }
   if (!sameWork(before,current||initialEntry(id)) && !sameWork(candidate,current)) {
    // An idle tab's download/pagehide must not replace a newer record. Keep
    // the old baseline until get() reloads that form, in case the user edits it.
    if (sameWork(candidate,before)) return;
    saveTabCopy(id,withEvent(retainArchive(candidate,before),before,event));
    return;
   }
   candidate=withEvent(retainArchive(candidate,current),current,event);
   data.units[id]=candidate;
   baseline[id]=candidate;
   write(data);
   if (!blocked) updateLegacy(id,candidate,warn);
  },
  import(data) {
   const incoming=validate(data,allowed),all=read();
   for (const [id,entry] of Object.entries(incoming.units)) {
    const current=all.units[id];
    all.units[id]=!current||entry.updated>current.updated?retainArchive(entry,current):retainArchive(current,entry);
   }
   write(all);
   return Object.keys(incoming.units).length;
  },
  export:view
 };
}
function download(data,name){const b=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(b),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
const api={open,clean,validate,drawing,download,KEY};root.GeoStore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
