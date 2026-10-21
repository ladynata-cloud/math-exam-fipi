'use strict';
// Real-browser release gate, executed in cloud CI only.
if(!process.env.CI)throw new Error('Run this browser gate in cloud CI, not a local browser.');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=process.env.TIRES_FEEDBACK_ARTIFACTS||path.join(root,'artifacts/tires-feedback');
const offline=fs.mkdtempSync(path.join(os.tmpdir(),'tire-feedback-offline-'));
execFileSync('unzip',['-q',path.join(root,'downloads/trainers/oge-1-5-trainers/oge-1-5-trainers-package.zip'),'-d',offline]);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname),isOffline=pathname.startsWith('/offline/'),base=isOffline?offline:root,file=path.resolve(base,isOffline?pathname.slice(9):'.'+pathname);if(!file.startsWith(base+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
const order=[0,2,1,3,4,5,6],records=[];let browser;
async function reveal(locator){const parents=await locator.evaluate(el=>{const ids=[];for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS'&&!p.open){if(!p.id)p.id='tf-'+Math.random().toString(36).slice(2);ids.unshift(p.id);}return ids;});for(const id of parents)await locator.page().locator('#'+id+'>summary').click();}
async function active(page,id){await page.waitForFunction(n=>document.querySelector('#section-'+n)?.classList.contains('active'),id);assert.deepEqual(await page.locator('.step-section.active').evaluateAll(es=>es.map(e=>e.id)),['section-'+id]);assert.equal(await page.locator('#step-stepper .step-btn.active').getAttribute('data-step'),String(id));}
async function choose(page,id){const b=page.locator('#step-stepper [data-step="'+id+'"]');await reveal(b);await b.click();await active(page,id);}
async function layout(page,label){const sizes=await page.evaluate(()=>({viewport:innerWidth,html:document.documentElement.scrollWidth,body:document.body.scrollWidth}));assert.ok(sizes.html<=sizes.viewport+2&&sizes.body<=sizes.viewport+2,label+' overflow '+JSON.stringify(sizes));}
async function run(page,width,isOffline=false){
 const origin='http://127.0.0.1:'+server.address().port;await page.goto(origin+(isOffline?'/offline/practice-1-5-tires.html':'/trainers/oge-1-5-trainers/practice-1-5-tires.html'));
 await page.waitForFunction(()=>document.documentElement.dataset.tireLearningFlow==='ready');
 const variant=page.locator('#variant-select');await reveal(variant);const values=await variant.locator('option').evaluateAll(es=>es.map(e=>e.value));assert.equal(values.length,21);
 const selected=isOffline?[values[0]]:width===1280?values:[values[0],values.at(-1)];
 for(const value of selected){
  await reveal(variant);await variant.selectOption(value);await choose(page,0);
  const stepper=page.locator('#step-stepper');assert.deepEqual(await stepper.locator('[data-step]').evaluateAll(es=>es.map(e=>+e.dataset.step)),order);
  assert.match(await stepper.locator('[data-step="0"]').textContent(),/Давайте разбер[её]мся с маркировкой/);
  const boxes=await stepper.locator('[data-step]').evaluateAll(es=>es.map(e=>{const b=e.getBoundingClientRect();return {left:b.left,top:b.top,bottom:b.bottom,font:parseFloat(getComputedStyle(e.querySelector('.step-name')||e).fontSize)};}));
  boxes.forEach((b,i)=>{assert.ok(b.font>=18,'readable route labels');if(i){assert.ok(Math.abs(b.left-boxes[0].left)<2,'vertical route has one column');assert.ok(b.top>=boxes[i-1].bottom-1,'route rows do not overlap');}});
  if(value===values[0]&&!isOffline)await stepper.screenshot({path:path.join(out,'vertical-route-'+width+'.png')});
  await page.locator('#section-0 .nav-btn.next').click();await active(page,2);
  const task1=page.locator('#section-2'),table=task1.locator('.compat-table');assert.equal(await table.isVisible(),true,'task1 matrix is visible without help');
  assert.ok(await table.locator('tbody tr').count()>1);assert.equal(await table.locator('.win,.col-hl').count(),0,'given table does not highlight the answer');
  const answer=task1.locator('[data-pd-main="1"] input');await answer.fill('17,25');
  await layout(page,'task1 variant'+value+'@'+width);
  if(value===values[0]||value===values.at(-1))await task1.screenshot({path:path.join(out,(isOffline?'offline-':'')+'task1-'+value+'-'+width+'.png')});
  await task1.locator('.nav-btn.next').click();await active(page,1);
  const master=page.locator('#master-table'),editable=master.locator('input.calc-cell:not(:disabled)').first();await reveal(editable);await editable.fill('123,45');await editable.press('Tab');
  const cellKey=await editable.evaluate(e=>({tire:e.dataset.tire,cell:e.dataset.cell}));
  for(const step of [3,4,5,6]){
   if(step===3){await page.locator('#section-1 .nav-btn.next').click();await active(page,step);}else{await page.locator('#section-'+(step-1)+' .nav-btn.next').click();await active(page,step);}
   const section=page.locator('#section-'+step),shared=section.locator('.tlf-shared-calculations');
   assert.equal(await shared.isVisible(),true,'shared calculations accessible with task'+(step-1));
   assert.ok((await shared.textContent()).includes('123,45'),'shared table reflects learner entry');
   await layout(page,'task'+(step-1)+' variant'+value+'@'+width);
   if(step===3&&value===values[0]&&!isOffline)await section.screenshot({path:path.join(out,'shared-calculations-'+width+'.png')});
  }
  // Back controls follow the revised sequence, rather than the old numeric order.
  for(const previous of [5,4,3,1,2,0]){const current=await page.locator('.step-section.active').getAttribute('id');await page.locator('#'+current+' .nav-btn:not(.next):not(:disabled)').click();await active(page,previous);}
  await choose(page,2);assert.equal(await answer.inputValue(),'17,25','task1 draft survives navigation');
  await choose(page,1);assert.equal(await master.locator('[data-tire="'+cellKey.tire+'"][data-cell="'+cellKey.cell+'"]').inputValue(),'123,45','calculation draft survives navigation');
  records.push({width,variant:value,offline:isOffline,checks:['vertical route','task1 given','next/back stable IDs','shared draft table','draft retention']});
 }
 await choose(page,0);const section=page.locator('#section-0'),toggle=section.locator('.pd-toggle').first();
 assert.equal((await toggle.textContent()).trim(),'Хочешь подсказку?');await toggle.click();assert.equal((await toggle.textContent()).trim(),'Убрать подсказку');
 const panel=section.locator('.pd-panel').first(),lab=panel.locator('details').first();if(!await lab.evaluate(e=>e.open))await lab.locator(':scope>summary').click();
 for(const part of ['width','side','disk'])await panel.locator('[data-tire-part="'+part+'"]').check();
 const chosen=await panel.locator('[data-tire-part]:checked').evaluateAll(es=>es.map(e=>e.dataset.tirePart));assert.deepEqual(chosen,['width','side','disk']);
 assert.equal(await panel.locator('select').count(),0,'measurement choices are visible checkboxes');
 const model=panel.locator('.t3d-root');await layout(page,'three labels '+width);await model.screenshot({path:path.join(out,(isOffline?'offline-':'')+'three-dimensions-'+width+'.png')});
 const progress=await page.evaluate(()=>JSON.stringify(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])));
 await toggle.click();assert.equal((await toggle.textContent()).trim(),'Хочешь подсказку?');await toggle.click();assert.deepEqual(await panel.locator('[data-tire-part]:checked').evaluateAll(es=>es.map(e=>e.dataset.tirePart)),chosen);
 await panel.locator(':scope>.pd-return').click();assert.equal((await toggle.textContent()).trim(),'Хочешь подсказку?');assert.equal(await page.evaluate(()=>JSON.stringify(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)]))),progress,'help changes no credit');
 await choose(page,6);const animation=page.locator('#section-6 .anim-block');await reveal(animation);
 if(!await animation.isVisible())await page.locator('#section-6 .pd-toggle').first().click();
 await reveal(animation);await layout(page,'rolling diagram '+width);
 const rollingFonts=await page.locator('#anim-svg text').evaluateAll(es=>es.map(e=>parseFloat(getComputedStyle(e).fontSize)*e.ownerSVGElement.getBoundingClientRect().width/e.ownerSVGElement.viewBox.baseVal.width));assert.ok(rollingFonts.length>0&&rollingFonts.every(n=>n>=18),'rolling diagram labels stay readable');
 await animation.screenshot({path:path.join(out,(isOffline?'offline-':'')+'rolling-diagram-'+width+'.png')});
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({headless:true});
 for(const [width,offlineMode]of [[320,false],[360,false],[1280,false],[360,true]]){
  const context=await browser.newContext({viewport:{width,height:1000},hasTouch:width<500,isMobile:width<500,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).origin==='http://127.0.0.1:'+server.address().port?r.continue():r.abort());
  try{await run(page,width,offlineMode);assert.deepEqual(errors,[]);}catch(e){await page.screenshot({path:path.join(out,'FAIL-'+width+'-'+offlineMode+'.png'),fullPage:true}).catch(()=>{});throw e;}finally{await context.close();}
 }
 fs.writeFileSync(path.join(out,'coverage.json'),JSON.stringify({cases:records.length,records},null,2));console.log('TIRES_FEEDBACK_BROWSER_OK '+records.length+' variant/viewport cases');
})().catch(e=>{console.error(e);process.exitCode=1;fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'partial-coverage.json'),JSON.stringify(records,null,2));}).finally(async()=>{if(browser)await browser.close();server.close();fs.rmSync(offline,{recursive:true,force:true});});
