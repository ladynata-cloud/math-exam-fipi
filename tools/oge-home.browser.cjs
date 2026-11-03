'use strict';
// Public homepage only; no learner accounts, messages or persisted work.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const out=process.env.OGE_HOME_ARTIFACTS;
if(out)fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
let server,base=process.env.OGE_HOME_BASE_URL;
const report={cases:[],errors:[]};
async function picture(page,name){if(out)await page.screenshot({path:path.join(out,name+'.png'),fullPage:false});}
const routes={tires:'/trainers/oge-1-5-trainers/practice-1-5-tires.html',apartment:'/trainers/oge-1-5-trainers/practice-1-5-apartments.html',graphs:'/trainers/oge-task11-graphs-trainer.html',geometry:'/trainers/oge-course/#geometry',stove:'/trainers/oge-1-5-trainers/practice-1-5-stoves.html',plot:'/trainers/oge-1-5-trainers/practice-1-5-land-plots.html',paper:'/trainers/oge-1-5-trainers/practice-1-5-paper-sheets.html',dice:'/trainers/oge-task10-probability.html'};
async function context(browser,options={}){
 const c=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce',...options});
 await c.route('**/*',r=>new URL(r.request().url()).origin===new URL(base).origin?r.continue():r.fulfill({status:200,body:''}));
 c.on('page',p=>p.on('pageerror',e=>report.errors.push(e.message)));
 return c;
}
async function fits(p){assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow');}
(async()=>{
 if(!base){server=http.createServer((req,res)=>{try{let file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(root+path.sep)&&file!==root)throw Error('path');if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);}catch{res.writeHead(404).end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;}
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  for(const width of [320,390,768,1280]){
   const c=await context(browser,{viewport:{width,height:900},hasTouch:width<600,isMobile:width<600});const p=await c.newPage();
   await p.goto(base);await p.locator('.model-exhibit[data-renderer]').waitFor();
   assert(await p.locator('#oge-model-canvas').isVisible());assert(!await p.locator('.model-fallback').isVisible());
   await fits(p);assert.equal(await p.locator('h1').count(),1);assert.equal(await p.locator('.model-tabs button').count(),9);assert(await p.locator('.orbit-label').isVisible());
   assert.equal(await p.locator('#model-pause').getAttribute('aria-pressed'),'true','reduced motion starts paused');
   await picture(p,`home-${width}`);
   await p.locator('#oge-models').scrollIntoViewIfNeeded();
   const first=await p.locator('#oge-model-canvas').screenshot();await p.waitForTimeout(180);
   assert.deepEqual(await p.locator('#oge-model-canvas').screenshot(),first,'paused pixels remain still');
   for(const [id,url] of Object.entries(routes)){
    await p.locator(`[data-model="${id}"]`).click();
    assert.equal(await p.locator(`[data-model="${id}"]`).getAttribute('aria-pressed'),'true');
    assert.equal(await p.locator('.model-tabs [aria-pressed="true"]').count(),1);assert(!await p.locator('.orbit-label').isVisible(),'solar center hidden for individual models');
    assert.equal(await p.locator('#model-link').getAttribute('href'),url);
    assert.equal((await p.request.get(base+url)).status(),200,'topic destination exists');
    await fits(p);await picture(p,`${id}-${width}`);
   }
   await p.locator('[data-model="graphs"]').press('Enter');
   assert.match(await p.locator('#model-description').innerText(),/a > 0.*вверх.*a < 0.*вниз/);
   await p.locator('#model-link').click();await p.waitForURL(base+routes.graphs);assert(await p.locator('h1').isVisible(),'opens real graph trainer');
   await p.goto(base);await p.locator('.hero .btn').first().click();await p.waitForURL(base+'/trainers/oge-course/');assert(await p.locator('#geometry').count());
   report.cases.push({width,status:'PASS',checks:['layout','eight selections','destinations','paused pixels','keyboard','course navigation']});await c.close();
  }
  // Running animation, pause/resume, direct manipulation and reduced-motion change.
  const c=await context(browser,{reducedMotion:'no-preference'}),p=await c.newPage();await p.goto(base);await p.locator('.model-exhibit[data-renderer]').waitFor();
  const orbitStart=await p.locator('#oge-model-canvas').screenshot();await p.waitForTimeout(1200);assert.notDeepEqual(await p.locator('#oge-model-canvas').screenshot(),orbitStart,'system animates');await picture(p,'orbit-moving');
  await p.locator('#model-pause').click();const orbitStill=await p.locator('#oge-model-canvas').screenshot();await p.waitForTimeout(200);assert.deepEqual(await p.locator('#oge-model-canvas').screenshot(),orbitStill,'pause freezes whole system');await p.locator('#model-pause').click();
  await p.locator('[data-model="tires"]').click();const moving=await p.locator('#oge-model-canvas').screenshot();await p.waitForTimeout(300);assert.notDeepEqual(await p.locator('#oge-model-canvas').screenshot(),moving,'animation changes pixels');
  await p.locator('#model-pause').click();const still=await p.locator('#oge-model-canvas').screenshot();await p.waitForTimeout(200);assert.deepEqual(await p.locator('#oge-model-canvas').screenshot(),still,'pause stops animation');
  const box=await p.locator('#oge-model-canvas').boundingBox();await p.mouse.move(box.x+box.width*.4,box.y+box.height*.5);await p.mouse.down();await p.mouse.move(box.x+box.width*.65,box.y+box.height*.5,{steps:8});await p.mouse.up();assert.notDeepEqual(await p.locator('#oge-model-canvas').screenshot(),still,'drag rotates model');
  await p.locator('#model-pause').click();await p.emulateMedia({reducedMotion:'reduce'});await p.locator('#model-pause[aria-pressed="true"]').waitFor({timeout:5000});assert.equal(await p.locator('#model-pause').getAttribute('aria-pressed'),'true');
  await p.keyboard.press('Tab');await fits(p);report.cases.push({status:'PASS',checks:['orbital animation','whole-system pause','animation','pause','resume','drag','motion preference changes']});await c.close();
  for(const mode of ['no-js','no-library','no-webgl']){
   const c=await context(browser,{javaScriptEnabled:mode!=='no-js'});
   if(mode==='no-library')await c.route('**/three.min.js',r=>r.abort());
   if(mode==='no-webgl')await c.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:get.call(this,type,...args);};});
   const p=await c.newPage();await p.goto(base);await fits(p);
   if(mode==='no-webgl'){await p.locator('[data-renderer="canvas"]').waitFor();assert(await p.locator('#oge-model-canvas').isVisible());await p.locator('[data-model="apartment"]').click();assert.equal(await p.locator('#model-link').getAttribute('href'),routes.apartment);}
   else{assert(await p.locator('.model-fallback').isVisible());assert(!await p.locator('.model-tabs').isVisible());}
   await picture(p,mode);await p.locator('.hero .btn').first().click();await p.waitForURL(base+'/trainers/oge-course/');report.cases.push({mode,status:'PASS'});await c.close();
  }
  assert.deepEqual(report.errors,[]);console.log('OGE_HOME_3D_OK',JSON.stringify(report));
 }finally{if(out)fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));if(browser)await browser.close();if(server)await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
