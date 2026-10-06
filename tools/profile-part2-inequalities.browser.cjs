'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const {lessons}=require('../trainers/ege-profile/inequalities/lessons.js');
const root=path.resolve(__dirname,'..'),prefix='/trainers/ege-profile/inequalities/';
const server=http.createServer((req,res)=>{try{let p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!p.startsWith(root+path.sep))return res.writeHead(403).end();if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css'})[path.extname(p)]||'application/octet-stream');res.end(fs.readFileSync(p));}catch(_){res.writeHead(404).end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 let journeys=0,steps=0;
 try{
 await page.goto(origin+prefix+'index.html');assert.equal(await page.locator('[data-lesson]').count(),18);
 for(const lesson of lessons){
  await page.goto(origin+prefix+'lesson.html?lesson='+lesson.id);await page.waitForFunction(()=>window.__inequalityLesson);assert.equal(await page.title(),lesson.title+' · пошаговый разбор · MathExam');
  for(let i=0;i<lesson.steps.length;i++){
   const step=lesson.steps[i];
   // Empty submission must fail, including a final axis missing a required endpoint.
   if(i===0){await page.locator('#check').click();assert.equal((await page.evaluate(()=>__inequalityLesson.getState())).errors,1);}
   for(const f of step.fields){
    if(f.kind==='number')await page.locator('[data-field="'+f.id+'"]').fill(String(f.correct).replace('.',','));
    else if(f.kind==='choice')await page.locator('[data-field="'+f.id+'"][value="'+f.correct+'"]').check();
    else if(f.kind==='axis')for(const token of f.correct){const b=page.locator('[data-axis="'+f.id+'"][data-token="'+token+'"]');await b.focus();await b.press('Space');assert.equal(await b.getAttribute('aria-pressed'),'true');}
    else throw Error('Unsupported field '+f.kind);
   }
   if(i===1){await page.reload();await page.waitForFunction(()=>window.__inequalityLesson);assert.equal((await page.evaluate(()=>__inequalityLesson.getState())).step,1);}
   await page.locator('#check').click();assert.equal((await page.evaluate(()=>__inequalityLesson.getState())).solved.length,i+1,lesson.id+' step '+i+': '+await page.locator('#feedback').innerText());
   assert.equal(await page.locator('#notebook>li').count(),i+1);assert(await page.locator('#next').isVisible());assert(await page.locator('#check').isHidden());
   if(i===lesson.steps.length-1){await page.setViewportSize({width:360,height:800});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),lesson.id+' mobile overflow');}
   await page.locator('#next').click();steps++;
  }
  assert(await page.locator('#completion').isVisible());assert((await page.locator('#report').inputValue()).includes(lesson.reportAnswer));assert((await page.locator('#report').inputValue()).includes(origin+prefix+'lesson.html?lesson='+lesson.id));assert.equal((await page.evaluate(()=>__inequalityLesson.getState())).step,lesson.steps.length);
  await page.setViewportSize({width:1280,height:900});journeys++;
 }
 // Report targets keep the authored example, exclude ambient queries and reject another origin.
 await page.goto(origin+prefix+'lesson.html?lesson=radical-3&invite=private-query');await page.waitForFunction(()=>window.__inequalityLesson);
 assert(!(await page.locator('#report').inputValue()).includes('private-query'));
 await page.evaluate(()=>{MathExamGuidedLesson.reportPath='https://example.invalid/leak';__inequalityLesson.applyState(__inequalityLesson.getState());});
 assert((await page.locator('#report').inputValue()).endsWith('Страница: '+origin+prefix+'lesson.html'));
 assert(!(await page.locator('#report').inputValue()).includes('example.invalid'));
 // Unconfigured legacy lessons preserve their old query-free report URL.
 await page.goto(origin+'/trainers/ege-profile/log-inequalities/lesson.html?invite=private-query');await page.waitForFunction(()=>window.__logExample);
 await page.evaluate(()=>{const steps=__logExample.steps;__logExample.applyState({schema:1,step:steps.length,answers:Object.fromEntries(steps.map((s,i)=>[i,Object.fromEntries(s.fields.map(f=>[f.id,f.correct]))])),solved:steps.map((_,i)=>i),helps:[],errors:0,feedback:{kind:'',message:''}});});
 assert((await page.locator('#report').inputValue()).endsWith('Страница: '+origin+'/trainers/ege-profile/log-inequalities/lesson.html'));
 // State isolation, stale tab protection, restart confirmation and invalid hydration.
 await page.goto(origin+prefix+'lesson.html?lesson=rational-1');await page.waitForFunction(()=>window.__inequalityLesson);const before=await page.evaluate(()=>__inequalityLesson.getState());
 assert.equal(await page.evaluate(()=>__inequalityLesson.applyState({schema:1,step:999})),false);assert.deepEqual(await page.evaluate(()=>__inequalityLesson.getState()),before);
 await page.locator('#restart').click();await page.locator('#restart-cancel').click();assert.deepEqual(await page.evaluate(()=>__inequalityLesson.getState()),before);
 const other=await context.newPage();await other.goto(origin+prefix+'lesson.html?lesson=rational-1');await other.waitForFunction(()=>window.__inequalityLesson);await other.locator('#restart').click();await other.locator('#restart-confirm').click();await page.waitForFunction(()=>document.querySelector('#load-newer').hidden===false);assert(await page.locator('#restart').isDisabled());await page.locator('#load-newer').click();assert.equal((await page.evaluate(()=>__inequalityLesson.getState())).step,0);await other.close();
 await page.goto(origin+prefix+'lesson.html?lesson=repeated-1');await page.waitForFunction(()=>window.__inequalityLesson);assert.equal((await page.evaluate(()=>__inequalityLesson.getState())).step,lessons.find(l=>l.id==='repeated-1').steps.length);
 await page.goto(origin+prefix+'index.html');await page.setViewportSize({width:360,height:800});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'hub mobile overflow');assert.equal(await page.locator('[data-lesson="rational-1"]').innerText(),'Пример 1');assert((await page.locator('[data-lesson="repeated-1"]').innerText()).includes('пройден'));
 assert.deepEqual(errors,[]);console.log('PROFILE_PART2_INEQUALITIES_BROWSER_OK',JSON.stringify({journeys,steps,widths:[360,1280],keyboardAxes:true,reload:true,staleTab:true,errors}));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
