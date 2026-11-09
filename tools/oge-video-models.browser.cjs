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
const {entries, assets} = require('./oge-video-models-preservation.cjs');
const lessons = [...require('../trainers/oge-video-graphs.js'), ...require('../trainers/oge-video-geometry.js')];
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'artifacts/oge-video-models');
const PREFIX = 'mathExam.oge.videoModels.v1.';
const MIME = {'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml'};
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const report = {head:execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim(), sources:Object.fromEntries([...Object.values(entries),...assets].map(file=>[file,sha(fs.readFileSync(path.join(ROOT,file)))])),layouts:[],journeys:[],isolation:[],failures:[]};
let server, browser, base = process.env.OGE_VIDEO_BASE_URL;
fs.mkdirSync(OUT,{recursive:true});
async function saveScreen(page,name){await page.screenshot({path:path.join(OUT,name+'.png'),fullPage:false,caret:'initial'});}
async function localState(page){return page.evaluate(prefix=>Object.fromEntries(Object.entries(localStorage).filter(([key])=>!key.startsWith(prefix)).sort(([a],[b])=>a.localeCompare(b))),PREFIX);}
async function nativeInputs(page){return page.evaluate(()=>Array.from(document.querySelectorAll('input,textarea,select')).filter(e=>!e.closest('#oge-video-models')).map(e=>({tag:e.tagName,id:e.id,name:e.name,type:e.type,value:e.value,checked:e.checked,disabled:e.disabled})));}
async function completedRecords(page){return page.evaluate(keys=>Object.fromEntries(keys.flatMap(key=>{const raw=localStorage.getItem(key);return raw?[[key,JSON.parse(raw).results]]:[];})),lessons.map(lesson=>PREFIX+lesson.id));}
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
(async()=>{
 try{
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
     const previousStorage=await localState(p);let previousInputs=await nativeInputs(p);
     assert(await p.evaluate(()=>typeof navigator.locks?.request==='function'),'real browser supports durable cross-tab saving');
     const preserveNative=async()=>{await durableView(p);assert.deepEqual(await localState(p),previousStorage,'research must not alter native progress or drafts');assert.deepEqual(await nativeInputs(p),previousInputs,'research must not alter native form controls');};
     // Native trainers intentionally generate fresh examples on reload. Compare
     // each actual lesson-interaction segment with its native starting state.
     const reloadLesson=async()=>{await preserveNative();await p.reload({waitUntil:'load'});previousInputs=await nativeInputs(p);await openLesson(p,lesson);};
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
      await p.goto(base+'/'+file+(mode==='managed'?'':'?'+mode),{waitUntil:'load'});
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
