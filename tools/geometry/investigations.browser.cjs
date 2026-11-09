'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),out=path.join(process.env.ATANASYAN_AUDIT_ARTIFACTS||path.join(root,'artifacts/atanasyan-audit'),'planar');
const ids=['triangle-signs','similarity-signs','inscribed','chords-tangent','area-triangle'];
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!p.startsWith(root+path.sep))return res.writeHead(403).end();try{res.setHeader('Content-Type',p.endsWith('.html')?'text/html; charset=utf-8':p.endsWith('.js')?'text/javascript':'text/plain');res.end(fs.readFileSync(p));}catch{res.writeHead(404).end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;const results=[],errors=[];
 try{
  browser=await chromium.launch({headless:true,...(process.env.GEOMETRY_CHROMIUM?{executablePath:process.env.GEOMETRY_CHROMIUM}:{}),args:['--no-sandbox']});
  const base='http://127.0.0.1:'+server.address().port+'/geometry-course/atlas/';
  for(const width of [320,1280])for(const id of ids){
   const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+id+'.html');
   await page.locator('.investigation-predict select').selectOption({index:1});await page.locator('.investigation-predict button').click();assert.equal(await page.locator('.investigation-predict select').isDisabled(),true);
   await page.locator('.investigation-model input').focus();await page.keyboard.press('End');const value=await page.locator('.investigation-model input').inputValue();await page.reload();assert.equal(await page.locator('.investigation-model input').inputValue(),value);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.screenshot({path:path.join(out,id+'-'+width+'-model.png'),fullPage:false});
   await page.locator('[data-stage="4"]').click();
   const viewport=await page.evaluate(()=>{const question=document.querySelector('.task-question').getBoundingClientRect(),figure=document.querySelector('#lesson svg').getBoundingClientRect();return {questionBottom:question.bottom,figureBottom:figure.bottom,width:innerWidth,scrollWidth:document.documentElement.scrollWidth};});
   assert.ok(viewport.scrollWidth<=width+1,JSON.stringify(viewport));assert.ok(viewport.questionBottom<=900&&viewport.figureBottom<=900,id+' condition and complete figure in first viewport '+JSON.stringify(viewport));
   const answer=await page.evaluate(()=>{const record=JSON.parse(localStorage.getItem(GeoStore.KEY)).units[COURSE_CONFIG.unit.id];return GeoTasks.format(GeoInvestigations.forUnit(COURSE_CONFIG.unit.id).task(record.seed).answer);});
   await page.locator('#answer').fill(answer);await page.locator('#answer-form button').click();assert.match(await page.locator('#answer-feedback').innerText(),/первой попытки/);
   await page.screenshot({path:path.join(out,id+'-'+width+'-independent.png'),fullPage:false});
   await page.reload();assert.equal(await page.evaluate(()=>GeoInvestigations.forUnit(COURSE_CONFIG.unit.id).progress(JSON.parse(localStorage.getItem(GeoStore.KEY)).units[COURSE_CONFIG.unit.id]).verified),1);
   results.push({id,width,forecastAndParameterRestored:true,independentRestored:true,...viewport});await context.close();
  }
  const context=await browser.newContext({viewport:{width:1280,height:900}}),first=await context.newPage();first.on('pageerror',e=>errors.push(e.message));await first.goto(base+'area-triangle.html');const second=await context.newPage();second.on('pageerror',e=>errors.push(e.message));await second.goto(base+'area-triangle.html');
  await second.locator('#observation').fill('Новое наблюдение из второй вкладки');await second.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  await first.locator('#observation').fill('Несохранённое локальное наблюдение первой вкладки');await first.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  assert.match(await first.locator('#storage-notice').innerText(),/другой вкладке/);
  assert.equal(await first.evaluate(()=>JSON.parse(localStorage.getItem(GeoStore.KEY)).units['area-triangle'].observation),'Новое наблюдение из второй вкладки');
  const downloadEvent=first.waitForEvent('download');await first.locator('#export-progress').click();const download=await downloadEvent;const exported=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(exported.recoveryDrafts['area-triangle'].record.observation,'Несохранённое локальное наблюдение первой вкладки');assert.equal(exported.units['area-triangle'].observation,'Новое наблюдение из второй вкладки');await context.close();
  assert.deepEqual(errors,[]);const report={status:'PASS',scenarios:results,staleTabProtected:true,conflictDownload:true,errors};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
