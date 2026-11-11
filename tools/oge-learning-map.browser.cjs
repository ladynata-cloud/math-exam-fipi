'use strict';
// CI browser gate. Every context is disposable and contains synthetic data only.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'artifacts/oge-learning-map');
const KEY='mathExamCourseProgress.v1',NAV='mathexam.oge.course-navigation.v1';
const course='/trainers/oge-course/';
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'};
const report={layouts:[],scenarios:[]};
let server,base=process.env.OGE_MAP_BASE_URL;
fs.mkdirSync(out,{recursive:true});
(async()=>{
 let browser;
 try{
  if(!base){
   server=http.createServer((req,res)=>{
    try{
     const u=new URL(req.url,'http://local');
     let file=path.resolve(root,'.'+decodeURIComponent(u.pathname));
     assert(file===root||file.startsWith(root+path.sep));
     if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
     res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');
     fs.createReadStream(file).pipe(res);
    }catch{res.writeHead(404).end();}
   });
   await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
   base='http://127.0.0.1:'+server.address().port;
  }
  browser=await chromium.launch({headless:true});
  async function context(options={}){
   const c=await browser.newContext({reducedMotion:'reduce',...options});
   await c.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
   return c;
  }
  for(const width of [320,390,768,1280]){
   const c=await context({viewport:{width,height:900}}),p=await c.newPage(),errors=[];
   p.on('pageerror',e=>errors.push(e.message));
   await p.goto(base+course,{waitUntil:'load'});
   await p.locator('#course-track-list [data-course-step]').first().waitFor({state:'attached'});
   assert.equal(await p.locator('#course-track-list [data-track-id]').count(),7);
   assert.equal(await p.locator('#course-track-list [data-course-step]').count(),28);
   const primary=p.locator('#course-continue');
   assert(await primary.isVisible());
   assert.match(await primary.innerText(),/Начать/);
   assert.equal(await primary.getAttribute('href'),'/trainers/oge-task6-fractions.html');
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow at '+width);
   await primary.focus();assert(await primary.evaluate(e=>e===document.activeElement));
   await p.keyboard.press('Tab');
   assert(await p.locator('[data-course-guide="start"]').evaluate(e=>e===document.activeElement),'Tab reaches start help');
   await p.keyboard.press('Tab');
   assert(await p.locator('[data-course-guide="resume"]').evaluate(e=>e===document.activeElement),'Tab reaches continuation help');
   await p.keyboard.press('Tab');
   const firstTrack=p.locator('#course-track-list [data-track-id]').first();
   assert(await firstTrack.locator('summary').evaluate(e=>e===document.activeElement),'Tab reaches the first native track summary');
   await p.keyboard.press('Enter');
   assert(await firstTrack.getAttribute('open')!==null,'Enter opens the first track');
   await p.keyboard.press('Enter');
   assert.equal(await firstTrack.getAttribute('open'),null,'Enter closes the first track');
   await p.screenshot({path:path.join(out,'map-'+width+'.png')});
   const track=p.locator('#course-track-list [data-track-id="geometry"]');
   const summary=track.locator('summary');
   await summary.focus();await p.keyboard.press('Enter');
   assert(await track.getAttribute('open')!==null,'Keyboard opens geometry line');
   assert(await track.locator('[data-course-step="task-25"]').isVisible());
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Expanded line fits at '+width);
   for(const link of await track.locator('[data-course-step]').all()){
    const box=await link.boundingBox();assert(box&&box.height>=44,'Step touch target is at least 44px');
   }
   await p.screenshot({path:path.join(out,'geometry-'+width+'.png'),fullPage:true});
   assert.deepEqual(errors,[]);report.layouts.push({width,status:'PASS'});await c.close();
  }
  for(const width of [320,390,1280]){
   const c=await context({viewport:{width,height:900}}),p=await c.newPage(),errors=[];
   p.on('pageerror',e=>errors.push(e.message));
   await p.goto(base+course,{waitUntil:'load'});
   const before=await p.evaluate(()=>JSON.stringify({...localStorage}));
   await p.locator('[data-course-guide="start"]').click();
   const panel=p.locator('#course-guide-panel');
   assert.equal(await panel.getAttribute('data-guide-state'),'manual');
   assert(await p.locator('#course-guide-title').evaluate(e=>e===document.activeElement));
   assert.equal(await p.locator('[data-course-guide-action="pause"]').isVisible(),false);
   await p.locator('[data-course-guide-action="next"]').click();
   assert.equal(await panel.getAttribute('data-guide-step'),'2');
   assert.equal(await p.locator('#course-continue').getAttribute('data-guide-motion'),'none');
   for(const control of await panel.locator('button:visible').all()){
    const box=await control.boundingBox();assert(box&&box.height>=44,'Guide touch target at '+width);
   }
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Guide fits '+width);
   await p.screenshot({path:path.join(out,'guide-start-'+width+'.png')});
   await p.locator('[data-course-guide-action="next"]').click();
   await p.locator('[data-course-guide-action="next"]').click();
   assert(await p.locator('#course-continue').evaluate(e=>e===document.activeElement));
   assert.equal(new URL(p.url()).pathname,course,'Guide does not navigate');
   await p.keyboard.press('Escape');assert.equal(await panel.isVisible(),false);
   assert(await p.locator('[data-course-guide="start"]').evaluate(e=>e===document.activeElement));
   await p.locator('[data-course-guide="resume"]').click();
   assert.match(await p.locator('#course-guide-message').innerText(),/Тема для продолжения пока не найдена/);
   await p.locator('[data-course-guide-action="close"]').click();
   assert.equal(await p.evaluate(()=>JSON.stringify({...localStorage})),before,'Guide preserves every saved byte');
   assert.deepEqual(errors,[]);report.scenarios.push('Manual guide, focus, storage and layout '+width);await c.close();
  }
  {
   const c=await context({reducedMotion:'no-preference',viewport:{width:390,height:900}}),p=await c.newPage();
   await p.goto(base+course,{waitUntil:'load'});
   await p.locator('[data-course-guide="start"]').click();
   const panel=p.locator('#course-guide-panel');
   await p.locator('[data-course-guide-action="pause"]').click();
   await p.waitForTimeout(2500);
   assert.equal(await panel.getAttribute('data-guide-step'),'1');
   assert.equal(await panel.getAttribute('data-guide-state'),'paused');
   await p.locator('[data-course-guide-action="pause"]').click();
   await p.waitForFunction(()=>document.querySelector('#course-guide-panel').dataset.guideStep==='2');
   assert.equal(await p.locator('#course-continue').getAttribute('data-guide-motion'),'active');
   await p.screenshot({path:path.join(out,'guide-pointer-390.png')});
   await p.waitForFunction(()=>document.querySelector('#course-guide-panel').dataset.guideState==='finished');
   assert.equal(await p.locator('#course-continue').getAttribute('data-guide-motion'),'none');
   await p.locator('[data-course-guide-action="repeat"]').click();
   assert.equal(await panel.getAttribute('data-guide-step'),'1');
   await p.locator('[data-course-guide-action="close"]').click();
   assert.equal(await p.locator('#course-continue').getAttribute('data-guide-motion'),null);
   report.scenarios.push('Finite animation, pause, resume, replay and cleanup');await c.close();
  }
  {
   const c=await context({viewport:{width:390,height:900}}),p=await c.newPage();
   const seed={[KEY]:{'oge-t7-pryamaya':{v:1,solvedByType:{'ris/one':2},updatedAt:Date.now()-1000}}};
   await c.addInitScript(values=>{
    if(!sessionStorage.getItem('oge-map-synthetic-seeded')){
     for(const [k,v] of Object.entries(values))localStorage.setItem(k,JSON.stringify(v));
     sessionStorage.setItem('oge-map-synthetic-seeded','yes');
    }
   },seed);
   await p.goto(base+course,{waitUntil:'load'});
   await p.locator('#course-track-list [data-course-step]').first().waitFor({state:'attached'});
   assert.equal(await p.locator('#course-continue').getAttribute('href'),'/trainers/oge-task7-number-line.html');
   assert.match(await p.locator('#course-continue').innerText(),/Продолжить/);
   await p.locator('[data-course-guide="resume"]').click();
   assert((await p.locator('#course-guide-topic').innerText()).includes(await p.locator('#course-next-title').innerText()));
   await p.locator('[data-course-guide-action="next"]').click();
   await p.locator('[data-course-guide-action="next"]').click();
   assert.match(await p.locator('#course-guide-message').innerText(),/конкретного задания зависит/);
   await p.screenshot({path:path.join(out,'guide-resume-390.png')});
   await p.locator('[data-course-guide-action="close"]').click();
   assert.equal(await p.evaluate(k=>localStorage.getItem(k),KEY),JSON.stringify(seed[KEY]),'Reading map preserves progress bytes');
   await p.locator('[data-track-id="graphs"] summary').click();
   await p.locator('[data-course-step="task-11"]').click();
   await p.waitForURL(base+'/trainers/oge-task11-graphs-trainer.html');
   const cursor=JSON.parse(await p.evaluate(k=>localStorage.getItem(k),NAV));
   assert.equal(cursor.stepId,'task-11');assert.deepEqual(Object.keys(cursor).sort(),['at','stepId']);
   await p.goto(base+course,{waitUntil:'load'});
   await p.locator('#course-track-list [data-course-step]').first().waitFor({state:'attached'});
   assert.equal(await p.locator('#course-continue').getAttribute('href'),'/trainers/oge-task11-graphs-trainer.html');
   await p.screenshot({path:path.join(out,'continue-after-return.png')});
   report.scenarios.push('Selected topic survives return; real links navigate');
   await c.close();
  }
  {
   const c=await context(),writer=await c.newPage(),reader=await c.newPage();
   await writer.goto(base+course);await reader.goto(base+course);
   await reader.locator('#course-track-list [data-course-step]').first().waitFor({state:'attached'});
   await reader.locator('#course-continue').focus();
   const record={'oge-t7-pryamaya':{solvedByType:{'ris/one':1},updatedAt:Date.now()}};
   await writer.evaluate(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key:KEY,value:record});
   await reader.waitForFunction(()=>document.querySelector('#course-continue').getAttribute('href')==='/trainers/oge-task7-number-line.html');
   assert.equal(await reader.evaluate(()=>document.activeElement.id),'course-continue','Refresh preserves focus on the visible continue link');
   assert.equal(await reader.locator('#course-track-list [data-track-id]').count(),7);
   report.scenarios.push('Native storage event updates another course tab');await c.close();
  }
  {
   const c=await context({javaScriptEnabled:false,viewport:{width:320,height:900}}),p=await c.newPage();
   await p.goto(base+course);
   assert(await p.locator('#course-continue').isVisible());
   assert((await p.locator('#course-track-list a[href]').count())>=7);
   assert.equal(await p.locator('[data-course-guide="start"]').isVisible(),false);
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await p.locator('#course-continue').click();await p.waitForURL(base+'/trainers/oge-task6-fractions.html');
   report.scenarios.push('No-JavaScript map and start link work');await c.close();
  }
  {
   const c=await context({viewport:{width:320,height:900}}),p=await c.newPage(),errors=[];
   await c.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Disabled for test','SecurityError');}}));
   p.on('pageerror',e=>errors.push(e.message));await p.goto(base+course);
   await p.locator('#course-track-list [data-course-step]').first().waitFor({state:'attached'});
   assert(await p.locator('#course-continue').isVisible());
   assert.match(await p.locator('#course-storage-note').innerText(),/недоступ|не разреш|не удалось|не сохраня/i);
   assert.deepEqual(errors,[]);report.scenarios.push('Denied storage retains all routes and explains limitation');await c.close();
  }
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('OGE_LEARNING_MAP_BROWSER_OK',JSON.stringify(report));
 }finally{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{fs.writeFileSync(path.join(out,'failure.txt'),String(error.stack||error));console.error(error);process.exitCode=1;});
