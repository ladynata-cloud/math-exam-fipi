'use strict';
// Synthetic, offline cabinet navigation. No account, credentials or service writes.
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const page=await browser.newPage({viewport:{width:320,height:900}}),errors=[],requests=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>{requests.push(route.request().url());return route.abort();});
  // Include the mixed trainer/cabinet styles used by the active-practice gate.
  // The reused host class is intentionally retained to exercise narrow layouts.
  await page.setContent('<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body><main id="main"><div id="host" class="geometry-active-host"></div></main></body></html>');
  for(const file of ['ege-baza/path/style.css','ege-baza/path/geometry-journey.css','learning/style.css','learning/route.css'])await page.addStyleTag({path:path.join(ROOT,file)});
  for(const file of ['learning/catalog.js','learning/grade7-route-map.js','learning/route.js'])await page.addScriptTag({path:path.join(ROOT,file)});
  await page.evaluate(()=>{
   window.opened=[];window.requested=[];
   window.context={catalog:LearningCatalog,account:{id:'synthetic-pupil'},attempts:[],labels:{started:'Начато',hinted:'Решено с помощью'},
    openContent:async(id,options)=>opened.push({id,options}),
    api:async endpoint=>{requested.push(endpoint);return endpoint==='/progress'?{progress:[]}:{plan:{items:[]}};}};
   window.cleanup=LearningRoute.mount(document.getElementById('host'),context);
  });
  await page.locator('[data-geometry-start]').first().waitFor();
  assert.equal(await page.locator('[data-geometry-start]').count(),2);
  assert.deepEqual(await page.evaluate(()=>requested.sort()),['/plan','/progress']);
  assert.match(await page.locator('[data-geometry-next="proofs"]').innerText(),/0 \/ 15/);
  assert.match(await page.locator('[data-geometry-next="workbook"]').innerText(),/0 \/ 103/);
  await page.locator('[data-geometry-start]').first().click();
  assert.deepEqual(await page.evaluate(()=>opened.map(value=>value.id)),['path:grade7-r-triangle-elements']);
  assert.equal(await page.evaluate(()=>opened[0].options.fresh),undefined,'The route CTA uses the existing resume behavior');

  await page.locator('[data-geometry-track="proofs"]>summary').click();
  await page.locator('[data-geometry-extra]>summary').click();
  await page.locator('[data-geometry-track="workbook"]>summary').click();
  await page.locator('[data-geometry-section="1"]>summary').click();
  await page.locator('[data-study-track="geometry"]').click();
  await page.locator('[data-study-course="geometry"] [data-study-mode="check"]').click();
  await page.evaluate(()=>{cleanup();window.cleanup=LearningRoute.mount(document.getElementById('host'),context);});
  await page.locator('[data-geometry-start]').first().waitFor();
  assert(await page.locator('[data-geometry-extra]').evaluate(node=>node.open),'Additional practice stays open after refresh');
  assert(await page.locator('[data-geometry-section="1"]').evaluate(node=>node.open),'Workbook topic stays open after refresh');
  assert.equal(await page.locator('[data-geometry-track="workbook"] [data-route-item]').count(),103);
  for(const width of [320,390,1280]){
   await page.setViewportSize({width,height:900});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Route fits '+width+'px without horizontal scroll');
  }
  // Full-history summaries retain completed content absent from recent attempts.
  await page.evaluate(()=>{
   cleanup();const ids=LearningRoute.geometryTrackGroups(LearningCatalog).proofs;
   const record=(id,outcome,completed,updatedAt)=>{const item=LearningCatalog.get(id);return {trainerId:item.trainerId,contentId:item.contentId,completed,latest:{id:'saved-'+id,outcome,updatedAt}};};
   window.savedProgress=[record(ids[0],'hinted',true,'2020-01-01T00:00:00Z'),record(ids[4],'started',false,'2026-10-16T00:00:00Z')];
   window.cleanup=LearningRoute.mount(document.getElementById('host'),{...context,api:async endpoint=>endpoint==='/progress'?{progress:savedProgress}:{plan:{items:[]}}});
  });
  await page.waitForFunction(()=>document.querySelector('[data-geometry-next="proofs"]')?.textContent.includes('1 / 15'));
  const resume=page.locator('[data-geometry-next="proofs"] [data-geometry-start]');
  assert.equal(await resume.getAttribute('data-geometry-start'),'path:grade7-r-triangle-proof-correspondence');
  assert.match(await resume.innerText(),/Продолжить/);
  await resume.click();
  assert.equal(await page.evaluate(()=>opened.at(-1).id),'path:grade7-r-triangle-proof-correspondence');
  assert.match(await page.locator('[data-geometry-track="proofs"] [data-route-status="path:grade7-r-triangle-elements"]').innerText(),/Есть завершённый вариант/);

  // A late response for a disposed account must not replace the new account's UI.
  await page.evaluate(()=>{
   cleanup();window.oldProgress=new Promise(resolve=>window.resolveOld=resolve);
   window.cleanup=LearningRoute.mount(document.getElementById('host'),{...context,api:async endpoint=>endpoint==='/progress'?oldProgress:{plan:{items:[]}}});
   cleanup();window.cleanup=LearningRoute.mount(document.getElementById('host'),{...context,account:{id:'synthetic-other-pupil'}});
   resolveOld({progress:LearningCatalog.items.filter(item=>item.geometryRebuild).map(item=>({trainerId:item.trainerId,contentId:item.contentId,completed:true,latest:{outcome:'hinted'}}))});
  });
  await page.waitForFunction(()=>document.querySelector('[data-geometry-next="proofs"]')?.textContent.includes('0 / 15'));
  assert(!await page.locator('[data-geometry-track="proofs"]').evaluate(node=>node.open));
  assert(!await page.locator('[data-geometry-extra]').evaluate(node=>node.open));
  assert(!await page.locator('[data-geometry-section="1"]').evaluate(node=>node.open));
  assert.equal(await page.evaluate(()=>opened.length),2,'Restoring and loading progress never create attempts');

  // Failure is shown as unavailable, not as zeroed achievements; retry is read-only.
  await page.evaluate(()=>{
   cleanup();window.progressTries=0;
   window.cleanup=LearningRoute.mount(document.getElementById('host'),{...context,api:async endpoint=>{
    if(endpoint!=='/progress')return {plan:{items:[]}};
    if(++progressTries===1)throw Error('synthetic-offline');return {progress:savedProgress};
   }});
  });
  await page.locator('[data-geometry-retry]').first().waitFor();
  assert.equal(await page.locator('[data-geometry-next] progress').count(),0);
  assert.match(await page.locator('[data-geometry-next="proofs"]').innerText(),/пока не загрузился/);
  await page.locator('[data-geometry-retry]').first().click();
  await page.waitForFunction(()=>document.querySelector('[data-geometry-next="proofs"]')?.textContent.includes('1 / 15'));
  assert.equal(await page.evaluate(()=>opened.length),2);
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  console.log('GRADE7_GEOMETRY_JOURNEY_BROWSER_OK: both CTA, full-history progress, 320/390/1280px, saved details, delayed response account isolation, read-only retry.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
