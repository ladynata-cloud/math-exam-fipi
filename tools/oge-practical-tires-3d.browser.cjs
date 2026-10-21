'use strict';
/* Runs only in cloud CI. Real Chromium pointer/touch events and served offline archive. */
if (!process.env.CI) throw new Error('Tire 3D browser checks must run in cloud CI. No local browser launch is allowed.');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=process.env.TIRES_3D_ARTIFACTS||path.join(root,'artifacts/tires-3d');
const offline=fs.mkdtempSync(path.join(os.tmpdir(),'tires-3d-offline-'));
execFileSync('unzip',['-q',path.join(root,'downloads/trainers/oge-1-5-trainers/oge-1-5-trainers-package.zip'),'-d',offline]);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname),isOffline=pathname.startsWith('/offline/'),base=isOffline?offline:root;
 const file=path.resolve(base,isOffline?pathname.slice('/offline/'.length):'.'+pathname);
 if(!file.startsWith(base+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
 res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
const records=[];let browser;
async function reveal(locator){
 const parents=await locator.evaluate(el=>{const a=[];for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS'&&!p.open){if(!p.id)p.id='tire-reveal-'+Math.random().toString(36).slice(2);a.unshift(p.id);}return a;});
 for(const id of parents)await locator.page().locator('#'+id+'>summary').click();
}
async function choose(page,selector){const l=page.locator(selector).first();await reveal(l);await l.click();}
async function layout(page,stage,label){
 const size=await page.evaluate(()=>({width:innerWidth,html:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
 assert.ok(size.html<=size.width+2&&size.body<=size.width+2,label+' page overflow '+JSON.stringify(size));
 const result=await stage.evaluate(el=>{const svg=el.querySelector('svg'),t=svg.querySelector('text'),box=t.getBBox(),w=svg.viewBox.baseVal.width,h=svg.viewBox.baseVal.height;return {left:box.x,top:box.y,right:box.x+box.width,bottom:box.y+box.height,w,h,stageWidth:el.clientWidth};});
 assert.ok(result.left>=0&&result.top>=0&&result.right<=result.w&&result.bottom<=result.h,label+' selected label inside the image '+JSON.stringify(result));
 assert.ok(result.stageWidth>=160,label+' model has usable width');
}
async function run(page,width,fromOffline=false){
 const origin='http://127.0.0.1:'+server.address().port;
 await page.goto(origin+(fromOffline?'/offline/practice-1-5-tires.html':'/trainers/oge-1-5-trainers/practice-1-5-tires.html'));
 await page.waitForFunction(()=>document.documentElement.dataset.practicalMinimal==='ready'&&window.Tire3D);
 for(const step of fromOffline?[3]:[0,3,4,5]){
  await choose(page,'#step-stepper [data-step="'+step+'"]');const section=page.locator('#section-'+step);
  const toggle=section.locator('.pd-toggle').first();await reveal(toggle);await toggle.click();const panel=section.locator('.pd-panel').first();
  const lab=panel.locator('details').first();if(!await lab.evaluate(e=>e.open))await lab.locator(':scope>summary').click();
  const stage=panel.locator('.t3d-stage').first(),part=panel.locator('[data-pd-key=part]');await stage.waitFor({state:'visible'});
  const answer=section.locator('[data-pd-main="1"] input').first();if(await answer.count())await answer.fill('123,4');
  const answers=await section.locator('input:not([data-pd-key]),select:not([data-pd-key])').evaluateAll(es=>es.map(e=>e.value));
  const progress=await page.evaluate(()=>JSON.stringify(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])));
  assert.equal(await stage.getAttribute('data-yaw'),'-38');assert.equal(await stage.getAttribute('data-pitch'),'-12');
  await part.selectOption('width');await layout(page,stage,'initial '+width);
  await panel.locator('.t3d-root').first().screenshot({path:path.join(out,(fromOffline?'offline-':'')+'initial-'+step+'-'+width+'.png')});
  await panel.locator('[data-tire-view=front]').click();assert.match(await panel.locator('.t3d-view-note').textContent(),/ширина скрыта/);
  await panel.locator('[data-tire-view=tread]').click();assert.equal(await stage.getAttribute('data-yaw'),'90');
  await stage.focus();await stage.press('ArrowLeft');assert.equal(await stage.getAttribute('data-yaw'),'80');
  await stage.press('Home');assert.equal(await stage.getAttribute('data-yaw'),'-38');
  await stage.scrollIntoViewIfNeeded();const rect=await stage.boundingBox(),x=rect.x+rect.width/2,y=rect.y+rect.height/2;
  if(width<=360){
   const cdp=await page.context().newCDPSession(page);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+35,y:y+15}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
  }else{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+45,y+20,{steps:5});await page.mouse.up();}
  assert.notEqual(await stage.getAttribute('data-yaw'),'-38','actual '+(width<=360?'touch':'mouse')+' rotates wheel');
  const rotation=[await stage.getAttribute('data-yaw'),await stage.getAttribute('data-pitch')];
  for(const [key,value]of [['width','255'],['profile','80'],['disk','19']]){const control=panel.locator('[data-pd-key='+key+']');await control.focus();await control.press('End');assert.equal(await control.inputValue(),value);}
  for(const [selected,value]of [['width',255],['side',204],['disk',482.6],['all',890.6],['radius',445.3]]){
   await part.selectOption(selected);assert.ok(Math.abs(Number(await stage.locator('[data-tire-dimension]').getAttribute('data-world-value'))-value)<1e-8);
   await layout(page,stage,selected+' max '+width);
  }
  await part.selectOption('width');await panel.locator('[data-tire-view=quarter]').click();await stage.screenshot({path:path.join(out,(fromOffline?'offline-':'')+'max-width-'+step+'-'+width+'.png')});
  await part.selectOption('side');await stage.screenshot({path:path.join(out,(fromOffline?'offline-':'')+'height-'+step+'-'+width+'.png')});
  // Preserve a non-preset orientation through close/open, not merely a reset preset.
  await stage.focus();await stage.press('ArrowRight');const saved=[await stage.getAttribute('data-yaw'),await stage.getAttribute('data-pitch')];
  await panel.locator(':scope>.pd-return').click();assert.equal(await panel.isVisible(),false);await toggle.click();
  assert.deepEqual([await stage.getAttribute('data-yaw'),await stage.getAttribute('data-pitch')],saved);
  assert.equal(await panel.locator('[data-pd-key=width]').inputValue(),'255');assert.equal(await part.inputValue(),'side');
  assert.deepEqual(await section.locator('input:not([data-pd-key]),select:not([data-pd-key])').evaluateAll(es=>es.map(e=>e.value)),answers);
  assert.equal(await page.evaluate(()=>JSON.stringify(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)]))),progress,'no auto-credit or draft mutation');
  if(step===5){assert.equal(await stage.locator('[data-tire-baseline]').count(),1);assert.match(await panel.locator('.t3d-comparison').textContent(),/профиль 60% при тех же B и d/);}
  await toggle.click();records.push({width,step,offline:fromOffline,rotation});
 }
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({headless:true});
 for(const width of [320,360,1280]){
  const context=await browser.newContext({viewport:{width,height:900},hasTouch:width<=360,isMobile:width<=360,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:'+server.address().port?route.continue():route.abort());
  try{await run(page,width);assert.deepEqual(errors,[]);}catch(e){await page.screenshot({path:path.join(out,'FAIL-'+width+'.png'),fullPage:true}).catch(()=>{});throw e;}finally{await context.close();}
 }
 const context=await browser.newContext({viewport:{width:360,height:900},hasTouch:true,isMobile:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:'+server.address().port?route.continue():route.abort());
 try{await run(page,360,true);assert.deepEqual(errors,[]);}finally{await context.close();}
 fs.writeFileSync(path.join(out,'coverage.json'),JSON.stringify({cases:records.length,records},null,2));console.log('TIRES_3D_BROWSER_OK '+records.length+' route/viewport cases');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();fs.rmSync(offline,{recursive:true,force:true});});
