'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/oge18-steps-pan');
(async()=>{
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}res.setHeader('content-type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'application/octet-stream');fs.createReadStream(file).pipe(res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=process.env.OGE18_LIVE_BASE||'http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,...process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}: {}});
 fs.mkdirSync(out,{recursive:true});
 const context=await browser.newContext();await context.addInitScript(()=>localStorage.clear());
 try{
  for(const width of [320,360,1280]){
   const page=await context.newPage(),errors=[];await page.setViewportSize({width,height:900});page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/trainers/oge-task18-grid.html');
   await page.evaluate(()=>window.eval('TR.task=archTask(ARCHIVE.find(t=>t.id===89));TR.done=false;TR.shown=false;drawTrain();'));
   const figure=page.locator('.ocg-primary-figure').first(),nav=figure.locator('xpath=preceding-sibling::*[1]'),left=nav.locator('[data-geometry-pan="left"]'),right=nav.locator('[data-geometry-pan="right"]');
   await nav.waitFor({state:width<440?'visible':'hidden'});
   if(width<440){
    assert.equal(await left.isDisabled(),true);assert.equal(await right.isDisabled(),false);
    while(!await right.isDisabled())await right.click();
    assert.ok(await figure.evaluate(e=>e.scrollLeft>=e.scrollWidth-e.clientWidth-1));
    while(!await left.isDisabled())await left.click();assert.ok(await figure.evaluate(e=>e.scrollLeft<=1));
    await figure.focus();await figure.press('ArrowRight');await page.waitForFunction(()=>document.querySelector('.ocg-primary-figure').scrollLeft>0);
    await page.setViewportSize({width:1280,height:900});await nav.waitFor({state:'hidden'});
    await page.setViewportSize({width,height:900});await nav.waitFor({state:'visible'});
   }
   await page.locator('#ansIn').fill('1,5');await page.getByRole('button',{name:'Разобрать по шагам',exact:true}).click();
   assert.equal(await page.locator('#courseHintPanel>h3').textContent(),'Разбор этой задачи по шагам');
   for(let i=1;i<=6;i++){await page.locator('#hintBtn').click();assert.equal(await page.locator('#task18Steps .step').count(),i);assert.equal(await page.locator('#ansIn').inputValue(),'1,5');}
   assert.equal(await page.locator('#hintBtn').isDisabled(),true);assert.match(await page.locator('#task18Steps').textContent(),/8 − 5 = 3/);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
   await page.screenshot({path:path.join(out,`steps-${width}.png`),fullPage:true});
   const lab=page.locator('[data-geometry-model]');await lab.locator('summary').first().click();
   const modelFigure=lab.locator('.ocg-figure-scroll'),modelNav=modelFigure.locator('xpath=preceding-sibling::*[1]');
   const overflow=await modelFigure.evaluate(e=>e.scrollWidth>e.clientWidth+2);await modelNav.waitFor({state:overflow?'visible':'hidden'});
   if(overflow){await modelNav.locator('[data-geometry-pan="right"]').click();assert.ok(await modelFigure.evaluate(e=>e.scrollLeft>0));}
   await page.getByRole('button',{name:'Вернуться к моему ответу',exact:true}).click();await page.locator('#chkBtn').click();
   assert.match(await page.locator('#fb').textContent(),/Верно/);assert.match(await page.locator('#fb').textContent(),/подсказкой/);
   await page.locator('#nextBtn').click();assert.equal(await page.locator('#task18Steps .step').count(),0);assert.equal(await page.locator('#courseHintPanel').isVisible(),false);
   assert.deepEqual(errors,[]);await page.close();
  }
  for(const width of [320,1280]){
   const page=await context.newPage();await page.setViewportSize({width,height:900});const errors=[];page.on('pageerror',e=>errors.push(e.message));
   // Fixed archive cards exercise cumulative multi-step solutions, independently of random task selection.
   for(const n of [16,17]){
    await page.goto(base+'/trainers/oge-task'+n+'-'+(n===16?'circle':'quadrilaterals')+'.html');
    const fixture=await page.evaluate(n=>window.eval(n===16
     ?'(()=>{const record=ARCHIVE.find(t=>t.nums.includes("311956"));trTask=buildArchive(record);trAtt=2;trDone=false;trMissed=false;renderTrain();return {id:record.nums[0],sub:trTask.k,params:trTask.p,answer:trTask.ans,steps:trTask.sol.length};})()'
     :'(()=>{const record=ARCHIVE.find(t=>t.nums.includes("356728"));CUR=build(record.sub,record.p,{gen:false,srcLab:srcLabel(record,true)});renderTrain(false);return {id:record.nums[0],sub:CUR.key,params:CUR.p,answer:CUR.ans,steps:CUR.sol.length};})()'),n);
    assert.deepEqual(fixture,n===16?{id:'311956',sub:'insCen',params:{c:48},answer:24,steps:3}:{id:'356728',sub:'sqDiag',params:{k:7},answer:14,steps:2});
    console.log(JSON.stringify({marker:'OGE_STEPS_FIXTURE',task:n,width,...fixture}));
    await page.locator('#ans').fill('17');await page.locator('#courseHintToggle').click();
    assert.equal(await page.locator('#courseHintPanel>h3').textContent(),'Разбор этой задачи по шагам');
    const next=page.locator(n===16?'#hintBtn':'#stepH'),steps=page.locator(n===16?'#task16Steps .step':'#ssol .step');
    assert.equal(await steps.count(),0);
    for(let i=1;i<=fixture.steps;i++){assert.equal(await next.isDisabled(),false);await next.click();assert.equal(await steps.count(),i);assert.equal(await page.locator('#ans').inputValue(),'17');}
    assert.equal(await next.isDisabled(),true);
    assert.equal(await page.locator('#ans').inputValue(),'17');assert.ok(await page.locator(n===16?'#task16Steps .step':'#ssol .step').count()>=2);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    await page.screenshot({path:path.join(out,`steps-task${n}-${width}.png`),fullPage:true});
   }
   // The rhombus area formula legitimately completes in one step; it has a separate stopping contract.
   await page.goto(base+'/trainers/oge-task17-quadrilaterals.html');
   const single=await page.evaluate(()=>window.eval('(()=>{const record=ARCHIVE.find(t=>t.nums.includes("П-Рм10"));CUR=build(record.sub,record.p,{gen:false,srcLab:srcLabel(record,true)});renderTrain(false);return {id:record.nums[0],sub:CUR.key,params:CUR.p,answer:CUR.ans,steps:CUR.sol.length};})()'));
   assert.deepEqual(single,{id:'П-Рм10',sub:'rhombAreaDiag',params:{d1:14,d2:6},answer:42,steps:1});
   console.log(JSON.stringify({marker:'OGE_STEPS_FIXTURE',task:17,width,...single}));
   await page.locator('#ans').fill('17');await page.locator('#courseHintToggle').click();
   assert.equal(await page.locator('#courseHintPanel>h3').textContent(),'Разбор этой задачи по шагам');
   const singleNext=page.locator('#stepH'),singleSteps=page.locator('#ssol .step');
   assert.equal(await singleSteps.count(),0);assert.equal(await singleNext.isDisabled(),false);
   await singleNext.click();
   assert.equal(await singleSteps.count(),1);assert.equal(await singleNext.isDisabled(),true);assert.equal(await page.locator('#ans').inputValue(),'17');
   assert.equal(await singleSteps.locator('b').textContent(),'42');assert.match(await page.locator('#fb').textContent(),/разобранное, а не решённое/);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
   await page.screenshot({path:path.join(out,`steps-task17-single-${width}.png`),fullPage:true});
   await page.goto(base+'/trainers/oge13-inequalities-series.html');
   for(const family of ['linear','quad','graph','special','systems']){
    await page.evaluate(family=>window.eval('jumpTask('+JSON.stringify(family+':0')+')'),family);await page.locator('#hintToggle').click();
    const next=page.locator('#task13NextStep');while(!await next.isDisabled())await next.click();
    assert.ok(await page.locator('#task13WorkedSteps section').count()>=4);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    await page.screenshot({path:path.join(out,`steps-task13-${family}-${width}.png`),fullPage:true});
   }
   await page.goto(base+'/trainers/task19-trainer.html?card=prev-001');await page.locator('#btnFalse').click();
   assert.equal(await page.locator('.task19-reason-step').count(),3);assert.match(await page.locator('#answerExplanation').textContent(),/40° и 140°/);
   await page.screenshot({path:path.join(out,`steps-task19-${width}.png`),fullPage:true});assert.deepEqual(errors,[]);await page.close();
  }
  console.log('OGE18_STEPS_PAN_OK: 320, 360, 1280; pan endpoints, resize, model, six retained steps; №13/16/17/19 mobile and desktop explanations');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
