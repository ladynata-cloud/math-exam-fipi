(function(root){'use strict';
const KEY='mathExamGeometry.merzlyak.v1',LEGACY='mathExamCourseProgress.merzlyak.v1';
const CONTENT_VERSIONS={'merzlyak-base-8-12':2,'merzlyak-base-8-13':2,'merzlyak-base-8-14':2};
const plain=x=>x&&typeof x==='object'&&!Array.isArray(x),finite=x=>typeof x==='number'&&Number.isFinite(x),str=(x,n)=>typeof x==='string'?x.slice(0,n):'',num=(x,max)=>finite(x)?Math.max(0,Math.min(max,Math.floor(x))):0;
function drawing(x){if(!plain(x)||!Array.isArray(x.points)||!Array.isArray(x.objects)||x.points.length>150||x.objects.length>180)return null;const kinds=['free','midpoint','sum','perp','iso','equalarm','onCircle','rightArc','foot','parallel','normal','bisector','affine','reflection','intersection'];const ids=new Set();for(const p of x.points){if(!plain(p)||!/^([A-Z][A-Z0-9]*|P\d+)$/.test(p.id)||ids.has(p.id)||!kinds.includes(p.kind)||!finite(p.x)||!finite(p.y)||Math.abs(p.x)+Math.abs(p.y)>1e7)return null;ids.add(p.id);for(const k of ['k','t'])if(p[k]!==undefined&&!finite(p[k]))return null;}const os=new Set();for(const o of x.objects){if(!plain(o)||typeof o.id!=='string'||o.id.length>40||os.has(o.id)||!['line','circle'].includes(o.type)||!ids.has(o.a)||!ids.has(o.b))return null;os.add(o.id);}for(const p of x.points){for(const k of ['a','b','c'])if(p[k]!==undefined&&!ids.has(p[k]))return null;for(const k of ['o1','o2'])if(p[k]!==undefined&&!os.has(p[k]))return null;}
 const pc=['id','kind','x','y','a','b','c','k','t','o1','o2','branch','draggable','added'],oc=['id','type','extent','a','b','added','construction'];return {points:x.points.map(p=>Object.fromEntries(pc.filter(k=>p[k]!==undefined).map(k=>[k,p[k]]))),objects:x.objects.map(o=>Object.fromEntries(oc.filter(k=>o[k]!==undefined).map(k=>[k,o[k]])))};}
function model(x){if(!plain(x)||!['box','pyramid','tetrahedron','octahedron','prism','frustum','cylinder','cone','cone-frustum','sphere'].includes(x.kind))return null;const out={kind:x.kind};for(const [k,lo,hi,d] of [['a',1,6,4],['b',.5,6,3],['h',1,6,4],['level',-.2,1.2,.5],['tilt',0,90,0],['turn',0,360,0]])out[k]=finite(x[k])?Math.max(lo,Math.min(hi,x[k])):d;out.points=Array.isArray(x.points)?x.points.slice(0,30).filter(p=>plain(p)&&/^[A-Z][0-9]*$/.test(p.id)&&['edge','foot'].includes(p.kind)).map(p=>p.kind==='edge'?{id:p.id,kind:p.kind,edge:num(p.edge,2000),t:finite(p.t)?Math.max(0,Math.min(1,p.t)):.5}:{id:p.id,kind:p.kind,source:str(p.source,10)}):[];out.lines=Array.isArray(x.lines)?x.lines.slice(0,100).filter(p=>plain(p)).map(p=>({a:str(p.a,10),b:str(p.b,10)})):[];out.planeMode=x.planeMode==='points'?'points':'slider';out.planeIds=Array.isArray(x.planeIds)?x.planeIds.slice(0,3).map(v=>str(v,10)):[];return out;}
function clean(x,depth=0){if(!plain(x))return null;return {contentVersion:num(x.contentVersion,99),previousContent:depth<1&&plain(x.previousContent)?clean(x.previousContent,1):null,model:model(x.model),updated:num(x.updated,9e15),stage:num(x.stage,5),seed:num(x.seed,1e8),taskStep:num(x.taskStep,20),draft:str(x.draft,300),diagnosis:str(x.diagnosis,5000),attemptSchema:x.attemptSchema===2?2:0,tries:num(x.tries,1e6),solved:!!x.solved,result:['first','corrected','helped','repeated','legacy'].includes(x.result)?x.result:'',selfCorrected:num(x.selfCorrected,1e6),assistedSolved:num(x.assistedSolved,1e6),seenTasks:Array.isArray(x.seenTasks)?[...new Set(x.seenTasks.filter(k=>typeof k==='string'&&k.length>0&&k.length<=1000))].slice(-2048):[],currentTaskKey:str(x.currentTaskKey,1000),repeatedTask:!!x.repeatedTask,written:str(x.written,20000),observation:str(x.observation,5000),proofDone:Array.isArray(x.proofDone)?x.proofDone.filter(s=>typeof s==='string'&&/^s\d+$/.test(s)).slice(0,20):[],moved:!!x.moved,construction:!!x.construction,guided:!!x.guided,proof:!!x.proof,complete:!!x.complete,independent:num(x.independent,1e6),attempts:num(x.attempts,1e6),hints:num(x.hints,1e6),assisted:!!x.assisted,checked:!!x.checked,drawing:drawing(x.drawing),events:Array.isArray(x.events)?x.events.slice(-300).filter(e=>plain(e)&&typeof e.type==='string').map(e=>({type:str(e.type,40),time:num(e.time,9e15)})):[]};}
function currentVersion(id){return CONTENT_VERSIONS[id]||1;}
function migrateUnit(id,state){
 const version=currentVersion(id);
 if(state.contentVersion>=version)return state;
 if(version===1){state.contentVersion=1;return state;}
 const next=clean({seed:1,attemptSchema:2,contentVersion:version});
 next.previousContent=state;next.updated=state.updated;
 // Archive the whole previous exercise attempt; do not credit its old, different
 // proof or always-yes task to the revised similarity skill.
 return next;
}
function validate(x,allowed){if(!plain(x)||x.version!==1||!plain(x.units))throw Error('Это не файл прогресса курса геометрии.');const units={};for(const [id,v] of Object.entries(x.units)){if(allowed.includes(id)){const c=clean(v);if(!c)throw Error('Повреждена запись урока '+id);units[id]=migrateUnit(id,c);}}return {version:1,units};}
function open(allowed,onError){let blocked=false,memory={version:1,units:{}};const warn=m=>{if(onError)onError(m);};function read(){if(blocked)return memory;try{const raw=localStorage.getItem(KEY);return memory=raw?validate(JSON.parse(raw),allowed):{version:1,units:{}};}catch(e){blocked=true;warn('Сохранение в браузере недоступно или повреждено. Прогресс этой вкладки можно скачать файлом.');return memory;}}
 memory=read();return {get(id){return clean(read().units[id])||clean({seed:1,attemptSchema:2,contentVersion:currentVersion(id)});},all(){return read();},put(id,v,event){if(!allowed.includes(id))return;const d=read(),c=clean(v);c.updated=Date.now();const seen=new Set();c.events=[...(d.units[id]?.events||[]),...c.events].filter(e=>{const k=e.time+':'+e.type;if(seen.has(k))return false;seen.add(k);return true;});if(event)c.events.push({type:event,time:c.updated});c.events=c.events.slice(-300);d.units[id]=migrateUnit(id,c);memory=d;if(!blocked){try{localStorage.setItem(KEY,JSON.stringify(d));}catch(e){blocked=true;warn('В браузере не удалось сохранить изменения. Скачайте файл прогресса.');}}
 try{const raw=localStorage.getItem(LEGACY),old=raw?JSON.parse(raw):{};if(!plain(old))return;const k='merzlyak-'+id,p=plain(old[k])?old[k]:{};old[k]={...p,runs:Math.max(num(p.runs,1e6),c.attempts),best:Math.max(num(p.best,100),c.independent?100:0),passed:!!c.independent,events:c.events};localStorage.setItem(LEGACY,JSON.stringify(old));}catch(e){warn('Новая запись доступна в курсе; общий старый журнал обновить не удалось.');}},import(data){const d=validate(data,allowed),all=read();for(const [id,v] of Object.entries(d.units)){
 const existing=all.units[id],isOldContent=currentVersion(id)>1&&num(data.units[id]?.contentVersion,99)<currentVersion(id);
 if(existing&&isOldContent&&hasWork(existing)){
  if(v.previousContent&&(!existing.previousContent||v.previousContent.updated>existing.previousContent.updated))existing.previousContent=v.previousContent;
 }else if(!existing||v.updated>existing.updated)all.units[id]=v;
}memory=all;if(!blocked){try{localStorage.setItem(KEY,JSON.stringify(all));}catch(e){blocked=true;warn('Импортированное сохранено в этой вкладке; скачайте резервную копию.');}}return Object.keys(d.units).length;},export(){return memory=read();}};}
function download(data,name){const b=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(b),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
// Errors and assistance are independent. Legacy checked attempts have no reliable
// per-attempt outcome; preserve their totals and require a fresh task for new credit.
function recordAnswer(state,correct){
 const first=!state.checked,alreadySolved=state.solved;
 state.checked=true;if(first)state.attempts++;
 state.tries=(state.tries||0)+1;
 if(!correct)return 'wrong';
 if(alreadySolved)return state.result||'legacy';
 state.solved=true;
 if(state.repeatedTask)state.result='repeated';
 else if(state.attemptSchema!==2)state.result='legacy';
 else if(state.assisted){state.result='helped';state.assistedSolved++;}
 else if(state.tries===1){state.result='first';state.independent++;}
 else{state.result='corrected';state.selfCorrected++;}
 return state.result;
}
function hasWork(v){return !!v&&(v.stage>0||!!v.draft?.trim()||!!v.diagnosis?.trim()||!!v.written?.trim()||!!v.observation?.trim()||v.moved||v.construction||v.guided||v.proof||v.attempts>0||v.independent>0||v.selfCorrected>0);}
function progress(v){
 return {started:hasWork(v),independent:(v?.independent||0)+(v?.selfCorrected||0),first:v?.independent||0,corrected:v?.selfCorrected||0,helped:v?.assistedSolved||0,investigated:!!(v?.moved&&v?.observation?.trim()),guided:!!v?.guided,proofWithSupport:!!v?.proof,written:!!v?.written?.trim(),complete:!!v?.complete};
}
const api={open,clean,validate,drawing,download,recordAnswer,hasWork,progress,currentVersion,KEY};root.GeoStore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
