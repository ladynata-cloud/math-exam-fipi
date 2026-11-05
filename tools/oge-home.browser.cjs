'use strict';
// Public OGE landing only; no learner accounts, messages or persisted work.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),vm=require('node:vm');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),catalog={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'assets/oge-home-topics.js'),'utf8'),catalog);
const topics=catalog.window.OGE_HOME_TOPICS,out=process.env.OGE_HOME_ARTIFACTS;
if(out)fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
let server,base=process.env.OGE_HOME_BASE_URL;
const report={cases:[],errors:[]},checkedLinks=new Set();
async function picture(page,name){if(out){if(!name.startsWith('home-'))await page.locator('#model-stage').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,name+'.png'),fullPage:false});}}
async function context(browser,options={}){
 const c=await browser.newContext({viewport:{width:1280,height:1000},reducedMotion:'reduce',...options});
 await c.route('**/*',r=>new URL(r.request().url()).origin===new URL(base).origin?r.continue():r.fulfill({status:200,body:''}));
 c.on('page',p=>p.on('pageerror',e=>report.errors.push(e.message)));return c;
}
async function fits(p){assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow');}
async function destination(p,href){assert.equal(await p.locator('#model-link').getAttribute('href'),href);if(!checkedLinks.has(href)){assert.equal((await p.request.get(base+href)).status(),200,'topic destination exists: '+href);checkedLinks.add(href);}}
(async()=>{
 if(!base){server=http.createServer((req,res)=>{try{let file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(root+path.sep)&&file!==root)throw Error('path');if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);}catch{res.writeHead(404).end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;}
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  for(const width of [320,390,768,1280]){
   const c=await context(browser,{viewport:{width,height:1000},hasTouch:width<600,isMobile:width<600}),p=await c.newPage();
   await p.goto(base+'/oge/');await p.locator('.model-exhibit[data-renderer]').waitFor();
   assert(await p.locator('#oge-model-canvas').isVisible());assert(!await p.locator('.model-fallback').isVisible());
   await fits(p);assert.equal(await p.locator('h1').count(),1);assert.equal(await p.locator('[data-orbit]').count(),27);assert(await p.locator('.orbit-label').isVisible());
   assert.equal(await p.locator('#model-pause').getAttribute('aria-pressed'),'true','reduced motion starts paused');
   assert.equal(await p.locator('.model-exhibit').getAttribute('data-detail'),'intro');assert(!await p.locator('.orbit-numbers').isVisible());
   for(const img of await p.locator('.topic-art').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(el=>el.decode());assert(await img.evaluate(el=>el.complete&&el.naturalWidth>0),'crisp topic art loaded');}
   if(out){await p.locator('.oge-topics').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,`topics-${width}.png`)});await p.locator('.start-section').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,`routes-${width}.png`)});}
   await p.evaluate(()=>scrollTo(0,0));
   await picture(p,`home-${width}`);await picture(p,`intro-${width}`);
   await p.locator('[data-feature=tires]').click();assert.equal(await p.locator('.model-exhibit').getAttribute('data-detail'),'model');assert.match(await p.locator('#model-description').innerText(),/Шины/);
   await picture(p,`tire-${width}`);await p.locator('[data-orbit=all]').click();
   await p.locator('#oge-models').scrollIntoViewIfNeeded();await picture(p,`system-${width}`);
   const first=await p.locator('#oge-model-canvas').screenshot();await p.waitForTimeout(180);assert.deepEqual(await p.locator('#oge-model-canvas').screenshot(),first,'paused system stays still');
   // Every number and every subtype is exercised on every supported viewport.
   for(const topic of topics){
    const n=topic.number;await p.locator(`[data-orbit="${n}"]`).click();
    assert.equal(await p.locator('.orbit-picker [aria-pressed="true"]').count(),1);assert.equal(await p.locator('.model-tabs button').count(),topic.types.length+1);
    assert(await p.locator('.orbit-label').isVisible());assert.match(await p.locator('#model-number').innerText(),new RegExp('№'+n+' ·'));
    await destination(p,topic.href);
    if([1,11,25].includes(n))await picture(p,`orbit-${n}-${width}`);
    for(const [j,type] of topic.types.entries()){
     await p.locator(`[data-type="${j}"]`).click();assert.equal(await p.locator('.model-tabs [aria-pressed="true"]').count(),1);
     assert(!await p.locator('.orbit-label').isVisible(),'center hidden in individual view');await destination(p,type.href);await fits(p);
     if((width===320&&[2,11,25].includes(n))||(width===1280&&[6,10,17,21,24].includes(n)))await picture(p,`model-${n}-${j}-${width}`);
    }
    await p.locator('[data-type="-1"]').click();assert(await p.locator('.orbit-label').isVisible(),'return to selected orbit');
   }
   await p.locator('[data-orbit="11"]').press('Enter');await p.locator('[data-type="1"]').press('Enter');
   assert.match(await p.locator('#model-description').innerText(),/a > 0.*вверх.*a < 0.*вниз/);
   await p.locator('#model-link').click();await p.waitForURL(base+topics[10].href);assert(await p.locator('h1').isVisible(),'real graph trainer opens');
   await p.goto(base+'/oge/');assert.match(await p.locator('.hero .btn').first().innerText(),/Начни уже с чего-нибудь!/);await p.locator('.hero .btn').first().click();await p.waitForURL(base+'/trainers/oge-course/');assert(await p.locator('#geometry').count());await fits(p);await p.screenshot(out?{path:path.join(out,`catalog-${width}.png`),fullPage:false}:{});
   for(const section of ['part1','geometry','part2'])assert(await p.locator('#'+section).count());
   assert(await p.getByRole('link',{name:'Рассмотреть модели ↗',exact:true}).isVisible());
   await p.getByRole('link',{name:'Рассмотреть модели ↗',exact:true}).click();await p.waitForURL(base+'/oge/#oge-models');
   assert.equal(await p.locator('.start-routes article').count(),3);
   for(const link of await p.locator('.start-routes a,.course-chapters a').all()){const href=await link.getAttribute('href');assert.equal((await p.request.get(base+href)).status(),200,'strategic entry path '+href);}
   await p.locator('[data-orbit=all]').click();assert(await p.locator('.orbit-numbers').isVisible());await p.locator('[data-orbit=intro]').click();assert(!await p.locator('.orbit-numbers').isVisible());
   report.cases.push({width,status:'PASS',orbits:25,subtypes:53,checks:['layout','every selection and destination','paused pixels','keyboard','course navigation','owner invitation preserved','intro and all-map modes','topic illustrations','catalog visual continuity','three starting paths']});await c.close();
  }
  const c=await context(browser,{reducedMotion:'no-preference'}),p=await c.newPage();await p.goto(base+'/oge/');await p.locator('.model-exhibit[data-renderer]').waitFor();
  await p.locator('[data-orbit=all]').click();const start=await p.locator('#oge-model-canvas').screenshot();await p.waitForTimeout(700);assert.notDeepEqual(await p.locator('#oge-model-canvas').screenshot(),start,'whole universe moves');await picture(p,'orbit-moving');
  await p.locator('#model-pause').click();const frozen=await p.locator('#oge-model-canvas').screenshot();await p.waitForTimeout(180);assert.deepEqual(await p.locator('#oge-model-canvas').screenshot(),frozen,'pause freezes all 25 orbits');
  await p.locator('[data-orbit="2"]').click();await p.locator('[data-type="0"]').click();const still=await p.locator('#oge-model-canvas').screenshot();
  const box=await p.locator('#oge-model-canvas').boundingBox();await p.mouse.move(box.x+box.width*.4,box.y+box.height*.5);await p.mouse.down();await p.mouse.move(box.x+box.width*.65,box.y+box.height*.5,{steps:8});await p.mouse.up();assert.notDeepEqual(await p.locator('#oge-model-canvas').screenshot(),still,'drag rotates individual model');
  await p.locator('#model-pause').click();const moving=await p.locator('#oge-model-canvas').screenshot();await p.waitForTimeout(300);assert.notDeepEqual(await p.locator('#oge-model-canvas').screenshot(),moving,'individual spin resumes');
  await p.emulateMedia({reducedMotion:'reduce'});await p.locator('#model-pause[aria-pressed="true"]').waitFor({timeout:5000});
  await p.locator('[data-orbit="all"]').click();assert(!await p.locator('.model-tabs').isVisible());assert.match(await p.locator('#model-number').innerText(),/25/);
  report.cases.push({status:'PASS',checks:['orbit movement','pause','individual spin','drag','motion preference','return to all']});await c.close();
  for(const mode of ['no-js','no-library','no-topics','no-webgl']){
   const c=await context(browser,{javaScriptEnabled:mode!=='no-js'});
   if(mode==='no-library')await c.route('**/three.min.js',r=>r.abort());
   if(mode==='no-topics')await c.route('**/oge-home-topics.js*',r=>r.abort());
   if(mode==='no-webgl')await c.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:get.call(this,type,...args);};});
   const p=await c.newPage();await p.goto(base+'/oge/');await fits(p);
   if(mode==='no-webgl'){await p.locator('[data-renderer="canvas"]').waitFor();assert(await p.locator('#oge-model-canvas').isVisible());await picture(p,'software-system');await p.locator('[data-orbit=all]').click();await p.locator('[data-orbit="24"]').click();await destination(p,topics[23].href);}
   else{assert(await p.locator('.model-fallback').isVisible());assert(!await p.locator('.orbit-picker').isVisible());}
   await picture(p,mode);await p.locator('.hero .btn').first().click();await p.waitForURL(base+'/trainers/oge-course/');report.cases.push({mode,status:'PASS'});await c.close();
  }
  assert.deepEqual(report.errors,[]);console.log('OGE_HOME_3D_OK',JSON.stringify(report));
 }finally{if(out)fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));if(browser)await browser.close();if(server)await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
