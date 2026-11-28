(function(root){'use strict';
const KEY='mathExamGeometry.v1',LEGACY='mathExamCourseProgress.v1',HISTORY_KEY='mathExamGeometryCheckpoint.v1',HISTORY_LIMIT=512000;
const plain=x=>x&&typeof x==='object'&&!Array.isArray(x),finite=x=>typeof x==='number'&&Number.isFinite(x),str=(x,n)=>typeof x==='string'?x.slice(0,n):'',num=(x,max)=>finite(x)?Math.max(0,Math.min(max,Math.floor(x))):0;
function drawing(x){if(!plain(x)||!Array.isArray(x.points)||!Array.isArray(x.objects)||x.points.length>150||x.objects.length>180)return null;const kinds=['free','midpoint','sum','perp','iso','equalarm','onCircle','rightArc','foot','parallel','normal','bisector','affine','reflection','intersection'];const ids=new Set();for(const p of x.points){if(!plain(p)||!/^([A-Z][A-Z0-9]*|P\d+)$/.test(p.id)||ids.has(p.id)||!kinds.includes(p.kind)||!finite(p.x)||!finite(p.y)||Math.abs(p.x)+Math.abs(p.y)>1e7)return null;ids.add(p.id);for(const k of ['k','t'])if(p[k]!==undefined&&!finite(p[k]))return null;}const os=new Set();for(const o of x.objects){if(!plain(o)||typeof o.id!=='string'||o.id.length>40||os.has(o.id)||!['line','circle'].includes(o.type)||!ids.has(o.a)||!ids.has(o.b))return null;os.add(o.id);}for(const p of x.points){for(const k of ['a','b','c'])if(p[k]!==undefined&&!ids.has(p[k]))return null;for(const k of ['o1','o2'])if(p[k]!==undefined&&!os.has(p[k]))return null;}
 const pc=['id','kind','x','y','a','b','c','k','t','o1','o2','branch','draggable','added'],oc=['id','type','extent','a','b','added','construction'];return {points:x.points.map(p=>Object.fromEntries(pc.filter(k=>p[k]!==undefined).map(k=>[k,p[k]]))),objects:x.objects.map(o=>Object.fromEntries(oc.filter(k=>o[k]!==undefined).map(k=>[k,o[k]])))};}
function research(x){if(!plain(x))return null;const values={};for(const [k,v] of Object.entries(plain(x.values)?x.values:{})){if(/^[a-zA-Z][a-zA-Z0-9]*$/.test(k)&&((finite(v)&&Math.abs(v)<1e6)||(typeof v==='string'&&v.length<80)))values[k]=v;}const firstValues={};for(const [k,v] of Object.entries(plain(x.firstValues)?x.firstValues:{})){if(Object.hasOwn(values,k)&&typeof v===typeof values[k])firstValues[k]=v;}return {version:1,topic:str(x.topic,80),opened:!!x.opened,prediction:str(x.prediction,40),values,firstValues,changed:!!x.changed,observation:str(x.observation,5000)};}
function retained(x){if(!plain(x))return null;return {id:str(x.id,80),done:Array.isArray(x.done)?x.done.filter(a=>typeof a==='string'&&/^s\d+$/.test(a)).slice(0,20):[],written:str(x.written,20000)};}
function recovery(x){if(!plain(x))return null;return {at:num(x.at,9e15),reason:str(x.reason,200),stage:num(x.stage,5),seed:num(x.seed,1e8),written:str(x.written,20000),observation:str(x.observation,5000),draft:str(x.draft,300),drawing:drawing(x.drawing),research:research(x.research)};}
function clean(x){if(!plain(x))return null;return {updated:num(x.updated,9e15),stage:num(x.stage,5),uiVersion:2,practiceVersion:x.practiceVersion===1?1:0,proofId:str(x.proofId,80),retainedProof:retained(x.retainedProof),research:research(x.research),recoveries:Array.isArray(x.recoveries)?x.recoveries.slice(-5).map(recovery).filter(Boolean):[],errors:num(x.errors,1000),seed:num(x.seed,1e8),taskStep:num(x.taskStep,20),seenTasks:Array.isArray(x.seenTasks)?[...new Set(x.seenTasks.filter(k=>typeof k==='string'&&k.length>0&&k.length<=1000))].slice(-2048):[],currentTaskKey:str(x.currentTaskKey,1000),repeatedTask:!!x.repeatedTask,draft:str(x.draft,300),written:str(x.written,20000),observation:str(x.observation,5000),proofDone:Array.isArray(x.proofDone)?x.proofDone.filter(s=>typeof s==='string'&&/^s\d+$/.test(s)).slice(0,20):[],moved:!!x.moved,construction:!!x.construction,guided:!!x.guided,proof:!!x.proof,complete:!!x.complete,independent:num(x.independent,1e6),attempts:num(x.attempts,1e6),hints:num(x.hints,1e6),assisted:!!x.assisted,checked:!!x.checked,drawing:drawing(x.drawing),events:Array.isArray(x.events)?x.events.slice(-300).filter(e=>plain(e)&&typeof e.type==='string').map(e=>({type:str(e.type,40),time:num(e.time,9e15)})):[]};}
function validate(x,allowed){if(!plain(x)||x.version!==1||!plain(x.units))throw Error('Это не файл прогресса курса геометрии.');const units={};for(const [id,v] of Object.entries(x.units)){if(allowed.includes(id)){const c=clean(v);if(!c)throw Error('Повреждена запись урока '+id);units[id]=c;}}return {version:1,units};}
const stable=x=>JSON.stringify(x),copy=x=>JSON.parse(JSON.stringify(x));
// New work starts with research. Persisted stage numbers keep their historical meaning.
const fresh=()=>clean({seed:1,stage:1,practiceVersion:1,uiVersion:2});
const attemptKeys=['seed','practiceVersion','taskStep','draft','assisted','checked','errors','currentTaskKey','repeatedTask'];
function mergeConcurrent(base,local,remote){
 base=base||fresh();if(stable(remote)===stable(base))return {value:local,conflict:false};
 const out=clean(remote),changed=k=>stable(local[k])!==stable(base[k]),remoteChanged=k=>stable(remote[k])!==stable(base[k]);let conflict=false;
 const localTask=attemptKeys.some(changed),remoteTask=attemptKeys.some(remoteChanged),taskConflict=localTask&&remoteTask&&attemptKeys.some(k=>changed(k)&&stable(local[k])!==stable(remote[k]));
 for(const k of Object.keys(local)){
  if(['updated','events','recoveries'].includes(k)||!changed(k))continue;
  if(attemptKeys.includes(k)&&localTask&&remoteTask){if(stable(local[k])!==stable(remote[k]))conflict=true;continue;}
  if(['independent','attempts','hints'].includes(k)){if(!taskConflict)out[k]=Math.max(local[k],remote[k]);continue;}
  if(k==='seenTasks'){out[k]=[...new Set([...remote[k],...local[k]])].slice(-2048);continue;}
  if(!remoteChanged(k)||stable(local[k])===stable(remote[k]))out[k]=local[k];else conflict=true;
 }
 if(conflict)out.recoveries=[...remote.recoveries,recovery({...local,at:Date.now(),reason:'Параллельная запись: более свежая работа сохранена; здесь ваш предыдущий вариант.'})].slice(-5);
 return {value:clean(out),conflict};
}
// A navigation-entry checkpoint covers an immediate file:// reload. It is not
// a replacement for the downloaded progress file or durable browser storage.
function meaningful(record){const value=clean(record);delete value.updated;delete value.events;return stable(value);}
function mergeHistory(base,local,remote,accepted){
 if(!remote)return {value:copy(local),conflict:false};
 // One exact record actually adopted or successfully written by this document
 // can precede a still-debounced input. This is not ancestry inferred from time.
 const known=accepted&&stable(remote)===stable(accepted),result=mergeConcurrent(known?accepted:base,local,remote),unknown=!known&&meaningful(remote)!==meaningful(base)&&meaningful(remote)!==meaningful(local);
 const variants=[...remote.recoveries,...local.recoveries,...result.value.recoveries];
 // An unknown snapshot may be another tab, even with an older or equal clock.
 // If the three-way merge has no local delta (base==local), it must still keep
 // the last visible text and drawing as a recoverable variant.
 if(unknown&&['draft','written','observation','drawing','research'].some(k=>stable(local[k])!==stable(result.value[k]))){
  variants.push(recovery({...local,at:Date.now(),reason:'При открытии найдена другая запись. Она сохранена; здесь работа из предыдущего документа.'}));result.conflict=true;
 }
 const seen=new Set();result.value.recoveries=variants.filter(x=>{const value={...x};delete value.at;delete value.reason;const key=stable(value);if(seen.has(key))return false;seen.add(key);return true;}).slice(-5);
 const events=new Set();result.value.events=[...remote.events,...local.events].filter(x=>{const key=x.time+':'+x.type;if(events.has(key))return false;events.add(key);return true;}).slice(-300);
 return result;
}
function open(allowed,onError,currentUnit){
 let memory={version:1,units:{}},disk={version:1,units:{}},baselines={},pendingBases={},readWarning=false,writeWarning=false;const warn=m=>{if(onError)onError(m);};
 const offline=!!currentUnit&&allowed.includes(currentUnit)&&root.location?.protocol==='file:',url=offline?String(root.location.href).split('#')[0]:null;
 let entryBase=null,lastCheckpoint=null,historyWarning=false,hydrating=false,accepted=null,restoreAccepted=null;
 function historyFailure(){if(!historyWarning)warn('Не удалось сохранить резервную запись автономной страницы для перезагрузки. Текст остаётся в этой вкладке; скачайте файл прогресса.');historyWarning=true;}
 // HTTP must never access history. In a file document, hydrate only this unit
 // and URL, once, before lesson.js can write its initial start event.
 if(offline)try{
  const envelope=root.history.state?.[HISTORY_KEY];
  if(plain(envelope)&&envelope.version===1&&envelope.url===url&&envelope.unit===currentUnit&&plain(envelope.base)&&plain(envelope.local)&&(envelope.accepted==null||plain(envelope.accepted))&&stable(envelope).length<=HISTORY_LIMIT){
   const base=clean(envelope.base),local=clean(envelope.local),predecessor=clean(envelope.accepted);
   if([base,local,predecessor].every(v=>!v?.research||v.research.topic===currentUnit)){
    memory.units[currentUnit]=local;pendingBases[currentUnit]=base;restoreAccepted=predecessor;hydrating=true;lastCheckpoint=meaningful(local);
   }
  }
 }catch(e){historyFailure();}
 // A quota failure must keep local work, but must not hide newer work written by another tab.
 // Pending records use the last disk snapshot as their three-way merge ancestor.
 function read(){
  let next;try{const raw=localStorage.getItem(KEY);next=raw?validate(JSON.parse(raw),allowed):{version:1,units:{}};readWarning=false;}
  catch(e){if(!readWarning)warn('Сохранение в браузере недоступно или повреждено. Прогресс этой вкладки можно скачать файлом.');readWarning=true;return memory;}
  disk=copy(next);
  for(const [id,base] of Object.entries(pendingBases)){
   const local=memory.units[id],remote=next.units[id];if(!local)continue;
   const restoring=hydrating&&id===currentUnit,result=restoring?mergeHistory(base,local,remote,restoreAccepted):remote?mergeConcurrent(base,local,remote):{value:local,conflict:false};
   result.value.updated=Math.max(local.updated,remote?.updated||0);next.units[id]=result.value;pendingBases[id]=copy(remote||fresh());
   if(result.conflict)warn(restoring?'При открытии найдена другая запись темы. Она сохранена; ваш текст и чертёж доступны в сохранённых вариантах и файле прогресса.':'Во время ошибки сохранения другая вкладка обновила работу. Новая работа и ваш сохранённый вариант включены в файл прогресса.');
  }
  hydrating=false;
  return memory=next;
 }
 function pending(id){if(!Object.hasOwn(pendingBases,id))pendingBases[id]=copy(disk.units[id]||fresh());}
 function persist(){try{localStorage.setItem(KEY,JSON.stringify(memory));disk=copy(memory);pendingBases={};writeWarning=false;return true;}catch(e){if(!writeWarning)warn('В браузере не удалось сохранить изменения. Скачайте файл прогресса.');writeWarning=true;return false;}}
 memory=read();baselines=copy(memory.units);if(offline)entryBase=clean(memory.units[currentUnit])||fresh();
 function checkpoint(id,value){
  if(!offline||id!==currentUnit)return;
  const local=clean(value);if(!local)return;const signature=meaningful(local);
  // Keep the preceding document's ancestor across unchanged start/autosave/
  // pagehide calls. Only a meaningful edit writes this document's fixed base.
  if(signature===lastCheckpoint)return;
  try{
   const foreign=root.history.state;
   if(foreign!==null&&(!plain(foreign)||Object.prototype.toString.call(foreign)!=='[object Object]'))throw Error('Unsupported history state');
   const envelope={version:1,url,unit:currentUnit,base:entryBase,accepted,local};
   if(stable(envelope).length>HISTORY_LIMIT)throw Error('Checkpoint too large');
   // Clone before adding our namespace: foreign graphs (including references
   // back to their root) must survive without mutating the live history state.
   const next=foreign===null?{}:root.structuredClone(foreign);next[HISTORY_KEY]=envelope;
   root.history.replaceState(next,'');
   if(stable(root.history.state?.[HISTORY_KEY])!==stable(envelope))throw Error('Checkpoint was not retained');
   lastCheckpoint=signature;historyWarning=false;
  }catch(e){historyFailure();}
 }
 return {
  checkpoint,
  get(id){const v=clean(read().units[id])||fresh();baselines[id]=copy(v);if(offline&&id===currentUnit)accepted=copy(v);return v;},
  all(){return read();},
  put(id,v,event){if(!allowed.includes(id))return v;const d=read(),local=clean(v),remote=d.units[id],base=baselines[id],result=remote?mergeConcurrent(base,local,remote):{value:local,conflict:false};const c=result.value;
   c.updated=Math.max(Date.now(),(remote?.updated||0)+1);const seen=new Set();c.events=[...(remote?.events||[]),...c.events].filter(e=>{const k=e.time+':'+e.type;if(seen.has(k))return false;seen.add(k);return true;});if(event)c.events.push({type:event,time:c.updated});c.events=c.events.slice(-300);pending(id);d.units[id]=c;memory=d;const persisted=persist();baselines[id]=copy(c);v.updated=c.updated;
   if(result.conflict)warn('В другой вкладке уже есть более свежая работа. Она сохранена; ваш вариант доступен в сохранённых вариантах и скачиваемом файле.');
   checkpoint(id,c);
   // The checkpoint of a new explicit action still needs its prior witness.
   // Only a later input may use this newly persisted, returned record as base.
   if(offline&&id===currentUnit&&persisted)accepted=copy(c);
   try{const raw=localStorage.getItem(LEGACY),old=raw?JSON.parse(raw):{};if(plain(old)){const k='atlas-'+id,p=plain(old[k])?old[k]:{};old[k]={...p,runs:Math.max(num(p.runs,1e6),c.attempts),best:Math.max(num(p.best,100),c.independent?100:0),passed:!!c.independent,events:c.events};localStorage.setItem(LEGACY,JSON.stringify(old));}}catch(e){warn('Новая запись доступна в курсе; общий старый журнал обновить не удалось.');}
   const response=copy(c);Object.defineProperty(response,'_conflict',{value:result.conflict});return response;
  },
  import(data){const d=validate(data,allowed),all=read();for(const [id,v] of Object.entries(d.units))if(!all.units[id]||v.updated>all.units[id].updated){pending(id);all.units[id]=v;}memory=all;persist();if(offline&&memory.units[currentUnit])checkpoint(currentUnit,memory.units[currentUnit]);return Object.keys(d.units).length;},
  export(){return memory=read();}
 };
}
function download(data,name){const b=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(b),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
const api={open,clean,validate,drawing,download,KEY,HISTORY_KEY,fresh,mergeConcurrent};root.GeoStore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
