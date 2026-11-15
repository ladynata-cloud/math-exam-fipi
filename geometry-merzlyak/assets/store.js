(function(root){'use strict';
const KEY='mathExamGeometry.merzlyak.v1',RECOVERY=KEY+'.recovery.',LEGACY='mathExamCourseProgress.merzlyak.v1';
const CONTENT_VERSIONS={'merzlyak-base-8-12':2,'merzlyak-base-8-13':2,'merzlyak-base-8-14':2};
const plain=x=>x&&typeof x==='object'&&!Array.isArray(x),finite=x=>typeof x==='number'&&Number.isFinite(x),str=(x,n)=>typeof x==='string'?x.slice(0,n):'',num=(x,max)=>finite(x)?Math.max(0,Math.min(max,Math.floor(x))):0;
function drawing(x){if(!plain(x)||!Array.isArray(x.points)||!Array.isArray(x.objects)||x.points.length>150||x.objects.length>180)return null;const kinds=['free','midpoint','sum','perp','iso','equalarm','onCircle','rightArc','foot','parallel','normal','bisector','affine','reflection','intersection'];const ids=new Set();for(const p of x.points){if(!plain(p)||!/^([A-Z][A-Z0-9]*|P\d+)$/.test(p.id)||ids.has(p.id)||!kinds.includes(p.kind)||!finite(p.x)||!finite(p.y)||Math.abs(p.x)+Math.abs(p.y)>1e7)return null;ids.add(p.id);for(const k of ['k','t'])if(p[k]!==undefined&&!finite(p[k]))return null;}const os=new Set();for(const o of x.objects){if(!plain(o)||typeof o.id!=='string'||o.id.length>40||os.has(o.id)||!['line','circle'].includes(o.type)||!ids.has(o.a)||!ids.has(o.b))return null;os.add(o.id);}for(const p of x.points){for(const k of ['a','b','c'])if(p[k]!==undefined&&!ids.has(p[k]))return null;for(const k of ['o1','o2'])if(p[k]!==undefined&&!os.has(p[k]))return null;}
 const pc=['id','kind','x','y','a','b','c','k','t','o1','o2','branch','draggable','added'],oc=['id','type','extent','a','b','added','construction'];return {points:x.points.map(p=>Object.fromEntries(pc.filter(k=>p[k]!==undefined).map(k=>[k,p[k]]))),objects:x.objects.map(o=>Object.fromEntries(oc.filter(k=>o[k]!==undefined).map(k=>[k,o[k]])))};}
function model(x){if(!plain(x)||!['box','pyramid','tetrahedron','octahedron','prism','frustum','cylinder','cone','cone-frustum','sphere'].includes(x.kind))return null;const out={kind:x.kind};for(const [k,lo,hi,d] of [['a',1,6,4],['b',.5,6,3],['h',1,6,4],['level',-.2,1.2,.5],['tilt',0,90,0],['turn',0,360,0]])out[k]=finite(x[k])?Math.max(lo,Math.min(hi,x[k])):d;out.points=Array.isArray(x.points)?x.points.slice(0,30).filter(p=>plain(p)&&/^[A-Z][0-9]*$/.test(p.id)&&['edge','foot'].includes(p.kind)).map(p=>p.kind==='edge'?{id:p.id,kind:p.kind,edge:num(p.edge,2000),t:finite(p.t)?Math.max(0,Math.min(1,p.t)):.5}:{id:p.id,kind:p.kind,source:str(p.source,10)}):[];out.lines=Array.isArray(x.lines)?x.lines.slice(0,100).filter(p=>plain(p)).map(p=>({a:str(p.a,10),b:str(p.b,10)})):[];out.planeMode=x.planeMode==='points'?'points':'slider';out.planeIds=Array.isArray(x.planeIds)?x.planeIds.slice(0,3).map(v=>str(v,10)):[];return out;}
const indices=x=>Array.isArray(x)?[...new Set(x.filter(i=>Number.isInteger(i)&&i>=0&&i<20))]:[];
const outcome=x=>['first','corrected','helped','repeated','legacy'].includes(x)?x:'';
// The new inquiry screen is separate from the six historical numeric stages.
// Existing diagrams, notes and stage numbers keep their original meaning.
function researchControls(x){
 const result={};if(!plain(x))return result;
 for(const [key,value]of Object.entries(x).slice(0,32)){
  if(!/^[a-z][\w-]{0,40}$/i.test(key)||['__proto__','constructor','prototype'].includes(key))continue;
  if(finite(value)&&Math.abs(value)<=1e12)result[key]=value;
  else if(typeof value==='string')result[key]=value.slice(0,120);
 }
 return result;
}
function research(x){
 if(!plain(x))return null;
 const first=typeof x.firstPrediction==='string'?str(x.firstPrediction,500):null;
 const started=x.started===true&&!!first?.trim();
 const observations=Array.isArray(x.observations)?x.observations.filter(plain).slice(-12).map(v=>({controls:researchControls(v.controls),text:str(v.text,1800)})):[];
 const distinct=new Set(observations.map(v=>JSON.stringify(v.controls)));const conclusionOpen=started&&distinct.size>=2&&observations.some(v=>v.text.trim())&&x.conclusionOpen===true;
 return {schema:1,predictionDraft:str(x.predictionDraft,500),firstPrediction:first,started,controls:researchControls(x.controls),observations,observationDraft:str(x.observationDraft,2000),conclusionOpen,completed:x.completed===true&&conclusionOpen,helped:x.helped===true};
}
function support(x){return {solvedDraft:str(x.solvedDraft,300),guidedDraft:typeof x.guidedDraft==='string'?str(x.guidedDraft,300):x.stage===3?str(x.draft,300):'',helpRevealed:num(x.helpRevealed,20),helpExplained:indices(x.helpExplained),fullSolution:!!x.fullSolution,guidedHintSteps:indices(x.guidedHintSteps),mistakes:num(x.mistakes,1e6),lastCheck:['wrong','correct'].includes(x.lastCheck)?x.lastCheck:'',lastCheckMode:['guided','independent'].includes(x.lastCheckMode)?x.lastCheckMode:x.lastCheck?(x.stage===3?'guided':'independent'):'',lastWrong:str(x.lastWrong,300),errorAdvice:str(x.errorAdvice,3000),errorAdviceCode:str(x.errorAdviceCode,80),errorAdviceAnswer:str(x.errorAdviceAnswer,300),guidedErrorStep:num(x.guidedErrorStep,20)};}
function attempt(x){return {taskKey:str(x.taskKey,1000),seed:num(x.seed,1e8),question:str(x.question,2000),draft:str(x.draft,300),result:outcome(x.result),assisted:!!(x.assisted||num(x.helpRevealed,20)||indices(x.helpExplained).length||x.fullSolution||indices(x.guidedHintSteps).length||str(x.errorAdvice,3000)),tries:num(x.tries,1e6),taskStep:num(x.taskStep,20),time:num(x.time,9e15),...support(x)};}
function clean(x,depth=0){if(!plain(x))return null;return {...support(x),workRevision:/^[a-zA-Z0-9.-]{1,120}$/.test(x.workRevision||'')?x.workRevision:'',routeVersion:x.routeVersion===2?2:0,screen:x.screen==='research'?'research':'',research:research(x.research),proofDrawing:drawing(x.proofDrawing),proofChecks:indices(x.proofChecks),diagnosisShown:!!x.diagnosisShown,observationShown:!!x.observationShown,noFreshTask:!!x.noFreshTask,recentAttempts:Array.isArray(x.recentAttempts)?x.recentAttempts.filter(plain).slice(-20).map(attempt):[],contentVersion:num(x.contentVersion,99),previousContent:depth<1&&plain(x.previousContent)?clean(x.previousContent,1):null,model:model(x.model),updated:num(x.updated,9e15),stage:num(x.stage,5),seed:num(x.seed,1e8),taskStep:num(x.taskStep,20),draft:str(x.draft,300),diagnosis:str(x.diagnosis,5000),attemptSchema:x.attemptSchema===2?2:0,tries:num(x.tries,1e6),solved:!!x.solved,result:outcome(x.result),selfCorrected:num(x.selfCorrected,1e6),assistedSolved:num(x.assistedSolved,1e6),seenTasks:Array.isArray(x.seenTasks)?[...new Set(x.seenTasks.filter(k=>typeof k==='string'&&k.length>0&&k.length<=1000))].slice(-2048):[],currentTaskKey:str(x.currentTaskKey,1000),repeatedTask:!!x.repeatedTask,written:str(x.written,20000),observation:str(x.observation,5000),proofDone:Array.isArray(x.proofDone)?x.proofDone.filter(s=>typeof s==='string'&&/^s\d+$/.test(s)).slice(0,20):[],moved:!!x.moved,construction:!!x.construction,guided:!!x.guided,proof:!!x.proof,complete:!!x.complete,independent:num(x.independent,1e6),attempts:num(x.attempts,1e6),hints:num(x.hints,1e6),assisted:!!(x.assisted||num(x.helpRevealed,20)||indices(x.helpExplained).length||x.fullSolution||indices(x.guidedHintSteps).length||str(x.errorAdvice,3000)),checked:!!x.checked,drawing:drawing(x.drawing),events:Array.isArray(x.events)?x.events.slice(-300).filter(e=>plain(e)&&typeof e.type==='string').map(e=>({type:str(e.type,40),time:num(e.time,9e15)})):[]};}
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
const revisionId=x=>typeof x==='string'&&/^[a-zA-Z0-9.-]{1,120}$/.test(x);
function recoveryRecord(x,allowed){
 if(!plain(x)||x.version!==1||!revisionId(x.id)||!allowed.includes(x.unit)||!['snapshot','conflict'].includes(x.kind)||!(x.parent===null||revisionId(x.parent))||!Number.isSafeInteger(x.clock)||x.clock<1)return null;
 const state=clean(x.state);if(!state)return null;state.workRevision=x.id;
 const migrated=migrateUnit(x.unit,state);migrated.workRevision=x.id;return {version:1,id:x.id,unit:x.unit,kind:x.kind,parent:x.parent,lineage:Array.isArray(x.lineage)?[...new Set(x.lineage.filter(revisionId))].slice(0,128):[],clock:x.clock,state:migrated};
}
function validate(x,allowed){
 if(!plain(x)||x.version!==1||!plain(x.units))throw Error('Это не файл прогресса курса геометрии.');
 const units={};for(const [id,v] of Object.entries(x.units)){if(allowed.includes(id)){const c=clean(v);if(!c)throw Error('Повреждена запись урока '+id);units[id]=migrateUnit(id,c);}}
 const out={version:1,units};
 if(x.recovery!==undefined){if(!Array.isArray(x.recovery)||x.recovery.length>2048)throw Error('Неподдерживаемый журнал восстановления.');out.recovery=x.recovery.map(v=>recoveryRecord(v,allowed)).filter(Boolean);if(out.recovery.length!==x.recovery.length)throw Error('Повреждена запись восстановления.');}
 return out;
}
function open(allowed,onError){
 let blocked=false,memory={version:1,units:{}},journal=new Map(),metadata=new Map();
 const expected=new Map(),expectedMeta=new Map(),expectedValue=new Map(),warn=m=>{if(onError)onError(m);};
 const fingerprint=value=>JSON.stringify(value||null),uuid=()=>root.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)+'-'+Math.random().toString(36).slice(2);
 const order=(a,b)=>a.state.updated-b.state.updated||a.clock-b.clock||a.id.localeCompare(b.id);
 const taskKey=v=>v.currentTaskKey||v.taskKey||'';
 const sameTask=(a,b)=>taskKey(a)&&taskKey(b)?taskKey(a)===taskKey(b):a.seed===b.seed;
 const helped=v=>!!(v.assisted||v.fullSolution||v.helpRevealed||v.helpExplained?.length||v.guidedHintSteps?.length||v.errorAdvice);
 function reconcile(value,otherRecords){
  const out=clean(value),sources=otherRecords.map(r=>r.state),adjusted=new Set();if(!out||!sources.length)return out;
  out.seenTasks=[...new Set([...out.seenTasks,...sources.flatMap(v=>v.seenTasks)])].slice(-2048);
  function reconcileAttempt(attempt,current){
   const key=taskKey(attempt)||'seed:'+attempt.seed,matched=[];
   for(const source of sources){if(sameTask(attempt,source))matched.push({attempt:source,totals:source,historical:false});for(const old of source.recentAttempts||[])if(sameTask(attempt,old))matched.push({attempt:old,totals:source,historical:true});}
   if(current&&matched.length){
    out.assisted ||= matched.some(v=>helped(v.attempt));out.fullSolution ||= matched.some(v=>v.attempt.fullSolution);
    out.helpRevealed=Math.max(out.helpRevealed,...matched.map(v=>v.attempt.helpRevealed||0));
    out.helpExplained=[...new Set([...out.helpExplained,...matched.flatMap(v=>v.attempt.helpExplained||[])])];
    out.guidedHintSteps=[...new Set([...out.guidedHintSteps,...matched.flatMap(v=>v.attempt.guidedHintSteps||[])])];
    out.mistakes=Math.max(out.mistakes,...matched.map(v=>v.attempt.mistakes||0));
   }
   if(!['first','corrected'].includes(attempt.result)||adjusted.has(key))return;
   // Shared historical evidence belongs to this exact attempt, not to a new
   // seed which happens to generate the same condition. New work elsewhere
   // may increase cumulative totals without invalidating that older credit.
   if(matched.some(v=>v.historical&&v.attempt.seed===attempt.seed&&v.attempt.result===attempt.result))return;
   const metric=attempt.result==='first'?'independent':'selfCorrected',before=value[metric];
   // Only this newly disputed credit is reclassified. An alternative which
   // already contains the earned credit proves that it preceded later help.
   const challenges=matched.filter(v=>(v.totals[metric]||0)<before);
   const familiar=challenges.some(v=>v.attempt.repeatedTask||v.attempt.result==='repeated'||v.attempt.seed!==attempt.seed&&taskKey(v.attempt)&&taskKey(v.attempt)===taskKey(attempt))||sources.some(v=>!sameTask(attempt,v)&&v.seenTasks.includes(taskKey(attempt))&&(v[metric]||0)<before);
   const assistance=challenges.some(v=>helped(v.attempt)),mistake=challenges.some(v=>v.attempt.mistakes>0||v.attempt.lastCheck==='wrong');
   const result=familiar?'repeated':assistance?'helped':attempt.result==='first'&&mistake?'corrected':attempt.result;
   if(result===attempt.result)return;
   adjusted.add(key);out[metric]=Math.max(0,out[metric]-1);attempt.result=result;
   if(result==='helped'){attempt.assisted=true;out.assistedSolved=Math.max(out.assistedSolved,Math.min(value.assistedSolved,...challenges.map(v=>v.totals.assistedSolved||0))+1);}
   if(result==='corrected')out.selfCorrected=Math.max(out.selfCorrected,Math.min(value.selfCorrected,...challenges.map(v=>v.totals.selfCorrected||0))+1);
   if(current&&result==='repeated')out.repeatedTask=true;
  }
  reconcileAttempt(out,true);for(const old of out.recentAttempts)reconcileAttempt(old,false);
  return out;
 }
 function comparable(value){const out=clean(value);if(!out)return '';for(const key of ['independent','selfCorrected','assistedSolved','result','assisted','fullSolution','helpRevealed','helpExplained','guidedHintSteps','mistakes','repeatedTask','seenTasks'])delete out[key];out.recentAttempts=out.recentAttempts.map(v=>{const x={...v};delete x.result;delete x.assisted;return x;});return fingerprint(out);}

 function supportsJournal(){return typeof localStorage.key==='function'&&typeof localStorage.removeItem==='function'&&Number.isFinite(localStorage.length);}
 function mergeRecords(base,records){
  const result={version:1,units:{...base.units}},meta=new Map();
  for(const id of allowed){
   const all=records.filter(r=>r.unit===id),snapshots=all.filter(r=>r.kind==='snapshot');
   const ancestors=new Set(snapshots.flatMap(r=>[r.parent,...r.lineage].filter(Boolean))),heads=snapshots.filter(r=>!ancestors.has(r.id)).sort(order);
   const latest=heads.at(-1),original=base.units[id],matching=original?.workRevision?all.find(r=>r.id===original.workRevision):null;
   // A legacy writer can update the compatible snapshot without a revision. A
   // genuinely newer snapshot, or an edited body with the same known revision,
   // stays visible; it is never silently replaced by the recovery projection.
   const edited=matching&&comparable(matching.state)!==comparable(original);
   const preferOriginal=original&&(!latest||original.updated>latest.state.updated||edited&&original.updated>=latest.state.updated);
   const winner=preferOriginal?original:latest?.state||original;
   const chosen=preferOriginal?matching:latest;const others=all.filter(r=>(r.kind==='conflict'||heads.includes(r))&&r.id!==chosen?.id&&!chosen?.lineage.includes(r.id)&&!(chosen&&r.lineage.includes(chosen.id)));if(winner)result.units[id]=reconcile(winner,others);
   const selected=!preferOriginal&&latest?latest:null;
   meta.set(id,{revision:selected?.id||(!edited&&matching?.id)||null,lineage:selected?[selected.id,...selected.lineage].slice(0,128):matching&&!edited?[matching.id,...matching.lineage].slice(0,128):[],clock:Math.max(0,...all.map(r=>r.clock)),heads:heads.map(r=>r.id),alternatives:all.filter(r=>r.kind==='conflict'||heads.includes(r)&&r.id!==selected?.id&&r.id!==(!edited&&matching?.id)).sort(order)});
  }
  metadata=meta;
  if(records.length)result.recovery=records;
  return result;
 }
 function read(){
  if(blocked)return memory;
  let recoveredBase=memory,recoveredRecords=null;
  try{
   const raw=localStorage.getItem(KEY),base=raw?validate(JSON.parse(raw),allowed):{version:1,units:{}};
   const records=new Map((base.recovery||[]).map(r=>[r.id,r]));recoveredBase=base;recoveredRecords=records;
   if(supportsJournal()){
    const keys=[];for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key?.startsWith(RECOVERY))keys.push(key);}
    if(keys.length>2048)throw Error('Recovery limit');
    for(const key of keys){const raw=localStorage.getItem(key);if(!raw||raw.length>8e6)throw Error('Recovery size');const record=recoveryRecord(JSON.parse(raw),allowed);if(!record){const candidate=JSON.parse(raw);if(plain(candidate)&&typeof candidate.unit==='string'&&!allowed.includes(candidate.unit))continue;throw Error('Recovery record');}if(key!==RECOVERY+record.id)throw Error('Recovery identity');records.set(record.id,record);}
   }
   journal=records;memory=mergeRecords(base,[...records.values()]);return memory;
  }catch(e){if(recoveredRecords){journal=recoveredRecords;memory=mergeRecords(recoveredBase,[...journal.values()]);}blocked=true;warn('Сохранение в браузере недоступно или повреждено. Прежние записи не заменяются; прогресс этой вкладки можно скачать файлом.');return memory;}
 }
 const currentFingerprint=id=>fingerprint(memory.units[id])+':'+(metadata.get(id)?.heads||[]).slice().sort().join(',')+':'+(metadata.get(id)?.alternatives||[]).map(r=>r.id).sort().join(',');
 function remember(id){expected.set(id,currentFingerprint(id));expectedValue.set(id,clean(memory.units[id]));expectedMeta.set(id,metadata.get(id)||{revision:null,lineage:[],clock:0,heads:[],alternatives:[]});}
 memory=read();for(const id of allowed)remember(id);
 function writeSnapshot(message){if(blocked)return;try{localStorage.setItem(KEY,JSON.stringify({version:1,units:memory.units}));}catch(e){blocked=true;warn(message);}}
 function append(record){
  const previous=journal.get(record.id),collision=previous&&fingerprint(previous)!==fingerprint(record),overLimit=!previous&&journal.size>=2048;
  if(collision||overLimit){blocked=true;warn(collision?'Найдены разные записи с одним идентификатором. Исходная версия сохранена; текущую работу можно скачать.':'Журнал восстановления заполнен. Прежние версии сохранены; последняя работа остаётся в этой вкладке и доступна для скачивания.');return false;}
  if(blocked){journal.set(record.id,record);memory=mergeRecords(memory,[...journal.values()]);return false;}
  try{
   if(!supportsJournal())return false;
   const key=RECOVERY+record.id,text=JSON.stringify(record),existing=localStorage.getItem(key);
   if(existing!==null&&existing!==text)throw Error('Recovery collision');
   journal.set(record.id,record);localStorage.setItem(key,text);if(localStorage.getItem(key)!==text)throw Error('Recovery write');return true;
  }catch(e){blocked=true;memory=mergeRecords(memory,[...journal.values()]);warn('Новая работа остаётся в этой вкладке. Скачайте прогресс: журнал восстановления не удалось сохранить.');return false;}
 }
 function makeRecord(id,value,kind,meta){
  const revision=uuid(),state=clean(value);state.workRevision=revision;
  return {version:1,id:revision,unit:id,kind,parent:meta.revision||null,lineage:(meta.lineage||[]).slice(0,128),clock:Math.max(meta.clock||0,metadata.get(id)?.clock||0)+1,state};
 }
 function compact(record){
  if(blocked||!supportsJournal())return;
  // Only a persisted descendant can replace its own recovery ancestors. A
  // sibling/fork is never removed. Old storage keys are never cleared.
  try{const siblings=new Map();for(const entry of journal.values()){const key=entry.unit+':'+entry.parent;siblings.set(key,(siblings.get(key)||0)+1);}for(const ancestor of record.lineage){const old=journal.get(ancestor);if(old?.unit===record.unit&&(siblings.get(old.unit+':'+old.parent)||0)<2){localStorage.removeItem(RECOVERY+ancestor);journal.delete(ancestor);}}}catch(e){warn('Резервные записи сохранены; старые копии журнала очистить не удалось.');}
 }
 function recoveries(id){read();return (metadata.get(id)?.alternatives||[]).map(r=>({id:r.id,state:clean(r.state)}));}
 const workFingerprint=v=>{const value=clean(v);if(!value)return '';delete value.updated;delete value.events;delete value.workRevision;return fingerprint(value);};
 function preserve(id,value){
  if(!allowed.includes(id)||workFingerprint(value)===workFingerprint(expectedValue.get(id)))return;
  read();if([...journal.values()].some(r=>r.unit===id&&r.kind==='conflict'&&workFingerprint(r.state)===workFingerprint(value)))return;
  const c=clean(value);if(!c)return;c.updated=Math.max(Date.now(),c.updated);
  append(makeRecord(id,c,'conflict',expectedMeta.get(id)||{revision:null,lineage:[],clock:0}));read();writeSnapshot('Скачайте обе версии работы.');
 }

 return {
  get(id){
   const value=read().units[id];remember(id);
   const restored=clean(value);if(restored&&restored.routeVersion!==2&&!hasWork(restored)){restored.routeVersion=2;restored.screen='research';}
   return restored||clean({seed:1,attemptSchema:2,contentVersion:currentVersion(id),routeVersion:2,screen:'research'});
  },
  all(){return read();},recoveries,preserve,
  isCurrent(id){read();return currentFingerprint(id)===(expected.get(id)||fingerprint(null)+':'+':');},
  put(id,v,event){
   if(!allowed.includes(id))return false;
   const d=read(),c=clean(v);if(!c)return false;
   const before=metadata.get(id)||{revision:null,lineage:[],clock:0,heads:[],alternatives:[]},editing=expectedMeta.get(id)||before;
   c.updated=Math.max(Date.now(),(d.units[id]?.updated||0)+1);
   const stale=currentFingerprint(id)!==(expected.get(id)||fingerprint(null)+':'+':');
   if(stale){append(makeRecord(id,c,'conflict',editing));read();writeSnapshot('Скачайте обе версии работы.');warn('В другом окне сохранена новая работа. Записи этой вкладки сохранены отдельно; открой свежую работу или скачай обе версии.');return false;}
   const seen=new Set();c.events=[...(d.units[id]?.events||[]),...c.events].filter(e=>{const k=e.time+':'+e.type;if(seen.has(k))return false;seen.add(k);return true;});
   if(event)c.events.push({type:event,time:c.updated});c.events=c.events.slice(-300);
   const record=makeRecord(id,migrateUnit(id,c),'snapshot',editing),recordSaved=append(record);
   if(recordSaved){
    read();writeSnapshot('В браузере не удалось сохранить изменения. Скачайте файл прогресса.');
    // Read-repair the compatible snapshot after a racing renderer. Recovery
    // records, not this replaceable aggregate, are the authority for the race.
    read();writeSnapshot('В браузере не удалось сохранить изменения. Скачайте файл прогресса.');
    const after=metadata.get(id),known=new Set([...(before.heads||[]),record.id]);
    const raced=memory.units[id]?.workRevision!==record.id||(after?.heads||[]).some(head=>!known.has(head));
    if(raced){warn('Одновременно сохранены разные версии темы. Обе записи сохранены; открой свежую или скачай другую версию.');return false;}
    compact(record);read();remember(id);
   }else{
    // Old test adapters and an unavailable Storage API retain the original
    // in-memory/export behavior. Browser Storage always has key()/removeItem().
    memory.units[id]=record.state;writeSnapshot('В браузере не удалось сохранить изменения. Скачайте файл прогресса.');remember(id);
   }
   try{const raw=localStorage.getItem(LEGACY),old=raw?JSON.parse(raw):{};if(plain(old)){const k='merzlyak-'+id,p=plain(old[k])?old[k]:{};old[k]={...p,runs:Math.max(num(p.runs,1e6),c.attempts),best:Math.max(num(p.best,100),c.independent?100:0),passed:!!c.independent,events:c.events};localStorage.setItem(LEGACY,JSON.stringify(old));}}
   catch(e){warn('Новая запись доступна в курсе; общий старый журнал обновить не удалось.');}
   return true;
  },
  import(data){
   const incoming=validate(data,allowed);read();const union=new Set([...journal.keys(),...(incoming.recovery||[]).map(r=>r.id)]);if(union.size>2048)throw Error('В журнале недостаточно места для всех импортируемых версий. Импорт не выполнен; сохраните этот файл отдельно.');for(const record of incoming.recovery||[]){const prior=journal.get(record.id);if(prior&&fingerprint(prior)!==fingerprint(record))throw Error('Разные версии записи восстановления имеют один идентификатор. Импорт не выполнен.');}
   for(const record of incoming.recovery||[])append(record);
   read();
   for(const [id,v] of Object.entries(incoming.units)){
    const existing=memory.units[id],isOldContent=currentVersion(id)>1&&num(data.units[id]?.contentVersion,99)<currentVersion(id);
    let candidate=null;
    if(existing&&isOldContent&&hasWork(existing)){
     if(v.previousContent&&(!existing.previousContent||v.previousContent.updated>existing.previousContent.updated))candidate={...existing,previousContent:v.previousContent};
    }else if(!existing||v.updated>existing.updated)candidate=v;
    if(candidate){const record=makeRecord(id,candidate,'snapshot',metadata.get(id)||{revision:null,lineage:[],clock:0});if(!append(record)){memory.units[id]=record.state;writeSnapshot('Импортированное сохранено в этой вкладке; скачайте резервную копию.');}else{read();compact(record);}}
   }
   if(!blocked)read();writeSnapshot('Импортированное сохранено в этой вкладке; скачайте резервную копию.');
   return Object.keys(incoming.units).length;
  },
  export(){read();return {...memory,...(journal.size?{recovery:[...journal.values()]}:{})};}
 };
}
function download(data,name){const b=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(b),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
// Errors and assistance are independent. Legacy checked attempts have no reliable
// per-attempt outcome; preserve their totals and require a fresh task for new credit.
function recordAnswer(state,correct){
 const first=!state.checked,alreadySolved=state.solved;
 state.checked=true;if(first)state.attempts++;
 state.tries=(state.tries||0)+1;
 state.lastCheck=correct?'correct':'wrong';state.lastCheckMode='independent';
 if(!correct){state.mistakes=(state.mistakes||0)+1;return 'wrong';}
 if(alreadySolved)return state.result||'legacy';
 // Retain the successful response even if the pupil later edits this variant.
 // Already-solved legacy attempts have no known original response to infer.
 state.solvedDraft=str(state.draft,300);state.solved=true;
 if(state.repeatedTask)state.result='repeated';
 else if(state.attemptSchema!==2)state.result='legacy';
 else if(state.assisted){state.result='helped';state.assistedSolved++;}
 else if(state.tries===1){state.result='first';state.independent++;}
 else{state.result='corrected';state.selfCorrected++;}
 return state.result;
}
// A bounded search proves only that this batch contains no unseen condition.
// Keep the live attempt untouched when that happens, including its assistance.
function findFreshTask(make,fingerprint,seen,start,limit=1024){
 const known=new Set(seen);
 for(let offset=1;offset<=limit;offset++){
  const seed=(start+offset)%100000001,t=make(seed),key=fingerprint(t);
  if(!known.has(key))return {seed,task:t,key};
 }
 return null;
}
function archiveAttempt(state,t,key){
 if(!(state.draft||state.checked||state.assisted||state.taskStep||state.helpRevealed))return;
 state.recentAttempts=[...(state.recentAttempts||[]),attempt({...state,taskKey:key,question:t.question,time:Date.now()})].slice(-20);
}
function hasWork(v){return !!v&&(!!v.research?.firstPrediction||!!v.research?.predictionDraft||!!v.research?.observationDraft||v.research?.observations?.length>0||v.stage>0||!!v.draft?.trim()||!!v.guidedDraft?.trim()||v.helpRevealed>0||v.recentAttempts?.length>0||!!v.diagnosis?.trim()||!!v.written?.trim()||!!v.observation?.trim()||v.moved||v.construction||v.guided||v.proof||v.attempts>0||v.independent>0||v.selfCorrected>0);}
function progress(v){
 return {started:hasWork(v),independent:(v?.independent||0)+(v?.selfCorrected||0),first:v?.independent||0,corrected:v?.selfCorrected||0,helped:v?.assistedSolved||0,investigated:!!(v?.research?.completed||v?.moved&&v?.observation?.trim()),guided:!!v?.guided,proofWithSupport:!!v?.proof,written:!!v?.written?.trim(),complete:!!v?.complete};
}
const api={open,clean,validate,drawing,research,download,recordAnswer,findFreshTask,archiveAttempt,hasWork,progress,currentVersion,KEY,RECOVERY};root.GeoStore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
