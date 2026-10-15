'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),out=process.env.GEOMETRY_REBUILD_OUTPUT_DIR||'/tmp/geometry-rebuild-evidence';
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>route.abort());await page.setContent('<!doctype html><html lang="ru"><meta charset="utf-8"><body><main id="main"><div id="host"></div></main></body></html>');
  await page.addStyleTag({path:path.join(ROOT,'ege-baza/path/style.css')});
  for(const file of ['data','practice','practice-view','models','grade7-geometry-rebuild-base','grade7-geometry-rebuild-foundations','grade7-geometry-rebuild-triangles','grade7-geometry-rebuild-relations','grade7-geometry-rebuild-workbook','grade7-geometry-core-models'])await page.addScriptTag({path:path.join(ROOT,'ege-baza/path/'+file+'.js')});
  await page.addScriptTag({path:path.join(ROOT,'learning/catalog.js')});await page.addScriptTag({path:path.join(ROOT,'learning/grade7-route-map.js')});await page.addScriptTag({path:path.join(ROOT,'learning/route.js')});
  const samples=['photo-proof-1','photo-proof-2','photo-proof-3','construct-triangle-lines','construct-midpoint-bisector','angle-minutes','review-17'];let checkedSteps=0;
  for(const id of samples){
   await page.evaluate(id=>{window.task=PathData.task('grade7-r-'+id,1);window.changes=[];window.session=PathModels.mount(document.getElementById('host'),task,{onChange:s=>changes.push(s)});},id);
   const getState=()=>page.evaluate(()=>session.getState());
   const initial=await getState();assert.equal(initial.revealed,0);
   await page.locator('[data-active-check]').click();assert.equal((await getState()).revealed,0);
   await page.locator('[data-active-hint]').click();assert.equal((await getState()).revealed,0,'hint never passes a step');
   while(await page.locator('[data-hunt-check]:not([disabled])').count()){
    const target=await page.locator('.geometry-mission').first().locator('strong').textContent();
    const targetId=await page.evaluate(target=>task.model.elements.find(e=>e.label===target).id,target);
    await page.locator('[data-core-select]').filter({hasNotText:target}).first().click();
    // Selecting the element can be done directly on the SVG or by keyboard.
    const svgPart=page.locator('[data-core-drawing] [data-core-part="'+targetId+'"]');
    if(await svgPart.count())await svgPart.first().evaluate(node=>node.dispatchEvent(new MouseEvent('click',{bubbles:true})));
    else await page.locator('[data-core-select="'+targetId+'"]').click();
    assert.equal((await getState()).selected,targetId);
    await page.locator('[data-hunt-check]').click();
   }
   assert.match(await page.locator('.geometry-token').textContent(),/Чертёж прочитан/);
   const builds=await page.evaluate(()=>task.params.requiredBuild||[]);
   if(builds.length){
    await page.locator('[data-build-check]').click();assert.match(await page.locator('[data-build-feedback]').textContent(),/Убери лишние/);
    for(const id of builds)await page.locator('[data-core-build="'+id+'"]').click();
    await page.locator('[data-build-check]').click();assert.match(await page.locator('[data-build-feedback]').textContent(),/соответствует/);
   }
   const steps=await page.evaluate(()=>task.steps);
   for(const [index,step]of steps.entries()){
    if(step.choices){
     await page.locator('[data-active-choice="'+step.choices.find(c=>c.value!==step.a).value+'"]').click();
    }else await page.locator('[data-active-answer]').fill('999999999');
    await page.locator('[data-active-check]').click();assert.equal((await getState()).revealed,index,'wrong answer cannot advance');
    assert((await page.locator('[data-active-feedback]').textContent()).length>20);
    if(step.choices)await page.locator('[data-active-choice="'+step.a+'"]').click();else await page.locator('[data-active-answer]').fill(step.a);
    await page.locator('[data-active-check]').click();assert.equal((await getState()).revealed,index+1);checkedSteps++;
   }
   assert.equal(await page.locator('.geometry-proof-board li').count(),steps.length);assert.match(await page.locator('.geometry-finish').textContent(),/Рассуждение собрано/);
   const saved=await getState();
   await page.evaluate(()=>{window.session=PathModels.mount(document.getElementById('host'),task,{state:session.getState(),readOnly:true,onChange:s=>changes.push(s)});});
   assert.deepEqual(await getState(),saved,'all accumulated reasoning and constructions restore');
   assert.equal(await page.locator('#host button:not([disabled])').count(),0);
   await page.locator('[data-core-clear]').evaluate(b=>b.click());assert.deepEqual(await getState(),saved,'read-only rejects programmatic events');
   await page.evaluate(()=>session.setReadOnly(false));await page.locator('[data-core-clear]').click();assert.equal((await getState()).revealed,0);
   await page.evaluate(()=>document.getElementById('host').inert=true);await page.locator('[data-core-next]').evaluate(b=>b.click());assert.equal((await getState()).revealed,0);await page.evaluate(()=>document.getElementById('host').inert=false);
   for(const width of [320,390,1280]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),id+' fits '+width);}
   await page.setViewportSize({width:390,height:844});
   if(id==='photo-proof-1'||id==='construct-triangle-lines')await page.screenshot({path:path.join(out,'active-'+id+'-390.png'),fullPage:true});
  }
  // Both routes use the real cabinet mount and the existing openContent handler.
  await page.addStyleTag({path:path.join(ROOT,'learning/style.css')});await page.addStyleTag({path:path.join(ROOT,'learning/route.css')});
  await page.evaluate(()=>{document.getElementById('host').innerHTML='';window.opened=[];window.routeContext={catalog:LearningCatalog,account:{id:'synthetic-pupil'},attempts:[],labels:{},openContent:async id=>opened.push(id),api:async()=>({plan:{items:[]}})};window.disposeRoute=LearningRoute.mount(document.getElementById('host'),routeContext);});
  assert.equal(await page.locator('[data-geometry-track]').count(),2);
  const proof=page.locator('[data-geometry-track="proofs"]'),book=page.locator('[data-geometry-track="workbook"]');
  assert.equal(await book.locator('[data-route-item]').count(),103);assert.equal(await book.locator('[data-route-item*="photo-proof-"]').count(),0);
  assert.equal(await proof.locator('[data-route-item*="photo-proof-"]').count(),3);
  await proof.locator('summary').first().click();await proof.locator('[data-route-item="path:grade7-r-photo-proof-1"]').click();assert.deepEqual(await page.evaluate(()=>opened),['path:grade7-r-photo-proof-1']);
  await page.locator('[data-study-track="geometry"]').click();await page.locator('[data-study-course="geometry"] [data-study-mode="check"]').click();
  await page.evaluate(()=>{disposeRoute();window.disposeRoute=LearningRoute.mount(document.getElementById('host'),routeContext);});
  assert(await proof.evaluate(node=>node.open),'opened proof route survives refresh');assert(await page.locator('[data-study-course="geometry"]').isVisible());assert.equal(await page.locator('[data-study-course="geometry"]').getAttribute('data-study-view'),'check');assert.deepEqual(await page.evaluate(()=>opened),['path:grade7-r-photo-proof-1'],'restoring navigation never opens attempts');
  for(const width of [320,1280]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'two routes fit '+width);await page.locator('.geometry-tracks').screenshot({path:path.join(out,'two-geometry-routes-'+width+'.png')});}
  await page.evaluate(()=>{disposeRoute();LearningRoute.mount(document.getElementById('host'),{...routeContext,account:{id:'another-synthetic-pupil'}});});assert.equal(await proof.evaluate(node=>node.open),false,'navigation view is not inherited by a different account');
  assert.deepEqual(errors,[]);console.log(`GRADE7_ACTIVE_PRACTICE_BROWSER_OK: ${samples.length} interactive families, ${checkedSteps} checked steps, 320/390/1280px, diagram hunts, construction checks, wrong answers, hints, restore, read-only, two routes and real navigation handler.`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
