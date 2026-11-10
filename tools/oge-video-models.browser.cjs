'use strict';
// Real Chromium interactions against the nine public trainer entries. Every
// browser context uses disposable synthetic work; no user account is involved.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const {chromium} = require('playwright');
const {entries, assets, restoreVideoModels} = require('./oge-video-models-preservation.cjs');
const lessons = [...require('../trainers/oge-video-graphs.js'), ...require('../trainers/oge-video-geometry.js')];
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'artifacts/oge-video-models');
const PREFIX = 'mathExam.oge.videoModels.v1.';
const MIME = {'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml'};
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const report = {head:execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim(), sources:Object.fromEntries([...Object.values(entries),...assets].map(file=>[file,sha(fs.readFileSync(path.join(ROOT,file)))])),layouts:[],journeys:[],nativeReloads:[],isolation:[],failures:[]};
let server, browser, base = process.env.OGE_VIDEO_BASE_URL;
async function saveScreen(page,name){await page.screenshot({path:path.join(OUT,name+'.png'),fullPage:false,caret:'initial'});}
async function localState(page){return page.evaluate(prefix=>Object.fromEntries(Object.entries(localStorage).filter(([key])=>!key.startsWith(prefix)).sort(([a],[b])=>a.localeCompare(b))),PREFIX);}
async function nativeInputs(page){return page.evaluate(()=>Array.from(document.querySelectorAll('input,textarea,select')).filter(e=>!e.closest('#oge-video-models')).map(e=>({tag:e.tagName,id:e.id,name:e.name,type:e.type,value:e.value,checked:e.checked,disabled:e.disabled})));}
async function completedRecords(page){return page.evaluate(keys=>Object.fromEntries(keys.flatMap(key=>{const raw=localStorage.getItem(key);return raw?[[key,JSON.parse(raw).results]]:[];})),lessons.map(lesson=>PREFIX+lesson.id));}
const nativeReloadIds={16:'oge-task16-circle',17:'oge17-chetyrehugolniki',24:'oge24-dokazatelstva'};
async function restoresProofDraft(page,task){
 if(task!==24)return false;
 return page.evaluate(()=>{
  const draft=JSON.parse(localStorage.getItem('mathExamCourseProgress.v1')||'{}')['oge24-dokazatelstva']?.ext?.auditLearning?.draft;
  return typeof validProofDraft==='function'&&validProofDraft(draft);
 });
}
function assertNativeReload(before,after,task,started,finished,restorableProof=false){
 const id=nativeReloadIds[task],key='mathExamCourseProgress.v1';
 if(!id){assert.deepEqual(after,before,'native reload preserves all existing storage');return;}
 const old=JSON.parse(before[key]),next=JSON.parse(after[key]);
 if(restorableProof){
  assert.equal(task,24,'only the reviewed proof draft has this read-only restore contract');
  const audit=old[id]?.ext?.auditLearning,draft=audit?.draft;
  assert.equal(audit?.v,1);assert.equal(draft?.v,1);assert(Number.isSafeInteger(draft.revision)&&draft.revision>0);
  assert.equal(typeof draft.attemptId,'string');assert(draft.attemptId.length>0);assert(['study','train','recall','justify'].includes(draft.mode));
  // The page validated this draft before reload. A reload is not a new task:
  // preserve every byte, including the complete draft, legacy data and foreign keys.
  assert.deepEqual(after,before,'restoring a valid proof draft is entirely read-only');return;
 }
 assert.deepEqual({...after,[key]:before[key]},before,'reload changes no other native key');
 assert.deepEqual({...next,[id]:old[id]},old,'reload changes no other native trainer');
 const a=old[id],b=next[id],omit=record=>Object.fromEntries(Object.entries(record).filter(([field])=>!['events','updatedAt',...(task===17?['usedNums']:[])].includes(field)));
 assert.deepEqual(omit(b),omit(a),'reload preserves all scores, verdicts, drafts and stable fields');
 assert.deepEqual(b.events.slice(0,a.events.length),a.events,'all prior native events are retained exactly');
 const added=b.events.slice(a.events.length);
 assert.equal(added.length,task===16?2:1,'exact native boot event count');
 const event=(row,fields)=>{assert.deepEqual(Object.keys(row).sort(),fields.sort());assert(Number.isSafeInteger(row.t)&&row.t>=started&&row.t<=finished,'native event timestamp belongs to this reload');};
 if(task===16){event(added[0],['t','e']);assert.equal(added[0].e,'start');}
 const last=added.at(-1);assert.equal(last.e,'task_start');
 if(task===24){event(last,['t','e','task','mode']);assert.match(last.task,/^t\d+$/);assert.equal(last.mode,'train');}
 else {event(last,['t','e','kind','sub']);assert.equal(typeof last.sub,'string');assert(last.sub.length>0);assert((task===16?['gen','arch']:['train']).includes(last.kind));}
 assert(Number.isSafeInteger(b.updatedAt)&&b.updatedAt>=last.t&&b.updatedAt<=finished,'updatedAt records the native boot');
 if(task===17){
  const previous=a.usedNums||{},current=b.usedNums||{},addedIds=Object.keys(current).filter(k=>!Object.hasOwn(previous,k));
  assert.deepEqual(Object.fromEntries(Object.keys(previous).map(k=>[k,current[k]])),previous,'used native archive numbers cannot be forgotten or changed');
  assert.equal(addedIds.length,1,'the unchanged default trainer takes exactly one fresh archive problem');
  assert.equal(current[addedIds[0]],1);
 }
}
function nativeReloadNegativeControls(){
 for(const task of [16,17,24]){
  const key='mathExamCourseProgress.v1',id=nativeReloadIds[task];
  const old={untouched:{solved:7},[id]:{v:1,solvedByType:{prior:2},events:[{t:1,e:'prior'}],updatedAt:1,...(task===17?{usedNums:{old:1}}:{})}};
  const next=JSON.parse(JSON.stringify(old)),row=next[id];row.updatedAt=10;
  if(task===16)row.events.push({t:10,e:'start'});
  row.events.push(task===24?{t:10,e:'task_start',task:'t2',mode:'train'}:{t:10,e:'task_start',kind:task===16?'gen':'train',sub:'known'});
  if(task===17)row.usedNums.new=1;
  const before={[key]:JSON.stringify(old),sentinel:'retained'},after={[key]:JSON.stringify(next),sentinel:'retained'};
  assertNativeReload(before,after,task,9,11);
  for(const change of [x=>{x[id].solvedByType.prior=3;},x=>{x[id].events[0].e='changed';},x=>{x[id].events.push({t:10,e:'task_start'});},x=>{x[id].draft='injected';},x=>{delete x.untouched;}]){
   const broken=JSON.parse(JSON.stringify(next));change(broken);assert.throws(()=>assertNativeReload(before,{...after,[key]:JSON.stringify(broken)},task,9,11));
  }
  assert.throws(()=>assertNativeReload(before,{...after,sentinel:'lost'},task,9,11));
  assert.throws(()=>assertNativeReload(before,after,task,11,12));
  if(task===17){const broken=JSON.parse(JSON.stringify(next));delete broken[id].usedNums.old;assert.throws(()=>assertNativeReload(before,{...after,[key]:JSON.stringify(broken)},task,9,11));}
 }
 // A full synthetic t2 draft matches the newly reviewed restore mode. Its
 // no-write assertion is intentionally stricter than the legacy boot allowance.
 {
  const key='mathExamCourseProgress.v1',id=nativeReloadIds[24];
  const draft={v:1,revision:3,at:10,attemptId:'proof-native-reload-control',mode:'train',queue:['t2'],qi:0,
   order:[],dead:[],early:[],pool:[...Array.from({length:5},(_,i)=>({type:'s',i})),...Array.from({length:3},(_,i)=>({type:'x',i}))],phase:0,
   err:0,hints:0,glows:0,placedByHint:0,auditErrors:0,revealed:false,solvedNow:false,gaveUp:false,missed:false,helpUsed:false,hadError:false,
   lastActionAt:0,workStarted:false,noteEdited:false,fresh:true,historyKnown:true,startedAt:9,auditDone:false,pendingDependency:null,
   helpOpen:false,awaitJust:null,justOrder:[],justDead:[],results:[]};
  const data={untouched:{solved:7},[id]:{v:1,solvedByType:{prior:2},events:[{t:1,e:'prior'}],updatedAt:1,ext:{foreign:{keep:true},auditLearning:{v:1,attempts:[],byTask:{t2:{seenAt:9}},draft}}}};
  const before={[key]:JSON.stringify(data),sentinel:'retained'};assertNativeReload(before,{...before},24,10,12,true);
  for(const change of [x=>{x[id].solvedByType.prior++;},x=>{x[id].events[0].e='changed';},x=>{x[id].events.push({t:11,e:'task_start',task:'t2',mode:'train'});},x=>{x[id].updatedAt=11;},x=>{x[id].ext.auditLearning.draft.revision++;},x=>{x[id].ext.auditLearning.draft.helpUsed=true;},x=>{x[id].ext.auditLearning.attempts.push({id:'unearned'});},x=>{x[id].ext.foreign.keep=false;},x=>{delete x.untouched;}]){
   const changed=JSON.parse(JSON.stringify(data));change(changed);assert.throws(()=>assertNativeReload(before,{...before,[key]:JSON.stringify(changed)},24,10,12,true));
  }
  assert.throws(()=>assertNativeReload(before,{...before,sentinel:'lost'},24,10,12,true));
  assert.throws(()=>assertNativeReload(before,{...before},24,10,12,false),'a legacy boot cannot silently skip its expected event');
  assert.throws(()=>assertNativeReload(before,{...before},16,10,12,true),'other native trainers retain their legacy contracts');
 }
 assert.throws(()=>assertNativeReload({native:'prior'},{native:'changed'},11,9,11));
}
async function lessonState(page){
 const id=await page.locator('[data-ovm-lesson]').getAttribute('data-ovm-lesson');
 return page.evaluate(key=>({key,rev:JSON.parse(localStorage.getItem(key)||'{"rev":0}').rev}),PREFIX+id);
}
async function saved(page,before,expected={}){
 // Web Locks commits are asynchronous. A rendered answer is not evidence that
 // its draft or result is durable; wait for the exact next persisted state.
 await page.waitForFunction(({before,expected})=>{
  const raw=localStorage.getItem(before.key);if(!raw)return false;
  const state=JSON.parse(raw);
  const matches=(actual,wanted)=>Object.entries(wanted).every(([key,value])=>value&&typeof value==='object'?actual?.[key]&&matches(actual[key],value):actual?.[key]===value);
  return state.rev>before.rev&&matches(state,expected);
 },{before,expected},{timeout:10000});
}
async function durableView(page){
 const expected=await page.locator('[data-ovm-lesson]').evaluate(host=>{
  const answer=host.querySelector('[data-ovm-answer]'),proof=host.querySelector('[data-ovm-proof]');
  return {id:host.dataset.ovmLesson,stage:host.dataset.ovmStage,
   ...(answer?{answer:answer.value,checked:answer.disabled}:{}),...(proof?{proof:proof.value}:{}),
   params:Object.fromEntries(Array.from(host.querySelectorAll('input[type="number"][data-ovm-control]')).map(input=>[input.dataset.ovmControl,Number(input.value)]))};
 });
 await page.waitForFunction(({key,expected})=>{
  const raw=localStorage.getItem(key);if(!raw)return false;const state=JSON.parse(raw);
  return state.stage===expected.stage&&['answer','proof','checked'].every(k=>!(k in expected)||state[k]===expected[k])&&Object.entries(expected.params).every(([k,v])=>state.params[k]===v);
 },{key:PREFIX+expected.id,expected},{timeout:10000});
}
async function edit(page,locator,value,expected){
 const before=await lessonState(page);await locator.fill(String(value));await saved(page,before,expected);
}
async function context(width,managed=false){
 const c=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
 await c.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
 if(managed)await c.addInitScript(()=>{window.MathExamLearning={managed:true};});
 await c.addInitScript(()=>{if(!sessionStorage.getItem('video-model-synthetic')){localStorage.setItem('video-model-native-sentinel','unchanged');sessionStorage.setItem('video-model-synthetic','1');}});
 return c;
}
async function openLesson(page,lesson){
 const details=page.locator('#oge-video-models');
 if(await details.getAttribute('open')===null)await page.locator('[data-ovm-open]').click();
 await page.locator('[data-ovm-picker]').selectOption(lesson.id);
 await page.locator('[data-ovm-lesson="'+lesson.id+'"]').waitFor({state:'visible'});
 return details;
}
async function action(page,name,expected={}){const before=await lessonState(page);await page.locator('[data-ovm-action="'+name+'"]').click();await saved(page,before,expected);}
async function transition(page,name){await action(page,name,{stage:name});await page.locator('[data-ovm-stage="'+name+'"]').waitFor({state:'visible'});}
async function choose(page,name,index){const before=await lessonState(page);await page.locator('input[name="ovm-'+name+'"]').nth(index).check();await saved(page,before,{[name]:index});await action(page,'check-'+name,{[name]:index});}
async function answer(page,value,invalid=false){
 await edit(page,page.locator('[data-ovm-answer]'),value,{answer:String(value)});
 if(invalid){
  const before=await lessonState(page);await page.locator('[data-ovm-action="check-practice"]').click();
  await page.locator('[data-ovm-feedback]').filter({hasText:'ненулевым знаменателем'}).waitFor({state:'visible'});
  assert.deepEqual(await lessonState(page),before,'invalid syntax does not commit an assessed result');
 }else await action(page,'check-practice');
 await durableView(page);
}
async function withinViewport(page){
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no document horizontal overflow');
 const panel=page.locator('#oge-video-models');
 for(const control of await panel.locator('button:visible,summary:visible').all()){
  const box=await control.boundingBox();assert(box&&box.width>0&&box.height>=40,'usable visible lesson control');
 }
}
if(process.argv.includes('--selftest-native-reload')){nativeReloadNegativeControls();console.log('OGE_VIDEO_NATIVE_RELOAD_GUARD_OK');process.exit(0);}
fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 try{
  nativeReloadNegativeControls();
  if(!base){
   server=http.createServer((req,res)=>{try{
    let file=path.resolve(ROOT,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
    assert(file===ROOT||file.startsWith(ROOT+path.sep));
    if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
    res.setHeader('Content-Type',MIME[path.extname(file)]||'application/octet-stream');
    fs.createReadStream(file).pipe(res);
   }catch{res.writeHead(404).end();}});
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+server.address().port;
  }
  browser=await chromium.launch({headless:true,...(process.env.OGE_VIDEO_CHROMIUM?{executablePath:process.env.OGE_VIDEO_CHROMIUM}:{})});report.browser=browser.version();report.base=base;
  // Confirm the narrow boot allowance against the actual unchanged native HTML,
  // with only the exact optional include block removed in a disposable fixture.
  for(const task of [16,17,24]){
   const c=await context(360),p=await c.newPage(),file=entries[task];
   try{
    await c.route(base+'/'+file,async route=>{const response=await route.fetch();await route.fulfill({response,body:restoreVideoModels(file,await response.text())});});
    await p.goto(base+'/'+file,{waitUntil:'load'});assert.equal(await p.locator('#oge-video-models').count(),0);
    const before=await localState(p),restorable=await restoresProofDraft(p,task),started=await p.evaluate(()=>Date.now());await p.reload({waitUntil:'load'});
    assertNativeReload(before,await localState(p),task,started,await p.evaluate(()=>Date.now()),restorable);
    report.nativeReloads.push({number:task,mode:restorable?'restored-draft':'legacy-bootstrap',status:'PASS'});
   }catch(e){report.failures.push({kind:'native-reload-control',number:task,error:e.message});}
   finally{await c.close();}
  }
  for(const width of [320,360,1280]){
   // Every real entry boots with the investigation folded away. Merely opening
   // the page must not create a model attempt or change native data.
   for(const [number,file] of Object.entries(entries)){
    const c=await context(width),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
    try{
     await p.goto(base+'/'+file,{waitUntil:'load'});
     await p.locator('#oge-video-models').waitFor();
     assert.equal(await p.locator('#oge-video-models').getAttribute('open'),null);
     assert.equal(await p.evaluate(prefix=>Object.keys(localStorage).filter(key=>key.startsWith(prefix)).length,PREFIX),0);
     const available=lessons.filter(lesson=>lesson.tasks.includes(Number(number))).map(x=>x.id).sort();
     await p.locator('[data-ovm-open]').click();
     assert.deepEqual((await p.locator('[data-ovm-picker] option').evaluateAll(nodes=>nodes.map(e=>e.value))).sort(),available);
     await withinViewport(p);assert.deepEqual(errors,[]);
     report.layouts.push({number:Number(number),width,status:'PASS'});
    }catch(e){report.failures.push({kind:'entry',number,width,error:e.message});await saveScreen(p,'FAIL-entry-'+number+'-'+width);}
    finally{await c.close();}
   }
   for(const lesson of lessons){
    const c=await context(width),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
    try{
     await p.goto(base+'/'+entries[lesson.tasks[0]],{waitUntil:'load'});
     await p.locator('#oge-video-models').waitFor();
     let previousStorage=await localState(p),previousInputs=await nativeInputs(p);
     assert(await p.evaluate(()=>typeof navigator.locks?.request==='function'),'real browser supports durable cross-tab saving');
     const preserveNative=async()=>{await durableView(p);assert.deepEqual(await localState(p),previousStorage,'research must not alter native progress or drafts');assert.deepEqual(await nativeInputs(p),previousInputs,'research must not alter native form controls');};
     // Legacy trainers may generate on reload; a valid proof draft resumes read-only.
     // Compare each lesson segment against its actual native starting state.
     const reloadLesson=async()=>{
      await preserveNative();const restorable=await restoresProofDraft(p,lesson.tasks[0]),started=await p.evaluate(()=>Date.now());await p.reload({waitUntil:'load'});
      const after=await localState(p);assertNativeReload(previousStorage,after,lesson.tasks[0],started,await p.evaluate(()=>Date.now()),restorable);
      previousStorage=after;previousInputs=await nativeInputs(p);await openLesson(p,lesson);
     };
     await openLesson(p,lesson);
     await choose(p,'prediction',(lesson.predict.answer+1)%lesson.predict.choices.length);
     await choose(p,'prediction',lesson.predict.answer);
     await transition(p,'experiment');
     await p.locator('[data-ovm-stage="experiment"]').waitFor({state:'visible'});
     const scene=await p.locator('[data-ovm-scene]').innerHTML();
     const control=lesson.controls[0];
     const target=control.value===control.max?control.min:control.max;
     const number=p.locator('input[type="number"][data-ovm-control="'+control.key+'"]');
     await edit(p,number,target,{params:{[control.key]:target}});await number.press('Tab');
     assert.notEqual(await p.locator('[data-ovm-scene]').innerHTML(),scene,'real control changes the mathematical scene');
     assert.equal(await p.locator('input[type="range"][data-ovm-control="'+control.key+'"]').inputValue(),String(target));
     await withinViewport(p);await saveScreen(p,lesson.id+'-experiment-'+width);
     const changedScene=await p.locator('[data-ovm-scene]').innerHTML();
     await reloadLesson();
     assert.equal(await p.locator('[data-ovm-scene]').innerHTML(),changedScene,'exact model state survives reload');
     // The scene is exploratory. A distinct explanation question and changed
     // conditions, not the already displayed values, assess transfer.
     await transition(p,'reason');
     await choose(p,'reason',lesson.reason.answer);
     await transition(p,'practice');
     await p.locator('[data-ovm-stage="practice"]').waitFor({state:'visible'});
     await answer(p,'1/0',true);assert(!/самостоятельно|с помощью|после исправления/i.test(await p.locator('[data-ovm-result]').innerText()),'invalid fraction earns no result');
     await answer(p,Number(lesson.practices[0].answer)+1000);
     await reloadLesson();
     assert.equal(await p.locator('[data-ovm-answer]').inputValue(),String(Number(lesson.practices[0].answer)+1000),'wrong draft survives reload');
     await answer(p,lesson.practices[0].answer);
     assert.match(await p.locator('[data-ovm-result]').innerText(),/исправлен/i);
     const once=await p.locator('[data-ovm-result]').innerText();
     assert(!(await p.locator('[data-ovm-action="check-practice"]').isEnabled()),'a completed answer cannot be credited twice');
     await action(p,'next');
     await action(p,'hint');await answer(p,lesson.practices[1].answer);
     assert.match(await p.locator('[data-ovm-result]').innerText(),/помощ|опор/i);
     await action(p,'next');
     const proof=p.locator('[data-ovm-proof]');
     if(await proof.isVisible())await edit(p,proof,'Моя самостоятельная запись: признак, условия и вывод.',{proof:'Моя самостоятельная запись: признак, условия и вывод.'});
     await answer(p,String(lesson.practices[2].answer)+'/1');
     assert.match(await p.locator('[data-ovm-result]').innerText(),/самостоятельно/i);
     assert.notEqual(once,await p.locator('[data-ovm-result]').innerText());
     await preserveNative();
     await saveScreen(p,lesson.id+'-result-'+width);
     await reloadLesson();
     assert.match(await p.locator('[data-ovm-result]').innerText(),/самостоятельно/i,'completed attempt survives reload');
     if(await p.locator('[data-ovm-proof]').isVisible())assert.equal(await p.locator('[data-ovm-proof]').inputValue(),'Моя самостоятельная запись: признак, условия и вывод.');
     const completeRecords=await completedRecords(p);
     await action(p,'next');await answer(p,lesson.practices[0].answer);
     assert.match(await p.locator('[data-ovm-result]').innerText(),/Знакомый повтор/);
     assert.deepEqual(await completedRecords(p),completeRecords,'repeat cannot replace corrected result with independent');
     await preserveNative();
     assert.deepEqual(errors,[]);report.journeys.push({lesson:lesson.id,width,status:'PASS',savedRevision:(await lessonState(p)).rev});
    }catch(e){report.failures.push({kind:'journey',lesson:lesson.id,width,error:e.message});await saveScreen(p,'FAIL-'+lesson.id+'-'+width);}
    finally{await c.close();}
   }
  }
  for(const [number,file] of Object.entries(entries)){
   for(const mode of ['board=1','mirror=1','embedded=1','mode=exam','managed','iframe']){
    const c=await context(360,mode==='managed'),p=await c.newPage();
    try{
     if(mode==='iframe'){
      await p.goto(base+'/'+file,{waitUntil:'load'});
      await p.setContent('<iframe src="'+base+'/'+file+'" title="synthetic embedded trainer"></iframe>');
      const frame=p.frameLocator('iframe');await frame.locator('h1').first().waitFor();
      assert.equal(await frame.locator('#oge-video-models').count(),0);
     }else{
      // learning-bridge.js derives and replaces its API from this real query.
      // The synthetic managed global covers entries that do not load that bridge.
      await p.goto(base+'/'+file+'?'+(mode==='managed'?'learning=1':mode),{waitUntil:'load'});
      if(mode==='managed')assert.equal(await p.evaluate(()=>window.MathExamLearning?.managed),true,'the actual managed-mode fixture must stay active at bootstrap');
      assert.equal(await p.locator('#oge-video-models').count(),0);
     }
     assert.equal(await p.evaluate(prefix=>Object.keys(localStorage).filter(k=>k.startsWith(prefix)).length,PREFIX),0);
     report.isolation.push({number:Number(number),mode,status:'PASS'});
    }catch(e){report.failures.push({kind:'isolation',number,mode,error:e.message});}
    finally{await c.close();}
   }
  }
  assert.equal(report.failures.length,0,JSON.stringify(report.failures,null,2));
  report.status='PASS';console.log('OGE_VIDEO_MODELS_BROWSER_OK',report.layouts.length,report.journeys.length,report.isolation.length);
 }catch(e){report.status='FAIL';report.error=e.stack;console.error(e);process.exitCode=1;}
 finally{fs.writeFileSync(path.join(OUT,'browser-evidence.json'),JSON.stringify(report,null,2));if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
})();
