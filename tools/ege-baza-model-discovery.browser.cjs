'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..'),shots=process.env.EGE_DISCOVERY_SHOTS;
const server=http.createServer((req,res)=>{try{let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep))throw Error();if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
async function openModel(page){for(const id of ['taskHelp','taskModel'])if(!await page.locator('#'+id).evaluate(el=>el.open))await page.locator('#'+id+'>summary').click();await page.locator('#model').waitFor({state:'visible'});}
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port+'/ege-baza/path/index.html',browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox']});
 try{const page=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));if(shots)fs.mkdirSync(shots,{recursive:true});
  for(const width of [320,1280]){
   await page.setViewportSize({width,height:900});
   for(const id of ['practice-percent-part','scale']){
    await page.goto(url+'#lesson='+id);await page.locator('#new').click();await page.locator('#answer').fill('17/');await openModel(page);
    if(id==='practice-percent-part')await page.locator('[data-base="whole"]').click();
    const prior=await page.evaluate(id=>{const l=PathCourse.state().lessons[id];return {independent:l.independent,answer:id==='scale'?'1/8':String(PathData.task(id,l.seed).model.whole/2)};},id);
    await page.locator('#modelPrediction').fill(prior.answer);await page.locator('#modelPrediction').press('Enter');assert.match(await page.locator('#predictionRead').innerText(),/^Верно/);
    assert.equal(await page.locator('#answer').inputValue(),'17/');assert.equal(await page.evaluate(id=>PathCourse.state().lessons[id].independent,id),prior.independent);
    assert.equal(await page.evaluate(id=>PathCourse.state().lessons[id].help,id),true);
    const state=await page.evaluate(id=>PathCourse.state().lessons[id].taskFirst.model,id);await page.reload();await openModel(page);
    assert.deepEqual(await page.evaluate(id=>PathCourse.state().lessons[id].taskFirst.model,id),state);assert.equal(await page.locator('#modelPrediction').inputValue(),prior.answer);assert.match(await page.locator('#predictionRead').innerText(),/^Верно/);assert.equal(await page.locator('#answer').inputValue(),'17/');
    if(id==='scale'){await page.locator('#thirdHeight').focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>PathCourse.state().lessons.scale.taskFirst.model.cut),1/3);assert.equal(await page.locator('#predictionRead').innerText(),'');await page.reload();await openModel(page);assert.equal(await page.evaluate(()=>PathCourse.state().lessons.scale.taskFirst.model.cut),1/3);}
    else{await page.locator('#percentSlide').focus();await page.keyboard.press('Home');assert.match(await page.locator('#percentRead').innerText(),/^0%/);await page.keyboard.press('End');assert.match(await page.locator('#percentRead').innerText(),/^100%/);assert.equal(await page.locator('#predictionRead').innerText(),'');}
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),id+' mobile overflow');if(shots)await page.screenshot({path:path.join(shots,'model-'+id+'-'+width+'.png'),fullPage:true});
    await page.locator('#modelPrediction').fill('changed');assert.equal(await page.locator('#predictionRead').innerText(),'');
   }
  }
  for(const [id,selector,check,read] of [['practice-fraction-percent','data-share','#checkShares','#modelFeedback'],['practice-ratio-parts','data-ratio','#checkRatio','#ratioRead']]){
   await page.goto(url+'#lesson='+id);await page.locator('#new').click();await openModel(page);const n=await page.evaluate(id=>{const l=PathCourse.state().lessons[id],m=PathData.task(id,l.seed).model;return m.kind==='ratio-parts'?m.a:m.fractions[0][0];},id);
   for(let i=0;i<n;i++)await page.locator(`[${selector}="${i}"]`).click();await page.locator(check).click();assert((await page.locator(read).innerText()).length);await page.locator(`[${selector}="0"]`).click();assert.equal(await page.locator(read).innerText(),'');
  }
  await page.goto(url+'#lesson=practice-digits-multiple');await page.locator('#new').click();await openModel(page);await page.locator('#checkDigits').click();assert((await page.locator('#digitRead').innerText()).length);await page.selectOption('[data-place="0"]','1');assert.equal(await page.locator('#digitRead').innerText(),'');assert.deepEqual(errors,[]);
  // The cabinet bridge is stubbed only at the transport boundary. The real
  // managed controller must continue to emit the older server's model schema.
  await page.route('**/trainers/learning-bridge.js*',route=>route.fulfill({contentType:'text/javascript',body:'window.MathExamLearning={register(api){window.__discoveryManaged=api;window.__discoveryEvents=[];api.subscribe(event=>window.__discoveryEvents.push(structuredClone(event)));}};'}));
  const legacyModel=model=>assert.deepEqual(Object.keys(model).sort(),(model.kind==='solid'?['kind','angle','tilt','cut']:['kind','base','experiment','percent']).sort(),'shared model has only fields accepted before personal discovery');
  for(const width of [320,1280]){
   await page.setViewportSize({width,height:900});
   for(const id of ['scale','practice-percent-whole']){
    await page.goto(url+'?learning=1#lesson='+id);
    await page.evaluate(id=>{const spec={trainerId:'ege-path',contentVersion:1,id,contentId:id,seed:17,task:PathData.task(id,17)};__discoveryManaged.applyState({taskSpec:spec,state:null,readOnly:false});},id);
    await page.locator('[data-stage="1"]').click();
    if(id==='scale'){await page.locator('#halfHeight').click();await page.locator('#thirdHeight').click();assert.equal(await page.evaluate(()=>__discoveryManaged.getState().work.model.cut),1/3);}
    else{await page.locator('[data-base="whole"]').click();await page.locator('#percentSlide').focus();await page.keyboard.press('End');assert.equal(await page.evaluate(()=>__discoveryManaged.getState().work.model.percent),100);}
    assert.equal(await page.locator('#modelPrediction').count(),0);
    const saved=await page.evaluate(()=>__discoveryManaged.getState());legacyModel(saved.work.model);
    for(const model of await page.evaluate(()=>__discoveryEvents.map(event=>event.state.work.model).filter(Boolean)))legacyModel(model);
    await page.reload();await page.evaluate(({id,saved})=>{const spec={trainerId:'ege-path',contentVersion:1,id,contentId:id,seed:17,task:PathData.task(id,17)};__discoveryManaged.applyState({taskSpec:spec,state:saved,readOnly:false});},{id,saved});
    assert.deepEqual(await page.evaluate(()=>__discoveryManaged.getState()),saved);assert.equal(await page.locator('#modelPrediction').count(),0);
   }
   await page.goto(new URL('/trainers/ege-baza-13.html#lesson=scale',url).href);await openModel(page);
   await page.locator('#halfHeight').click();await page.locator('#thirdHeight').click();assert.equal(await page.locator('#modelPrediction').count(),0);
   const board=await page.evaluate(()=>__bazaBoard.getState());legacyModel(board.work.ui.model);assert.equal(board.work.ui.model.cut,1/3);
   await page.reload();await page.evaluate(saved=>__bazaBoard.applyState(saved),board);await openModel(page);
   assert.deepEqual(await page.evaluate(()=>__bazaBoard.getState()),board);assert.equal(await page.locator('#modelPrediction').count(),0);
  }
  assert.deepEqual(errors,[]);
  console.log('EGE_BAZA_MODEL_DISCOVERY_BROWSER_OK: 320/1280 personal predictions, exact third/restoration, preserved final draft, no model credit; managed cabinet and board retain legacy model fields without prediction controls across reload.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
