'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {execFileSync}=require('node:child_process'),{pathToFileURL}=require('node:url'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),shots=path.resolve(process.env.EGE_CROSS_TAB_SHOTS||'artifacts/base-cross-tab');
const KEY='mathexam.ege-baza.path.v1',PREFIX=KEY+'.h03.',BASE='5f25f75b6e7178ad1d492c7bcb28ed9e63c97bae';
const offline='downloads/trainers/ege-baza-practice/ege-baza-practice.html';
const previous=new Map(['ege-baza/path/index.html','ege-baza/path/app.js','ege-baza/path/task-first.js','ege-baza/course-journey.js'].map(file=>[file,execFileSync('git',['show',BASE+':'+file],{cwd:root})]));
const errors=[],evidence=[];let barrier=null,browser;
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(pathname==='/__h03_barrier'){
  const current=barrier;if(!current){res.writeHead(409);res.end();return;}
  current.response=res;current.entered();return;
 }
 try{
  const old=pathname.startsWith('/__h03_old/'),relative=(old?pathname.slice('/__h03_old/'.length):pathname.slice(1));
  let file=path.resolve(root,relative);if(!file.startsWith(root+path.sep))throw Error('outside root');
  if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  const name=path.relative(root,file).split(path.sep).join('/');
  res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[path.extname(file)]||'application/octet-stream');
  res.setHeader('Cache-Control','no-store');res.end(old&&previous.has(name)?previous.get(name):fs.readFileSync(file));
 }catch{res.writeHead(404);res.end();}
});
function pauseNextWrite(){
 let resolve,reject;const entered=new Promise((yes,no)=>{resolve=yes;reject=no;});
 const timer=setTimeout(()=>{barrier?.response?.end();reject(Error('cross-tab overlap barrier timed out'));},10000);
 barrier={entered:resolve,response:null};
 return {entered,release(){clearTimeout(timer);barrier?.response?.end('continue');barrier=null;}};
}
async function page(context,url){const result=await context.newPage();result.on('pageerror',error=>errors.push(error.message));await result.goto(url);await result.waitForFunction(()=>!!window.PathCourse);return result;}
const read=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
const answer=page=>page.evaluate(()=>{const row=PathCourse.state().lessons.round;return PathData.task('round',row.seed).answer;});
const submit=async(page,value)=>{await page.locator('#answer').fill(String(value));await page.locator('#answer').press('Enter');};
async function context(width){
 const result=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
 // Pause one real synchronous localStorage commit after the application's read.
 // A second page commits while this page waits; the underlying setItem itself
 // remains atomic and is never simulated, deferred or replaced with a fake store.
 await result.addInitScript(({prefix})=>{
  const write=Storage.prototype.setItem;
  Storage.prototype.setItem=function(key,value){
   if(this===localStorage&&window.__h03PauseNext===true&&String(key).startsWith(prefix)){
    window.__h03PauseNext=false;const request=new XMLHttpRequest();request.open('GET','/__h03_barrier',false);request.send();
    if(request.status!==200)throw Error('overlap barrier unavailable');
   }
   return write.call(this,key,value);
  };
 },{prefix:PREFIX});
 return result;
}
async function settled(page,predicate){await page.waitForFunction(predicate,KEY,{timeout:10000});}
async function screenshot(page,name){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' no horizontal overflow');await page.screenshot({path:path.join(shots,name+'.png'),fullPage:true});}
(async()=>{
 fs.mkdirSync(shots,{recursive:true});assert(fs.existsSync(path.join(root,offline)),'build the targeted offline package first');
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox']});
 for(const [label,route] of [['source','/ege-baza/path/index.html'],['offline-http','/'+offline]]){
  for(const width of [320,1280]){
   for(const mode of ['wrong','help','later-help']){
    const ctx=await context(width),url=origin+route+'#lesson=round',a=await page(ctx,url),b=await page(ctx,url);
    if(mode==='wrong')await submit(a,-99);
    if(mode==='help')await a.locator('#taskHelp>summary').click();
    if(mode==='later-help'){await submit(a,await answer(a));await b.locator('#taskHelp>summary').click();}
    else await submit(b,await answer(b));
    await a.close();await b.close();const reopened=await page(ctx,url),row=(await read(reopened)).lessons.round;
    assert.equal(row.done,true);assert.equal(row.checks.length,1);assert.equal(row.help,true);assert.equal(row.independent,mode==='later-help'?1:0);assert.equal(row.checks[0].independent,mode==='later-help');
    assert.equal(await reopened.locator('#answer').count(),1,'answer remains mounted');
    await screenshot(reopened,`${label}-${width}-${mode}`);evidence.push({route:label,width,case:mode,done:row.done,independent:row.independent,checks:row.checks.length});await ctx.close();
   }
   {
    const ctx=await context(width),url=origin+route+'#lesson=round',a=await page(ctx,url),b=await page(ctx,url);
    await a.locator('#answer').fill(String(await answer(a)));await b.locator('#answer').fill(String(await answer(b)));
    const held=pauseNextWrite();await a.evaluate(()=>window.__h03PauseNext=true);
    const pending=a.locator('#answer').press('Enter');
    try{await held.entered;await b.locator('#answer').press('Enter');}finally{held.release();await pending;}
    await settled(b,key=>JSON.parse(localStorage.getItem(key)).lessons.round.independent===1);
    const row=(await read(a)).lessons.round;assert.equal(row.independent,1);assert.equal(row.checks.length,1);
    await a.close();await b.close();const reopened=await page(ctx,url);assert.equal((await read(reopened)).lessons.round.checks.length,1);
    evidence.push({route:label,width,case:'overlapping-real-writes',independent:1,checks:1});await ctx.close();
   }
   {
    const ctx=await context(width),url=origin+route+'#lesson=round',a=await page(ctx,url),b=await page(ctx,url);
    await a.locator('#answer').fill(String(await answer(a)));const held=pauseNextWrite();await a.evaluate(()=>window.__h03PauseNext=true);
    const pending=a.locator('#answer').press('Enter');
    try{await held.entered;await submit(b,-99);}finally{held.release();await pending;}
    await settled(a,key=>{const row=JSON.parse(localStorage.getItem(key)).lessons.round;return row.done&&row.help&&row.independent===0;});
    assert.equal((await read(a)).lessons.round.checks.length,1);assert(!/с первой/.test(await a.locator('#feedback').innerText()));
    await screenshot(a,`${label}-${width}-overlapping-help`);evidence.push({route:label,width,case:'overlapping-answer-and-error',independent:0});await ctx.close();
   }
   {
    const ctx=await context(width),url=origin+route+'#lesson=round',a=await page(ctx,url),b=await page(ctx,url);
    await a.locator('#answer').fill('7/');await b.locator('#answer').fill('8/');
    await a.close();await b.close();const reopened=await page(ctx,url);
    await reopened.waitForFunction(()=>PathCourse.state().recoveryDrafts.some(row=>row.value==='7/')&&PathCourse.state().recoveryDrafts.some(row=>row.value==='8/'));
    await reopened.locator('#pathRecovery>summary').click();await screenshot(reopened,`${label}-${width}-drafts`);
    assert(await reopened.locator('#downloadRecovery').isVisible());evidence.push({route:label,width,case:'both-drafts-after-close',drafts:['7/','8/']});await ctx.close();
   }
  }
  {
   const ctx=await context(1280),url=origin+route+'#lesson=round',a=await page(ctx,url),old=await page(ctx,origin+'/__h03_old/ege-baza/path/index.html#lesson=round');
   await submit(a,await answer(a));await old.locator('#answer').fill('old-page-exclusive');
   await settled(a,key=>Object.keys(localStorage).some(name=>name.startsWith(key+'.h03-copy.')&&localStorage.getItem(name).includes('old-page-exclusive')));
   await old.close();await a.close();const reopened=await page(ctx,url),row=(await read(reopened)).lessons.round;
   assert.equal(row.done,true);assert.equal(row.independent,1);assert.equal(await reopened.locator('#downloadRecovery').count(),1);
   assert(await reopened.evaluate(key=>Object.keys(localStorage).some(name=>name.startsWith(key+'.h03-copy.')&&localStorage.getItem(name).includes('old-page-exclusive')),KEY));
   evidence.push({route:label,case:'actual-pre-H03-client-and-reopen',oldSource:BASE,independent:row.independent});await ctx.close();
  }
  for(const kind of ['help','error']){
   const ctx=await context(1280),url=origin+route+'#lesson=round',a=await page(ctx,url);await a.close();
   const old=await page(ctx,origin+'/__h03_old/ege-baza/path/index.html#lesson=round');
   if(kind==='help')await old.locator('#taskHelp>summary').click();else await submit(old,-99);
   await old.close();const reopened=await page(ctx,url);await submit(reopened,await answer(reopened));
   const row=(await read(reopened)).lessons.round;assert.equal(row.done,true);assert.equal(row.independent,0);assert.equal(row.checks.at(-1).independent,false);assert(!/с первой/.test(await reopened.locator('#feedback').innerText()));
   evidence.push({route:label,case:'old-only-rollback-'+kind,oldSource:BASE,independent:0});await ctx.close();
  }
  {
   const ctx=await context(1280),url=origin+route,a=await page(ctx,url+'#exam');await a.locator('#start').click();const b=await page(ctx,url+'#exam');
   await a.locator('#answer').fill('3');const held=pauseNextWrite();await a.evaluate(()=>window.__h03PauseNext=true);const pending=a.locator('#answer').press('Enter');
   try{await held.entered;await b.goto(url+'#lesson=round');await b.waitForFunction(()=>!!window.PathCourse);}finally{held.release();await pending;}
   assert.equal((await read(a)).active.i,1);assert.equal((await read(a)).active.assisted,true);
   const stale=await page(ctx,url+'#exam');await submit(a,'4');await stale.locator('#answer').fill('99');await stale.locator('#answer').press('Enter');
   assert.equal((await read(a)).active.i,2);assert.equal((await read(a)).active.answers.length,2);assert((await read(a)).examDrafts.some(row=>row.value==='99'));
   await a.locator('#finish').click();await b.close();await stale.close();await a.close();const reopened=await page(ctx,url+'#report'),saved=await read(reopened);
   assert.equal(saved.active,null);assert.equal(saved.runs.at(-1).assisted,true);assert.equal(saved.runs.at(-1).answers.length,21);
   evidence.push({route:label,case:'same-exam-overlap-stale-question-and-finish',assisted:true});await ctx.close();
  }
  {
   const ctx=await context(1280),url=origin+route+'#lesson=round',opener=await page(ctx,url);
   await opener.evaluate(()=>sessionStorage.setItem('synthetic-cloned-window-id','copied-to-opener-child'));
   const opened=ctx.waitForEvent('page');await opener.evaluate(url=>window.open(url,'_blank'),url);const child=await opened;child.on('pageerror',error=>errors.push(error.message));await child.waitForFunction(()=>!!window.PathCourse);
   assert.equal(await child.evaluate(()=>sessionStorage.getItem('synthetic-cloned-window-id')),'copied-to-opener-child');
   await opener.locator('#answer').fill('opener draft');await child.locator('#answer').fill('child draft');
   const writers=await child.evaluate(prefix=>Object.keys(localStorage).filter(key=>key.startsWith(prefix)).map(key=>JSON.parse(localStorage.getItem(key)).writer),PREFIX);
   assert(new Set(writers).size>=2,'opener and copied sessionStorage still use distinct document writers');
   await opener.close();await child.close();const reopened=await page(ctx,url),saved=JSON.stringify(await reopened.evaluate(()=>PathCourse.state()));assert(saved.includes('opener draft')&&saved.includes('child draft'));
   evidence.push({route:label,case:'opener-cloned-sessionStorage',writers:new Set(writers).size});await ctx.close();
  }
  {
   const ctx=await context(1280),url=origin+route+'#lesson=round',a=await page(ctx,url),b=await page(ctx,url);
   await a.locator('#startSteps').click();await b.locator('#startSteps').click();const step=await a.evaluate(()=>{const row=PathCourse.state().lessons.round;return PathData.task('round',row.seed).steps[0].a;});
   await a.locator('#stepAnswer').fill(String(step));await a.locator('#stepAnswer').press('Enter');await a.locator('#stepAnswer').fill('current-step-draft');
   await b.locator('#stepAnswer').fill('old-step-draft');await a.close();await b.close();const reopened=await page(ctx,url);
   assert.equal(await reopened.locator('#stepAnswer').inputValue(),'current-step-draft');assert(await reopened.evaluate(()=>PathCourse.state().recoveryDrafts.some(row=>row.field==='pastStepDraft'&&row.step===0&&row.value==='old-step-draft')));
   evidence.push({route:label,case:'guided-step-interruption',currentStep:1});await ctx.close();
  }
 }
 {
  const ctx=await browser.newContext({viewport:{width:320,height:900},reducedMotion:'reduce'}),file=pathToFileURL(path.join(root,offline)).href+'#lesson=round';
  await ctx.setOffline(true);const a=await page(ctx,file);
  assert(await a.evaluate(()=>{try{localStorage.setItem('synthetic-offline-probe','yes');localStorage.removeItem('synthetic-offline-probe');return true;}catch{return false;}}),'Chromium supports storage for this standalone file');
  await a.locator('#answer').fill('file draft');await a.locator('#taskHelp>summary').click();await a.reload();assert.equal(await a.locator('#answer').inputValue(),'file draft');
  await submit(a,await answer(a));assert.equal((await read(a)).lessons.round.independent,0);assert.equal((await read(a)).lessons.round.done,true);
  await a.reload();assert.equal((await read(a)).lessons.round.done,true);await screenshot(a,'standalone-file-320');
  evidence.push({route:'standalone-file',width:320,case:'offline-help-answer-reload',crossFilePromise:false});await ctx.close();
 }
 assert.deepEqual(errors,[],'real browser page errors');
 const hashes=Object.fromEntries(['ege-baza/path/app.js','ege-baza/path/task-first.js','ege-baza/course-journey.js',offline].map(file=>[file,createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')]));
 fs.writeFileSync(path.join(shots,'evidence.json'),JSON.stringify({oldSource:BASE,hashes,evidence,pageErrors:errors},null,2)+'\n');
 console.log('EGE_BASE_CROSS_TAB_PROGRESS_BROWSER_OK: '+evidence.length+' cases; source and generated HTML, real overlap, actual old client, opener identity, drafts, step interruption, 320/1280px, standalone file offline.');
})().catch(async error=>{
 console.error(error);process.exitCode=1;
 if(browser)for(const [index,page] of browser.contexts().flatMap(context=>context.pages()).entries())try{await page.screenshot({path:path.join(shots,'failure-'+index+'.png'),fullPage:true,timeout:5000});}catch{}
 fs.mkdirSync(shots,{recursive:true});fs.writeFileSync(path.join(shots,'failure.json'),JSON.stringify({error:error.stack,evidence,pageErrors:errors},null,2)+'\n');
}).finally(async()=>{barrier?.response?.end();if(browser)await browser.close();server.close();});
