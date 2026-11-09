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
  console.log('EGE_BAZA_MODEL_DISCOVERY_BROWSER_OK: 320/1280, keyboard predictions and ranges, exact third/restoration, preserved final draft, no independent credit for model, stale feedback cleared.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
