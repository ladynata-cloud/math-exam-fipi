'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..'),KEY='mathexam.ege-baza.path.v1',PREFIX=KEY+'.h03.';
const tick=()=>new Promise(resolve=>setTimeout(resolve,5));
let checks=0;
function harness(initial){
 const bytes=new Map(initial?[[KEY,JSON.stringify(initial)]]:[]),windows=[],errors=[],downloads=[];
 let beforeWrite=null,denyReads=false,denyWrites=false;
 function create(hash='lesson=round',options={}){
  const vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error.message));
  const dom=new JSDOM(fs.readFileSync(path.join(root,'ege-baza/path/index.html'),'utf8'),{
   url:'https://course.test/ege-baza/path/index.html#'+hash,runScripts:'outside-only',virtualConsole:vc});
  const w=dom.window;w.structuredClone=structuredClone;w.matchMedia=()=>({matches:true});
  const NativeBlob=w.Blob;w.Blob=class extends NativeBlob{constructor(parts,options){super(parts,options);this.textValue=parts.join('');}};
  w.URL.createObjectURL=blob=>{downloads.push(JSON.parse(blob.textValue));return 'blob:test';};w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=()=>{};
  const storage={get length(){if(denyReads)throw Error('denied');return bytes.size;},
   key(i){if(denyReads)throw Error('denied');return [...bytes.keys()][i]??null;},
   getItem(key){if(denyReads)throw Error('denied');return bytes.get(key)??null;},
   setItem(key,value){if(denyWrites===true||typeof denyWrites==='function'&&denyWrites(key))throw Error('quota');if(beforeWrite)beforeWrite(w,key,String(value));bytes.set(key,String(value));},
   removeItem(key){bytes.delete(key);}};
  Object.defineProperty(w,'localStorage',options.getterDenied?{get(){throw Error('denied getter');}}:{value:storage});
  windows.push(w);
  for(const script of w.document.querySelectorAll('script[src]'))w.eval(fs.readFileSync(path.join(root,new URL(script.src).pathname),'utf8'));
  return w;
 }
 const read=()=>JSON.parse(bytes.get(KEY));
 const dispatch=(w,key=KEY)=>w.dispatchEvent(new w.StorageEvent('storage',{key,newValue:bytes.get(key)||null,url:'https://course.test/ege-baza/path/'}));
 const close=()=>{for(const w of windows)w.close();assert.deepEqual(errors,[]);};
 return {create,read,bytes,dispatch,close,errors,downloads,setHook:fn=>beforeWrite=fn,denyRead:value=>denyReads=value!==false,denyWrite:value=>denyWrites=value===undefined?true:value};
}
function input(w,selector,value){const field=w.document.querySelector(selector);assert(field,selector);field.value=String(value);field.dispatchEvent(new w.Event('input',{bubbles:true}));}
function submit(w,value,prefix='answer'){input(w,'#'+prefix,value);w.document.querySelector('#'+prefix+'Form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));}
const answer=w=>{const l=w.PathCourse.state().lessons.round;return w.PathData.task('round',l.seed).answer;};
const saved=h=>h.read().lessons.round;
const ok=(value,message)=>{assert.ok(value,message);checks++;};
const navigate=async(w,hash)=>{w.location.hash=hash;await tick();};
const importCopy=async(w,value)=>{await navigate(w,'report');await w.document.querySelector('#import').onchange({target:{files:[{size:JSON.stringify(value).length,text:async()=>JSON.stringify(value)}]}});};
(async()=>{
 for(const mode of ['wrong','help']){
  const h=harness(),a=h.create(),b=h.create();
  if(mode==='wrong')submit(a,-99);else{a.document.querySelector('#taskHelp').open=true;await tick();}
  submit(b,answer(b));a.dispatchEvent(new a.Event('pagehide'));
  ok(saved(h).done&&saved(h).checks.length===1,mode+' preceding success survives stale pagehide');
  ok(saved(h).independent===0&&saved(h).checks[0].independent===false,mode+' before answer is not independent');
  ok(saved(h).help,mode+' help remains');h.close();
 }
 {
  const h=harness(),a=h.create(),b=h.create();submit(a,answer(a));
  b.document.querySelector('#taskHelp').open=true;await tick();
  a.dispatchEvent(new a.Event('pagehide'));ok(saved(h).independent===1,'later help preserves independently earned answer');
  ok(saved(h).help&&saved(h).checks.length===1,'later help retained without duplicate success');h.close();
 }
 {
  const h=harness(),a=h.create(),b=h.create();let entered=false;
  h.setHook((w,key)=>{if(w===a&&key.startsWith(PREFIX)&&!entered){entered=true;h.setHook(null);submit(b,answer(b));}});
  submit(a,answer(a));a.dispatchEvent(new a.Event('pagehide'));h.dispatch(b);
  ok(entered&&saved(h).independent===1&&saved(h).checks.length===1,'overlapping same-condition saves retain one success');
  ok([...h.bytes.keys()].filter(key=>key.startsWith(PREFIX)).length>=2,'documents retain separate recovery records');h.close();
 }
 {
  const h=harness(),a=h.create(),b=h.create();let entered=false;
  input(a,'#answer',answer(a));
  h.setHook((w,key)=>{if(w===a&&key.startsWith(PREFIX)&&!entered){entered=true;h.setHook(null);submit(b,-99);}});
  a.document.querySelector('#answerForm').dispatchEvent(new a.Event('submit',{bubbles:true,cancelable:true}));
  ok(saved(h).done&&saved(h).independent===0,'unknown/concurrent help cannot promote independence');
  ok(!a.document.querySelector('#feedback').textContent.includes('с первой'),'feedback follows reconciled evidence');h.close();
 }
 {
  const h=harness(),a=h.create(),old=h.read();submit(a,answer(a));old.lessons.round.draft='old-client draft';old.lessons.round.taskFirst.finalDraft='old-client draft';h.bytes.set(KEY,JSON.stringify(old));h.dispatch(a);
  ok(saved(h).done&&saved(h).independent===1,'old-client v1 overwrite repaired from retained evidence');
  ok(a.document.querySelector('#downloadRecovery'),'older copy can be exported');
  const c=h.create();ok(c.PathCourse.state().lessons.round.done,'reopen retains recovered success');h.close();
 }
 {
  const h=harness(),a=h.create(),b=h.create();input(a,'#answer','7/');input(b,'#answer','8/');h.dispatch(a);
  const values=a.PathCourse.state().recoveryDrafts.filter(value=>value.field==='taskFirst.finalDraft').map(value=>value.value);
  ok(values.includes('7/')&&values.includes('8/'),'both conflicting final drafts retained');
  ok(a.document.querySelector('#answer').value==='7/','active local field not replaced');h.close();
 }
 {
  const h=harness(),a=h.create();input(a,'#answer','7/');a.close();const b=h.create();input(b,'#answer','7/2');
  ok(!b.document.querySelector('#pathRecovery'),'ordinary edit after reload has no false conflict');h.close();
 }
 {
  const h=harness(),a=h.create('exam');a.document.querySelector('#start').click();const before=h.read().active;
  input(a,'#answer','3');a.document.querySelector('#answerForm').dispatchEvent(new a.Event('submit',{bubbles:true,cancelable:true}));
  ok(h.read().active.i===1&&h.read().active.answers.length===1,'ordinary exam answer remains attached to active session');
  const b=h.create('exam'),stale=h.create('exam');input(b,'#answer','4');b.document.querySelector('#answerForm').dispatchEvent(new b.Event('submit',{bubbles:true,cancelable:true}));
  h.dispatch(stale);input(stale,'#answer','99');stale.document.querySelector('#answerForm').dispatchEvent(new stale.Event('submit',{bubbles:true,cancelable:true}));
  ok(h.read().active.i===2&&h.read().active.answers.length===2,'old displayed question cannot answer next exam item');
  ok(h.read().examDrafts.some(row=>row.value==='99'),'stale exam draft remains recoverable');
  b.document.querySelector('#finish').click();a.dispatchEvent(new a.Event('pagehide'));
  ok(h.read().active===null&&h.read().runs.some(run=>run.start===before.start),'finished run not resurrected by stale pagehide');h.close();
 }

 {
  const h=harness(),a=h.create(),before=h.read();submit(a,answer(a));
  delete before.progressStore;before.lessons.round.draft='OLD EXCLUSIVE';before.lessons.round.taskFirst.finalDraft='OLD EXCLUSIVE';
  h.bytes.set(KEY,JSON.stringify(before));h.dispatch(a);a.close();const b=h.create();
  ok(b.PathCourse.state().lessons.round.independent===1,'old page without metadata cannot erase confirmed credit');
  ok([...h.bytes.entries()].some(([key,value])=>key.startsWith(KEY+'.h03-copy.')&&value.includes('OLD EXCLUSIVE')),'old exclusive draft retained durably before repair');
  b.document.querySelector('#downloadRecovery').click();ok(h.downloads.at(-1).olderPages.some(copy=>copy.text.includes('OLD EXCLUSIVE')),'older copy remains downloadable after both original documents close');h.close();
 }
 {
  const h=harness(),a=h.create(),before=h.read();submit(a,answer(a));delete before.progressStore;before.lessons.round.draft='KEEP RAW';
  const raw=JSON.stringify(before);h.bytes.set(KEY,raw);h.denyWrite(key=>key.startsWith(KEY+'.h03-copy.'));h.dispatch(a);
  ok(h.bytes.get(KEY)===raw,'failure retaining older copy must not overwrite its raw bytes');
  ok(!a.document.querySelector('#storage').hidden&&a.document.querySelector('#downloadRecovery'),'failed retention has truthful safe download');h.close();
 }
 {
  const h=harness(),a=h.create(),b=h.create();a.document.querySelector('#new').click();input(a,'#answer','CONDITION_A');b.document.querySelector('#new').click();input(b,'#answer','CONDITION_B');
  const c=h.create(),all=JSON.stringify(c.PathCourse.state());ok(all.includes('CONDITION_A')&&all.includes('CONDITION_B'),'both distinct unfinished conditions survive reopen');
  ok(c.document.querySelector('#pathRecovery'),'nonselected condition is accessible');await navigate(c,'report');c.document.querySelector('#export').click();const exported=h.downloads.at(-1);
  const other=harness(),d=other.create();await importCopy(d,exported);
  ok(JSON.stringify(d.PathCourse.state()).includes('CONDITION_A')&&JSON.stringify(d.PathCourse.state()).includes('CONDITION_B'),'ordinary backup/restore preserves recovery-only drafts');
  const e=other.create();ok(JSON.stringify(e.PathCourse.state()).includes('CONDITION_A')&&JSON.stringify(e.PathCourse.state()).includes('CONDITION_B'),'imported alternative drafts remain after reload');other.close();h.close();
 }
 {
  const h=harness(),a=h.create(),b=h.create();a.document.querySelector('#startSteps').click();b.document.querySelector('#startSteps').click();await tick();
  const first=a.PathData.task('round',a.PathCourse.state().lessons.round.seed).steps[0].a;submit(a,first,'stepAnswer');input(a,'#stepAnswer','CURRENT STEP');h.dispatch(b);
  input(b,'#stepAnswer','OLD STEP');const c=h.create();
  ok(c.PathCourse.state().lessons.round.step===1&&c.document.querySelector('#stepAnswer').value==='CURRENT STEP','stale displayed step cannot retarget its draft to the next step');
  ok(c.PathCourse.state().recoveryDrafts.some(row=>row.field==='pastStepDraft'&&row.step===0&&row.value==='OLD STEP'),'old step draft keeps its step identity');
  ok(c.PathCourse.state().lessons.round.taskFirst.stepAnswers.length===1,'confirmed step history retained');h.close();
 }
 {
  const h=harness(),a=h.create('lesson=equations-linear'),b=h.create('lesson=units');
  input(a,'#answer','equation draft');input(a,'#note','equation note');a.document.querySelector('#taskHelp').open=true;a.document.querySelector('#taskModel').open=true;await tick();
  input(a,'#divisor','7');input(b,'#answer','units draft');const model=JSON.stringify(a.PathCourse.state().lessons['equations-linear'].taskFirst.model);
  const grade=h.create('lesson=grade7-b-decimal-place-align');grade.document.querySelector('[data-stage="3"]').click();input(grade,'#answer','grade draft');
  grade.document.querySelector('[data-stage="4"]').click();input(grade,'#note','grade note');
  const pre=h.create('lesson=pre7-place-value');pre.document.querySelector('[data-stage="3"]').click();input(pre,'#answer','pre7 draft');
  a.dispatchEvent(new a.Event('pagehide'));b.dispatchEvent(new b.Event('pagehide'));
  const c=h.create('lesson=equations-linear'),state=c.PathCourse.state();
  ok(state.lessons.units.draft==='units draft','different lesson draft survives other-tab close');
  ok(state.lessons['grade7-b-decimal-place-align'].draft==='grade draft'&&state.lessons['grade7-b-decimal-place-align'].note==='grade note','grade7 shared row retains work');
  ok(state.lessons['pre7-place-value'].draft==='pre7 draft','pre7 shared row retains work');
  ok(state.lessons['equations-linear'].note==='equation note'&&JSON.stringify(state.lessons['equations-linear'].taskFirst.model)===model,'note and model position survive sibling updates');h.close();
 }
 {
  const h=harness(),a=h.create('exam');a.document.querySelector('#start').click();const b=h.create('exam');input(a,'#answer','3');let overlap=false;
  h.setHook((w,key)=>{if(w===a&&key.startsWith(PREFIX)&&!overlap){overlap=true;h.setHook(null);b.location.hash='lesson=round';b.dispatchEvent(new b.HashChangeEvent('hashchange'));}});
  a.document.querySelector('#answerForm').dispatchEvent(new a.Event('submit',{bubbles:true,cancelable:true}));
  ok(overlap&&h.read().active.i===1&&h.read().active.assisted,'overlapping exam answer and help retain both');
  a.document.querySelector('#finish').click();ok(h.read().runs.at(-1).assisted,'finished exam keeps concurrent assistance');await tick();h.close();
 }
 {
  const h=harness(),a=h.create('diagnostic');a.document.querySelector('#start').click();const old=h.create();input(a,'#answer','5');a.document.querySelector('#answerForm').dispatchEvent(new a.Event('submit',{bubbles:true,cancelable:true}));old.dispatchEvent(new old.Event('pagehide'));
  ok(h.read().active.kind==='diagnostic'&&h.read().active.i===1,'new diagnostic answers survive stale learning pagehide');h.close();
 }
 {
  const h=harness(),a=h.create(),b=h.create();input(a,'#answer','BEFORE IMPORT');const replacement=structuredClone(h.read());delete replacement.progressStore;replacement.lessons.round.seed=23;replacement.lessons.round.taskFirst.seed=23;replacement.lessons.round.draft='IMPORTED';replacement.lessons.round.taskFirst.finalDraft='IMPORTED';
  await importCopy(a,replacement);b.dispatchEvent(new b.Event('pagehide'));
  ok(h.read().lessons.round.seed===23&&h.read().lessons.round.draft==='IMPORTED','import intentionally replaces current work and stale page cannot undo it');
  ok(!b.document.querySelector('#storage').hidden,'old generation stops with clear recovery action');const c=h.create();ok(c.document.querySelector('#answer').value==='IMPORTED','import resumes exact chosen draft');h.close();
 }
 {
  const h=harness(),a=h.create();const replacement=structuredClone(h.read());delete replacement.progressStore;replacement.lessons.round.seed=23;replacement.lessons.round.taskFirst.seed=23;replacement.lessons.round.draft='PARTIAL IMPORT';replacement.lessons.round.taskFirst.finalDraft='PARTIAL IMPORT';
  h.denyWrite(key=>key===KEY);await importCopy(a,replacement);
  ok(!a.document.querySelector('#feedback').textContent.includes('не изменена'),'committed import with projection quota does not claim unchanged');
  ok(a.PathCourse.state().lessons.round.seed===23&&a.document.querySelector('#downloadRecovery'),'committed imported copy remains available for export');h.denyWrite(false);
  const b=h.create();ok(b.PathCourse.state().lessons.round.seed===23,'reopen restores durably committed import after projection failure');h.close();
 }
 {
  const h=harness(),a=h.create('lesson=practice-mushroom-count');input(a,'#answer','21 draft');a.close();const b=h.create('lesson=practice-mushroom-count');
  ok(b.document.querySelector('#answer').value==='21 draft','packed task21Practice draft loads');
  ok(b.document.querySelector('#storage').hidden&&!b.document.querySelector('#pathRecovery'),'packed task21 own projection does not trigger old-client warning');h.close();
 }
 for(const kind of ['corrupt','future','future-metadata','denied','getter','quota','corrupt-recovery','bad-drafts','bad-exam-drafts']){
  const h=harness();
  if(kind==='corrupt')h.bytes.set(KEY,'{broken');
  if(kind==='future')h.bytes.set(KEY,JSON.stringify({version:999,keep:'FUTURE WORK'}));
  if(kind==='future-metadata'){const seed=h.create();const value=h.read();value.progressStore.version=999;h.bytes.set(KEY,JSON.stringify(value));seed.close();}
  if(kind==='corrupt-recovery')h.bytes.set(PREFIX+'broken','{broken');
  if(['bad-drafts','bad-exam-drafts'].includes(kind))h.bytes.set(KEY,JSON.stringify({version:1,serial:11,lessons:{},seen:{},runs:[],active:null,[kind==='bad-drafts'?'recoveryDrafts':'examDrafts']:[null]}));
  if(kind==='denied')h.denyRead();if(kind==='quota')h.denyWrite();
  const before=[...h.bytes],a=h.create('lesson=round',{getterDenied:kind==='getter'});input(a,'#answer','UNSAVED DRAFT');a.dispatchEvent(new a.Event('pagehide'));
  ok(!a.document.querySelector('#storage').hidden&&!!a.document.querySelector('#downloadRecovery'),kind+' exposes safe download');
  ok(JSON.stringify([...h.bytes])===JSON.stringify(before),kind+' does not silently reset stored history');
  a.document.querySelector('#downloadRecovery').click();ok(JSON.stringify(h.downloads.at(-1)).includes('UNSAVED DRAFT'),kind+' export retains current local work');h.close();
 }
 {
  const h=harness(),a=h.create();input(a,'#answer','v1 rollback draft');const old=h.read();delete old.progressStore;old.lessons.round.independent=99;old.lessons.round.done=true;old.lessons.round.checks=[{seed:11,correct:true,independent:true}];h.bytes.set(KEY,JSON.stringify(old));a.close();
  // This is the home reader with the helper closed; it must not promote stale data.
  const {runInNewContext}=require('node:vm'),context={PathData:{meta:[],practice:{expandTask21Progress:value=>value}}};runInNewContext(fs.readFileSync(path.join(root,'ege-baza/course-journey.js'),'utf8'),context);
  const store={get length(){return h.bytes.size;},key:i=>[...h.bytes.keys()][i],getItem:key=>h.bytes.get(key)??null,setItem(){throw Error('read-only');}};
  const status=context.EgeBazaJourney.snapshot(store);ok(status.sources.path.status==='unreadable'&&status.recommendation.kind==='recovery','read-only map marks stale v1 unknown without repairing it');
  ok(h.read().lessons.round.independent===99,'read-only map has not mutated old page bytes');const b=h.create();ok(b.PathCourse.state().lessons.round.independent===0,'returning new page restores protected history without promoting unknown old credit');h.close();
 }

 {
  const old={version:1,serial:12,lessons:{round:{seed:11,stage:3,step:0,help:false,attempted:false,independent:2,guided:1,note:'old note',draft:'old draft',checks:[{seed:4,correct:true,independent:true}]}},seen:{},runs:[],active:null};
  const h=harness(old),a=h.create();input(a,'#answer','legacy edit');
  ok(a.document.querySelector('#storage').hidden&&!a.document.querySelector('#pathRecovery'),'ordinary migration from pre-H03 save has no false conflict warning');
  ok(a.PathCourse.state().lessons.round.independent===2&&a.PathCourse.state().lessons.round.note==='old note','legacy baseline counters and note preserved');h.close();
 }
 {
  const h=harness(),a=h.create(),b=h.create();input(a,'#answer',answer(a));
  // A second real persistence instance allows an import to commit inside A's
  // synchronous setItem seam; normal UI import uses this same replace method.
  const importer=b.PathProgressStore.create({valid:b.PathCourse.valid,decode:text=>b.PathData.practice.expandTask21Progress(JSON.parse(text)),encode:value=>b.PathData.practice.packTask21Progress(value),task:(id,seed)=>b.PathData.task(id,seed),condition:task=>task.q,empty:()=>({version:1,serial:11,lessons:{},seen:{},runs:[],active:null}),notice(){}});
  const replacement=structuredClone(h.read());delete replacement.progressStore;replacement.lessons.round.seed=23;replacement.lessons.round.taskFirst.seed=23;replacement.lessons.round.draft='RACING IMPORT';replacement.lessons.round.taskFirst.finalDraft='RACING IMPORT';let overlap=false;
  h.setHook((w,key)=>{if(w===a&&key.startsWith(PREFIX)&&!overlap){overlap=true;h.setHook(null);assert(importer.replace(replacement));}});
  a.document.querySelector('#answerForm').dispatchEvent(new a.Event('submit',{bubbles:true,cancelable:true}));
  ok(overlap&&h.read().lessons.round.seed===23,'import committing during an older save remains authoritative');
  ok(!a.document.querySelector('#storage').hidden&&a.document.querySelector('#downloadRecovery'),'post-write generation change stops old tab with recoverable own work');
  a.document.querySelector('#downloadRecovery').click();ok(h.downloads.at(-1).records.some(record=>record.generation==='initial'&&record.events.some(event=>event.type==='success')),'old generation success is retained separately for export');h.close();
 }
 {
  const h=harness(),a=h.create(),b=h.create();const importer=b.PathProgressStore.create({valid:b.PathCourse.valid,decode:text=>b.PathData.practice.expandTask21Progress(JSON.parse(text)),encode:value=>b.PathData.practice.packTask21Progress(value),task:(id,seed)=>b.PathData.task(id,seed),condition:task=>task.q,empty:()=>({version:1,serial:11,lessons:{},seen:{},runs:[],active:null}),notice(){}});
  const one=structuredClone(h.read()),two=structuredClone(one);delete one.progressStore;delete two.progressStore;
  one.lessons.round.draft=one.lessons.round.taskFirst.finalDraft='IMPORT ONE';two.lessons.round.draft=two.lessons.round.taskFirst.finalDraft='IMPORT TWO';let overlap=false;
  h.setHook((w,key,value)=>{if(w===a&&key.startsWith(PREFIX)&&!key.includes('before-import')&&JSON.parse(value).generation.includes(':import:')&&!overlap){overlap=true;h.setHook(null);assert(importer.replace(two));}});
  await importCopy(a,one);const c=h.create();
  ok(overlap&&!c.document.querySelector('#storage').hidden&&c.document.querySelector('#downloadRecovery'),'two concurrent imports stop explicitly instead of selecting an arbitrary copy');
  c.document.querySelector('#downloadRecovery').click();const exported=JSON.stringify(h.downloads.at(-1));ok(exported.includes('IMPORT ONE')&&exported.includes('IMPORT TWO'),'both committed imports remain downloadable');h.close();
 }

 for(const kind of ['old-help','old-error']){
  const h=harness(),a=h.create(),old=h.read();a.close();delete old.progressStore;
  old.lessons.round.help=true;if(kind==='old-error'){old.lessons.round.attempted=true;old.lessons.round.taskFirst.mistakes=1;}
  h.bytes.set(KEY,JSON.stringify(old));const b=h.create();submit(b,answer(b));
  ok(b.PathCourse.state().lessons.round.done&&b.PathCourse.state().lessons.round.independent===0,kind+' during old-only rollback prevents future independent credit');
  ok(!b.document.querySelector('#feedback').textContent.includes('с первой'),kind+' has truthful final feedback');h.close();
 }

 for(const kind of ['records','older-copies']){
  const h=harness(),a=h.create();a.close();const initial=h.bytes.get(KEY),record=JSON.parse([...h.bytes.entries()].find(([key])=>key.startsWith(PREFIX))[1]);
  if(kind==='records')for(let i=1;i<=256;i++){const copy=structuredClone(record);copy.writer=i.toString(16).padStart(32,'0');h.bytes.set(PREFIX+'capacity:'+i,JSON.stringify(copy));}
  else for(let i=0;i<257;i++)h.bytes.set(KEY+'.h03-copy.capacity:'+i,JSON.stringify({version:1,generation:'initial',text:initial}));
  const before=JSON.stringify([...h.bytes]),b=h.create();ok(!b.document.querySelector('#storage').hidden&&b.document.querySelector('#downloadRecovery'),kind+' capacity stops with recovery action');
  b.document.querySelector('#downloadRecovery').click();const exported=h.downloads.at(-1);
  ok((kind==='records'?exported.records:exported.olderPages).length===257,kind+' above-limit entries stay available in complete download');
  ok(JSON.stringify([...h.bytes])===before,kind+' safe capacity stop leaves every original byte unchanged');h.close();
 }
 console.log('EGE_BASE_CROSS_TAB_PROGRESS_DOM_OK: '+checks+' targeted assertions with actual page handlers, stale events, reentrant writes and recovery.');
})().catch(error=>{console.error(error);process.exitCode=1;});
