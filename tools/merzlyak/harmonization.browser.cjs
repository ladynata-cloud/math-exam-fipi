'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const http=require('node:http');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..');
const course=require(path.join(root,'geometry-merzlyak/data/course.json'));
const I=require(path.join(root,'geometry-merzlyak/assets/investigations.js'));
const KEY='mathExamGeometry.merzlyak.v1';
const output=path.join(root,'artifacts/merzlyak-h27');
fs.mkdirSync(output,{recursive:true});
const evidence={gate:'H27_MERZLYAK_7_9_HARMONIZED',newLessonJourneys:0,offlineLessons:0,layouts:[],conflicts:[],errors:[],complete:false};
const server=http.createServer((req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let file=path.resolve(root,'.'+pathname);if(file!==root&&!file.startsWith(root+path.sep))return res.writeHead(403).end();if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
async function value(page,id){return page.evaluate(({key,id})=>JSON.parse(localStorage.getItem(key))?.units[id],{key:KEY,id});}
async function atTop(page){await page.evaluate(()=>scrollTo(0,0));}
async function layout(page,label){await page.evaluate(()=>new Promise(r=>requestAnimationFrame(r)));const dimensions=await page.evaluate(()=>({width:innerWidth,scrollWidth:Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)}));assert.ok(dimensions.scrollWidth<=dimensions.width+1,label+' '+JSON.stringify(dimensions));evidence.layouts.push({label,...dimensions});}
async function chooseUnknown(page){await page.locator('[data-research-prediction]').selectOption({label:'Пока не знаю'});await page.locator('[data-research-start]').click();await page.locator('[data-research-scene] svg').waitFor({state:'visible'});}
async function changeFirstControl(page,unit){const control=I.get(unit.id).controls[0],field=page.locator('[data-research-control="'+control.key+'"]');const current=await field.inputValue();if(control.type==='select'){const option=control.options.find(o=>String(o.value)!==current);await field.selectOption(String(option.value));}else{await field.fill(String(Number(current)===control.max?control.min:control.max));await field.dispatchEvent('change');}}
async function completeInquiry(page,unit){
 await chooseUnknown(page);
 assert.equal(await page.locator('[data-research-result]').isVisible(),false,unit.id+' has no early conclusion');
 await page.locator('[data-research-observation]').fill('Первый случай: записаны видимые значения и положение объектов.');await page.locator('[data-research-record]').click();
 await changeFirstControl(page,unit);
 await page.locator('[data-research-observation]').fill('Второй случай: сравнил, что изменилось и что осталось тем же.');await page.locator('[data-research-record]').click();await page.locator('[data-research-conclusion]').click();
 await page.locator('[data-research-result]').waitFor({state:'visible'});
}
async function newJourneys(browser,base){
 const context=await browser.newContext({viewport:{width:320,height:900}}),page=await context.newPage();page.on('pageerror',e=>evidence.errors.push(e.message));
 try{
  await page.goto(base+'/geometry-merzlyak/');assert.equal(await page.locator('.course-card').count(),84);
  for(const [index,unit]of course.units.entries()){
   await page.goto(base+'/geometry-merzlyak/atlas/'+unit.id+'.html');
   await page.locator('[data-investigation="'+unit.id+'"]').waitFor({state:'visible'});assert.equal((await value(page,unit.id)).screen,'research');assert.equal(await page.locator('#geo-board').count(),0);
   const select=page.locator('[data-research-prediction]'),box=await select.boundingBox();assert.ok(box&&box.y>=0&&box.y+box.height<=900,unit.id+' first action before scrolling: '+JSON.stringify(box));
   await layout(page,unit.id+'-entry-320');
   if([0,7,10,24,54,83].includes(index))await page.screenshot({path:path.join(output,unit.id+'-first-320.png')});
   await completeInquiry(page,unit);await layout(page,unit.id+'-completed-320');
   const recorded=(await value(page,unit.id)).research;assert.equal(recorded.completed,true);assert.equal((await value(page,unit.id)).independent,0);assert.equal((await value(page,unit.id)).selfCorrected,0);
   await page.reload();assert.deepEqual((await value(page,unit.id)).research,recorded);await page.locator('[data-research-result]').waitFor({state:'visible'});
   await page.locator('.stage-footer [data-action="next"]').click();assert.equal((await value(page,unit.id)).stage,0);assert.equal((await value(page,unit.id)).screen,'');
   await page.locator('.stage-footer [data-action="next"]').click();assert.equal((await value(page,unit.id)).stage,2);assert.equal(await page.locator('#geo-board').count(),0);
   if(++evidence.newLessonJourneys%20===0)console.log('H27 new journeys',evidence.newLessonJourneys);
  }
  const id=course.units[0].id;await page.goto(base+'/geometry-merzlyak/atlas/'+id+'.html');await page.locator('[data-view="research"]').click();await page.goto(base+'/geometry-merzlyak/');
  assert.equal(await page.locator('[data-resume]').getAttribute('href'),'atlas/'+id+'.html');assert.match(await page.locator('.path-current').innerText(),/Первое исследование по теме/);await page.locator('[data-resume]').click();assert.equal((await value(page,id)).screen,'research');
  await page.setViewportSize({width:1280,height:900});await atTop(page);await layout(page,'desktop-resume');await page.screenshot({path:path.join(output,'research-resume-1280.png')});
 }finally{await context.close();}
}
async function conflictingWindows(browser,base){
 const context=await browser.newContext({viewport:{width:1280,height:900}}),a=await context.newPage(),b=await context.newPage();const id=course.units[0].id,url=base+'/geometry-merzlyak/atlas/'+id+'.html';
 try{
  await a.goto(url);await a.locator('[data-stage="5"]').click();await b.goto(url);await a.locator('[data-conflict="open"]').click();
  await a.evaluate(()=>{const el=document.getElementById('written');el.value='Мой несохранённый черновик';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await b.evaluate(({key,id})=>{const d=JSON.parse(localStorage.getItem(key));d.units[id].written='Из другой вкладки с тем же updated';localStorage.setItem(key,JSON.stringify(d));},{key:KEY,id});
  await a.locator('#research-conflict').waitFor({state:'visible'});assert.match(await a.locator('#research-conflict textarea').inputValue(),/Мой несохранённый черновик/);assert.equal((await value(b,id)).written,'Из другой вкладки с тем же updated');
  await a.evaluate(()=>{GeoStore.download=data=>window.__download=data;});await a.locator('[data-conflict="mine"]').click();assert.equal(await a.evaluate(id=>window.__download.units[id].written,id),'Мой несохранённый черновик');
  await a.locator('[data-conflict="latest"]').click();assert.equal(await a.evaluate(id=>window.__download.units[id].written,id),'Из другой вкладки с тем же updated');
  await a.screenshot({path:path.join(output,'two-tabs-preserve-both.png')});await a.locator('[data-conflict="open"]').click();assert.equal(await a.locator('#written').inputValue(),'Из другой вкладки с тем же updated');
  await a.locator('#written').fill('Продолжил после восстановления');await a.locator('[data-stage="0"]').click();assert.equal((await value(b,id)).written,'Продолжил после восстановления');
  evidence.conflicts.push('same unit, equal timestamp, both exports, explicit recovery');
  // Import in the map is another writer; the still-open lesson cannot replace it.
  await b.goto(base+'/geometry-merzlyak/');await a.locator('[data-stage="5"]').click();const current=await value(a,id),imported={version:1,units:{[id]:{...current,written:'Импортированная работа',updated:current.updated+100000}}};
  await b.locator('#import-progress').setInputFiles({name:'progress.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(imported))});await b.locator('#import-result').filter({hasText:'Прочитано учебных записей: 1'}).waitFor();await a.locator('#research-conflict').waitFor({state:'visible'});assert.equal((await value(a,id)).written,'Импортированная работа');evidence.conflicts.push('import refuses stale lesson overwrite');
 }finally{await context.close();}
 const separate=await browser.newContext(),p=await separate.newPage(),q=await separate.newPage();try{
  await p.goto(base+'/geometry-merzlyak/atlas/'+course.units[0].id+'.html');await q.goto(base+'/geometry-merzlyak/atlas/'+course.units[1].id+'.html');
  for(const [page,text]of [[p,'Запись в первой теме'],[q,'Запись во второй теме']]){await page.locator('[data-stage="5"]').click();await page.locator('#written').fill(text);await page.locator('[data-stage="0"]').click();assert.equal(await page.locator('#research-conflict').count(),0);}
  assert.equal((await value(p,course.units[0].id)).written,'Запись в первой теме');assert.equal((await value(p,course.units[1].id)).written,'Запись во второй теме');evidence.conflicts.push('different units merge without lost work');
 }finally{await separate.close();}
}
async function drawingRestoration(browser,base){
 const context=await browser.newContext(),page=await context.newPage(),id='merzlyak-base-7-1';
 try{
  await context.addInitScript(({key,id})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({version:1,units:{[id]:{stage:1,seed:1,contentVersion:1,observation:'Мой прежний рисунок',updated:1}}}));},{key:KEY,id});
  await page.goto(base+'/geometry-merzlyak/atlas/'+id+'.html');await page.locator('#geo-board .point-select').selectOption('A');await page.locator('#geo-board .point-x').fill('130');await page.locator('#geo-board [data-act="move"]').click();await page.locator('.stage-nav [data-stage="2"]').click();const drawing=(await value(page,id)).drawing;assert.ok(drawing.points.some(p=>p.id==='A'&&p.x===130));
  await page.locator('details:has(#proof-board) summary').click();await page.locator('#proof-board .point-select').selectOption('A');await page.locator('#proof-board .point-x').fill('155');await page.locator('#proof-board [data-act="move"]').click();await page.locator('[data-view="research"]').click();const proofDrawing=(await value(page,id)).proofDrawing;assert.ok(proofDrawing.points.some(p=>p.id==='A'&&p.x===155));
  await page.reload();assert.deepEqual((await value(page,id)).drawing,drawing);assert.deepEqual((await value(page,id)).proofDrawing,proofDrawing);assert.equal(await page.locator('#geo-board').count(),0);
  await page.locator('.legacy-research summary').click();await page.locator('.legacy-research [data-stage="1"]').click();assert.equal(await page.locator('#geo-board .point-x').inputValue(),'130');assert.equal(await page.locator('#observation').inputValue(),'Мой прежний рисунок');
  await page.locator('.stage-nav [data-stage="2"]').click();await page.locator('details:has(#proof-board) summary').click();assert.equal(await page.locator('#proof-board .point-x').inputValue(),'155');evidence.drawingRestoration=true;
 }finally{await context.close();}
}
async function offline(browser){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'merzlyak-h27-offline-')),folder=path.join(temp,'geometry-merzlyak');fs.cpSync(path.join(root,'geometry-merzlyak'),folder,{recursive:true});
 const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage();page.on('pageerror',e=>evidence.errors.push('offline: '+e.message));
 try{
  await context.route(/^https?:/,route=>route.abort());
  for(const unit of course.units){await page.goto(pathToFileURL(path.join(folder,'atlas',unit.id+'.html')).href);assert.equal(await page.locator('[data-investigation="'+unit.id+'"]').count(),1);await chooseUnknown(page);await changeFirstControl(page,unit);assert.ok(await page.locator('[data-research-scene] svg').isVisible());await layout(page,unit.id+'-offline-1280');if(unit.id==='merzlyak-base-8-7'){await page.locator('.stage-nav [data-stage="2"]').click();assert.equal(await page.evaluate(()=>!!window.MathExamMidlineDiagram),true);assert.ok(await page.locator('.midline-diagram').count()||await page.locator('#lesson svg').count());}if(++evidence.offlineLessons%20===0)console.log('H27 offline lessons',evidence.offlineLessons);}
  const id=course.units[0].id;await page.goto(pathToFileURL(path.join(folder,'index.html')).href);await page.evaluate(()=>{GeoStore.download=data=>window.__download=data;});await page.locator('#export-progress').click();const exported=await page.evaluate(()=>window.__download);assert.equal(exported.version,1);assert.ok(Object.keys(exported.units).length>0);
  await page.locator('#import-progress').setInputFiles({name:'round-trip.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exported))});await page.locator('#import-result').filter({hasText:'Прочитано учебных записей'}).waitFor();
  await page.goto(pathToFileURL(path.join(folder,'atlas',id+'.html')).href);assert.equal((await value(page,id)).research.started,true);await page.screenshot({path:path.join(output,'offline-whole-folder.png')});evidence.offlineImportExport=true;
 }finally{await context.close();fs.rmSync(temp,{recursive:true,force:true});}
}
async function unavailableStorage(browser,base){
 const context=await browser.newContext(),page=await context.newPage();
 try{await context.addInitScript(()=>{Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('Storage is blocked','SecurityError');}});});await page.goto(base+'/geometry-merzlyak/atlas/'+course.units[0].id+'.html');await chooseUnknown(page);await page.locator('#storage-notice').waitFor({state:'visible'});await page.evaluate(()=>{GeoStore.download=data=>window.__download=data;});await page.locator('#export-progress').click();const exported=await page.evaluate(()=>window.__download);assert.equal(exported.units[course.units[0].id].research.started,true);evidence.blockedStorageExport=true;}finally{await context.close();}
}
(async()=>{let browser;try{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;browser=await chromium.launch({headless:true,executablePath:process.env.GEOMETRY_CHROMIUM||process.env.CHROMIUM_EXECUTABLE_PATH||chromium.executablePath(),args:['--no-sandbox']});await newJourneys(browser,base);await conflictingWindows(browser,base);await drawingRestoration(browser,base);await offline(browser);await unavailableStorage(browser,base);assert.deepEqual(evidence.errors,[]);evidence.complete=true;console.log(JSON.stringify({status:'PASS',...evidence}));}catch(error){console.error(error);evidence.failure=error.message;process.exitCode=1;}finally{fs.writeFileSync(path.join(output,'evidence.json'),JSON.stringify(evidence,null,2));if(browser)await browser.close();server.close();}})();
