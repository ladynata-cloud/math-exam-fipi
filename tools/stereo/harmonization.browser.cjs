'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os'),crypto=require('node:crypto'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),C=require('../../stereo-course/data/course.json'),T=require('../../stereo-course/assets/tasks.js'),A=require('../../stereo-course/assets/answer.js'),M=require('../../stereo-course/assets/investigation-models.js');
const out=process.env.STEREO_HARMONIZATION_ARTIFACTS||path.join(root,'artifacts/stereo-harmonization'),KEY='mathExamStereo.v1';
fs.mkdirSync(out,{recursive:true});
const bytes=fs.readFileSync(path.join(root,'stereo-course/index.html')),errors=[],evidence={sourceSha256:crypto.createHash('sha256').update(bytes).digest('hex'),views:[],routes:[],checks:[],expansions:[]};
const server=http.createServer((req,res)=>{if(req.url.split('?')[0]==='/stereo-course/index.html'){res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(bytes);}else{res.writeHead(404);res.end();}});
const state=(page,id)=>page.evaluate(({key,id})=>JSON.parse(localStorage.getItem(key)).units[id],{key:KEY,id});
// Reopening appends a start event and advances the revision; every learning field is retained.
const retainedWork=({updated,events,...record})=>record;
const stage=(page,n)=>page.locator('[data-stage="'+n+'"]').first().click();
const monitor=page=>page.on('pageerror',error=>errors.push(error.message));
async function ready(page){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
async function measure(page,id,width,phase){
 await ready(page);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),id+' no horizontal overflow '+width+' '+phase);
 const measured=await page.locator('[data-investigation-model] svg').evaluate(svg=>{const vb=svg.viewBox.baseVal,ctm=svg.getScreenCTM(),scale=Math.hypot(ctm.a,ctm.b),b=svg.getBoundingClientRect();return{width:vb.width,height:vb.height,bounds:{top:b.top,bottom:b.bottom,left:b.left,right:b.right},labels:[...svg.querySelectorAll('.am-label')].map(el=>{const r=el.getBBox();return{key:el.dataset.label,text:el.textContent,x:r.x,y:r.y,width:r.width,height:r.height,pixels:parseFloat(getComputedStyle(el).fontSize)*scale};})};});
 if(phase==='prediction'){
  measured.action=await page.locator('[data-investigation-action=explore]').boundingBox();
  measured.heading=await page.locator('.workspace>h1').boundingBox();
  measured.stageLabels=await page.locator('.learning-stages .stage-label').evaluateAll(elements=>elements.map(el=>{const r=el.getBoundingClientRect(),b=el.closest('button').getBoundingClientRect();return{text:el.textContent,lines:el.getClientRects().length,left:r.left,right:r.right,top:r.top,bottom:r.bottom,button:{left:b.left,right:b.right,top:b.top,bottom:b.bottom}};}));
 }
 if(phase==='observed')measured.expandControl=await page.locator('[data-investigation-model] .am-expand').evaluate(button=>{
  const box=node=>{const r=node.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};},words=[],walker=document.createTreeWalker(button,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){const node=walker.currentNode;for(const match of node.textContent.matchAll(/\S+/g)){const range=document.createRange();range.setStart(node,match.index);range.setEnd(node,match.index+match[0].length);words.push({text:match[0],lines:[...range.getClientRects()].filter(r=>r.width&&r.height).length,bounds:box(range)});}}
  return{text:button.textContent,font:parseFloat(getComputedStyle(button).fontSize),bounds:box(button),clientWidth:button.clientWidth,scrollWidth:button.scrollWidth,words};
 });
 const overlaps=[];for(let i=0;i<measured.labels.length;i++)for(let j=i+1;j<measured.labels.length;j++){const a=measured.labels[i],b=measured.labels[j];if(Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>1&&Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>1)overlaps.push([a.text,b.text]);}
 evidence.views.push({id,viewport:width,phase,...measured,overlaps});fs.writeFileSync(path.join(out,'measurements.json'),JSON.stringify(evidence,null,2));
 for(const label of measured.labels){assert(label.pixels>=14,id+' actual readable label '+label.text+' at '+width+': '+label.pixels);assert(label.x>=-1&&label.y>=-1&&label.x+label.width<=measured.width+1&&label.y+label.height<=measured.height+1,id+' label in viewBox '+label.text);}
 assert.deepEqual(overlaps,[],id+' label overlaps '+width+' '+phase);
 if(phase==='prediction'){
  assert(measured.bounds.top>=0&&measured.bounds.bottom<=900,id+' initial diagram fits first screen '+width+': '+JSON.stringify(measured.bounds));
  const button=measured.action;assert(button&&button.y>=0&&button.y+button.height<=900,id+' nearest action in first screen '+width+': '+JSON.stringify(button));
  assert.equal(measured.stageLabels.length,4,id+' four readable stages');
  for(const label of measured.stageLabels){assert.equal(label.lines,1,id+' whole stage word '+label.text+' at '+width);assert(label.left>=label.button.left&&label.right<=label.button.right&&label.top>=label.button.top&&label.bottom<=label.button.bottom,id+' stage word stays inside its button '+label.text+' at '+width);}
 }
 if(phase==='observed'){
  const control=measured.expandControl,b=control.bounds;assert.equal(control.text,'Развернуть рисунок');assert(control.font>=14&&b.height>=44,id+' readable research expand control '+width);assert(control.scrollWidth<=control.clientWidth+1,id+' unclipped expand control '+width);assert.deepEqual(control.words.map(w=>w.text),['Развернуть','рисунок']);
  for(const word of control.words){const r=word.bounds;assert.equal(word.lines,1,id+' whole expand word '+word.text+' at '+width);assert(r.left>=b.left&&r.right<=b.right&&r.top>=b.top&&r.bottom<=b.bottom,id+' expand word inside button '+word.text+' at '+width);}
 }
}
async function researchExpansion(page,id,width){
 const button=page.locator('[data-investigation-model] .am-expand');await button.scrollIntoViewIfNeeded();await ready(page);
 // Finish the existing 180 ms input debounce before checking that this purely
 // visual action leaves the saved record byte-for-byte unchanged.
 await page.waitForTimeout(220);
 for(const closeBy of ['button','Escape']){
  const before=await page.evaluate(key=>{const svg=document.querySelector('[data-investigation-model] svg');window.__researchExpandedSvg=svg;return{yaw:svg.dataset.yaw,pitch:svg.dataset.pitch,storage:localStorage.getItem(key),overflow:document.body.style.overflow,x:scrollX,y:scrollY};},KEY);
  await button.click();await ready(page);const full=await page.locator('[data-investigation-model] .am-expanded').evaluate(el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,position:getComputedStyle(el).position,viewportWidth:innerWidth,viewportHeight:innerHeight,overflow:document.body.style.overflow};});
  assert.equal(full.position,'fixed',id+' research expansion is fixed');assert(Math.abs(full.x)<=1&&Math.abs(full.y)<=1&&Math.abs(full.width-full.viewportWidth)<=1&&Math.abs(full.height-full.viewportHeight)<=1,id+' research expansion covers viewport '+width);assert.equal(full.overflow,'hidden');assert.equal(await button.innerText(),'Закрыть рисунок');
  if(closeBy==='Escape')await button.press('Escape');else await button.click();await ready(page);assert.equal(await page.locator('[data-investigation-model] .am-expanded').count(),0);
  const after=await page.evaluate(key=>{const svg=document.querySelector('[data-investigation-model] svg');return{same:svg===window.__researchExpandedSvg,yaw:svg.dataset.yaw,pitch:svg.dataset.pitch,storage:localStorage.getItem(key),overflow:document.body.style.overflow,x:scrollX,y:scrollY};},KEY);
  assert(after.same,id+' expansion retains the actual SVG');for(const field of ['yaw','pitch','storage','overflow'])assert.equal(after[field],before[field],id+' expansion retains '+field);assert(Math.abs(after.x-before.x)<=1&&Math.abs(after.y-before.y)<=1,id+' expansion restores scroll');
  evidence.expansions.push({id,width,closeBy,viewport:full,retained:true});
 }
}
async function experiment(page,u,width){
 const spec=await page.evaluate(id=>StereoInvestigations.specs[id],u.id),before=await state(page,u.id);assert.equal(before.stage,6);assert.equal(before.practiceVersion,2);assert.equal(await page.locator('#answer').count(),0);
 await measure(page,u.id,width,'prediction');await page.screenshot({path:path.join(out,u.id+'-'+width+'-prediction.png')});
 await page.locator('[data-investigation-action=explore]').click();assert.match(await page.locator('[data-investigation-feedback]').innerText(),/Сначала выбери/);assert.equal((await state(page,u.id)).attempts,0);
 await page.locator('[data-investigation-prediction]').selectOption(String(spec.correct));await page.locator('[data-investigation-action=explore]').click();
 const first=M.controls[u.id][0],slider=page.locator('[data-investigation-control="'+first.key+'"]'),oldGeometry=await page.locator('[data-investigation-model] svg').innerHTML();
 await slider.focus();await slider.press(first.value===first.max?'Home':'End');assert.notEqual(await page.locator('[data-investigation-model] svg').innerHTML(),oldGeometry,u.id+' real model action');assert.equal((await state(page,u.id)).investigation.changed,true);
 const observation='Наблюдение '+u.id+' при ширине '+width+': сравнил две конфигурации.';await page.locator('[data-investigation-observation]').fill(observation);
 await page.locator('[data-investigation-answer]').selectOption(String((spec.answer+1)%spec.answers.length));await page.locator('[data-investigation-check] button[type=submit]').click();assert.equal((await state(page,u.id)).investigation.attempts,1);assert.equal((await state(page,u.id)).investigation.completed,false);
 await page.locator('[data-investigation-action=hint]').click();assert.equal((await state(page,u.id)).assisted,false);
 await page.locator('[data-investigation-answer]').selectOption(String(spec.answer));await page.locator('[data-investigation-check] button[type=submit]').click();const learned=await state(page,u.id);assert.equal(learned.investigation.completed,true);assert.equal(learned.investigation.attempts,2);assert.equal(learned.attempts,0);
 await measure(page,u.id,width,'observed');await page.locator('[data-investigation-model]').screenshot({path:path.join(out,u.id+'-'+width+'-observed.png')});
 if(['space','conics-plane'].includes(u.id))await researchExpansion(page,u.id,width);
 await page.reload();assert.equal(await page.locator('[data-investigation-observation]').inputValue(),observation);assert.deepEqual((await state(page,u.id)).investigation.values,learned.investigation.values);assert.equal((await state(page,u.id)).investigation.firstPrediction,spec.correct);
 await page.locator('[data-investigation-action=explain]').click();assert.equal(await page.locator('.topic-explanation').count(),1);await stage(page,2);assert.equal((await state(page,u.id)).assisted,false);await stage(page,4);await page.locator('#task-model svg').waitFor();
 const rec=await state(page,u.id),t=T.make(u.task,rec.seed,rec.practiceVersion,u.id);await page.locator('#answer').fill(A.format(t.a));await page.locator('#answer-form button').click();assert.equal((await state(page,u.id)).independent,1,u.id+' task credit separate from research help');assert.equal((await state(page,u.id)).investigation.completed,true);
 evidence.routes.push({id:u.id,width,prediction:learned.investigation.firstPrediction,values:learned.investigation.values,attempts:learned.investigation.attempts,observation,independent:1});
 await page.locator('[data-action=home]').first().click();
}
(async()=>{
 let browser;const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'stereo-harmonization-offline-'));
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port+'/stereo-course/index.html';
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||process.env.STEREO_CHROMIUM||undefined});
  let exported;
  for(const width of [320,1280]){
   const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',acceptDownloads:true});
   // The entry's own document is allowed; no external script, font, image, or API.
   await context.route('**/*',route=>route.request().resourceType()==='document'&&route.request().url().startsWith(base)?route.continue():route.abort());
   const page=await context.newPage();monitor(page);await page.goto(base);
   for(const u of C.units){await page.locator('[data-unit="'+u.id+'"]').first().click();await experiment(page,u,width);if(evidence.routes.length%13===0)console.log('Research browser routes:',evidence.routes.length);}
   await page.locator('.course-menu>summary').click();const downloading=page.waitForEvent('download');await page.locator('#export-progress').click();const download=await downloading;exported=path.join(out,'progress-'+width+'.json');await download.saveAs(exported);const content=JSON.parse(fs.readFileSync(exported,'utf8'));assert.equal(Object.keys(content.units).length,39);for(const u of C.units){assert.equal(content.units[u.id].investigation.completed,true);assert.equal(content.units[u.id].independent,1);}
   // Two actual tabs: a newer observation must pause the older tab and remain
   // intact even when a stale submit is dispatched programmatically.
   await page.goto(base+'#sections');await page.reload();await stage(page,6);await page.locator('[data-investigation-observation]').fill('Черновик первого окна');
   const second=await context.newPage();monitor(second);await second.goto(base+'#sections');await second.locator('[data-investigation-observation]').fill('Новая запись второго окна');const recent=await second.evaluate(key=>localStorage.getItem(key),KEY);await page.locator('[data-recover-latest]').waitFor();
   const recoveredObservation=page.locator('[data-recovery-drafts] label').filter({hasText:'Наблюдение предметного исследования'}).locator('textarea');
   assert.equal(await recoveredObservation.inputValue(),'Черновик первого окна');assert(await recoveredObservation.evaluate(el=>el.readOnly));await page.locator('[data-investigation-check]').evaluate(el=>el.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));assert.equal(await second.evaluate(key=>localStorage.getItem(key),KEY),recent);await page.locator('[data-recover-latest]').click();assert.equal(await page.locator('[data-investigation-observation]').inputValue(),'Новая запись второго окна');assert.equal(await recoveredObservation.inputValue(),'Черновик первого окна');await second.close();evidence.checks.push('two-tab research CAS '+width);
   await page.goto(base+'#box');await page.reload();await stage(page,4);await page.locator('[data-action=new]').click();const before=await state(page,'box');for(const invalid of ['', '1+', '(1/0)^0', 'sqrt(-4)^0', '0^0']){await page.locator('#answer').fill(invalid);await page.locator('#answer-form button').click();const after=await state(page,'box');assert.equal(after.attempts,before.attempts);assert.equal(after.checked,false);assert.equal(after.assisted,false);}for(const wrong of ['0','1']){await page.locator('#answer').fill(wrong);await page.locator('#answer-form button').click();}assert.match(await page.locator('#feedback').innerText(),/Две содержательные попытки/);evidence.checks.push('input categories preserve first attempt '+width);
   await context.close();
  }
  // Import into a genuinely new context, then open the restored research stage.
  const importedContext=await browser.newContext({viewport:{width:320,height:900}}),imported=await importedContext.newPage();monitor(imported);await imported.goto(base);await imported.locator('#import').setInputFiles(exported);await imported.waitForFunction(key=>Object.keys(JSON.parse(localStorage.getItem(key)||'{"units":{}}').units).length===39,KEY);await imported.locator('[data-unit=sections]').first().click();await stage(imported,6);assert.match(await imported.locator('[data-investigation-observation]').inputValue(),/Наблюдение sections/);evidence.checks.push('download/import into new context');await importedContext.close();
  // A copied entry file works in a context with networking disabled.
  const copy=path.join(temporary,'index.html');fs.writeFileSync(copy,bytes);const offlineContext=await browser.newContext({viewport:{width:320,height:900},offline:true}),offline=await offlineContext.newPage();monitor(offline);await offline.goto('file://'+copy+'#box');await offline.locator('[data-investigation-prediction]').selectOption('1');await offline.locator('[data-investigation-action=explore]').click();await offline.locator('[data-investigation-control=a]').focus();await offline.keyboard.press('End');await offline.locator('[data-investigation-answer]').selectOption('0');await offline.locator('[data-investigation-check] button[type=submit]').click();assert.equal((await state(offline,'box')).investigation.completed,true);await stage(offline,4);const r=await state(offline,'box');await offline.locator('#answer').fill(A.format(T.make('box-diagonal',r.seed,r.practiceVersion).a));await offline.locator('#answer-form button').click();const beforeReload=await state(offline,'box');assert.equal(beforeReload.independent,1);await offline.reload();const restored=await state(offline,'box');assert.equal(restored.investigation.completed,true);assert.deepEqual(retainedWork(restored),retainedWork(beforeReload),'offline reload retains the complete learning record except revision and event log');evidence.checks.push('copied standalone HTML, offline research/task/reload');await offline.screenshot({path:path.join(out,'standalone-offline.png')});await offlineContext.close();
  assert.equal(evidence.expansions.length,8,'planar and spatial research expansion, both close paths and widths');assert.deepEqual(errors,[]);evidence.errors=errors;fs.writeFileSync(path.join(out,'measurements.json'),JSON.stringify(evidence,null,2)+'\n');console.log('STEREO_HARMONIZATION_BROWSER_OK: 78 topic/viewport routes, SVG screen-space labels, readable expand controls, retained fullscreen research, real controls, persistence, independent practice, two tabs, export/import, offline HTML');
 }catch(error){const active=browser?.contexts().flatMap(c=>c.pages()).at(-1);if(active)await active.screenshot({path:path.join(out,'failure.png'),fullPage:true}).catch(()=>{});evidence.failure=error.stack;evidence.errors=errors;fs.writeFileSync(path.join(out,'measurements.json'),JSON.stringify(evidence,null,2)+'\n');console.error(error);process.exitCode=1;}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));fs.rmSync(temporary,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
