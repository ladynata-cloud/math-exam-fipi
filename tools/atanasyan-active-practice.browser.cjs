'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),artifacts=path.resolve(process.env.ATANASYAN_AUDIT_ARTIFACTS||path.join(root,'artifacts/atanasyan-audit'));
const ids=['ch1-p6-t2-angle-problems','ch2-p2-t0-three-cevians','ch3-p1-t2-eight-angles','ch4-p4-t3-construct-sss'];
(async()=>{
 fs.mkdirSync(artifacts,{recursive:true});
 const server=http.createServer((req,res)=>{let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'application/octet-stream');res.end(fs.readFileSync(file));}catch(_){res.writeHead(404).end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;const results=[];
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.GEOMETRY_CHROMIUM||process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||chromium.executablePath(),args:['--no-sandbox']});const base='http://127.0.0.1:'+server.address().port;
  for(const width of [320,1280]){
   const context=await browser.newContext({viewport:{width,height:900},acceptDownloads:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   for(const id of ids){
    await page.goto(base+'/geometry-course/trainers/'+id+'.html');const panel=page.locator('#atanasyan-active-practice');await panel.waitFor();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'old trainer with new toolbar has no overflow '+id);
    assert.ok(await page.locator('.app canvas,.app #taskText,.app #qtext,.app .task,.app #task').count(),'retained task/model remains accessible');
    const config=await page.locator('#atanasyan-active-practice-config').textContent().then(JSON.parse),first=config.tasks[0],key='mathExamGeometryTransfer.v1.'+id;
    const old=await page.evaluate(()=>localStorage.getItem('mathExamCourseProgress.v1'));
    await page.locator('#atanasyan-active-practice-open').click();assert.equal(await panel.getAttribute('open'),'');assert.equal(await page.evaluate(()=>document.activeElement.tagName),'H2');
    assert.equal(await panel.locator('.ap-problem').innerText(),first.prompt);if(first.figure){assert.ok(await panel.locator('svg').count()>=1,'authored exact figure visible');const box=await panel.locator('.ap-figure').boundingBox();assert.ok(box.y>=0&&box.y+box.height<900,'initial exact figure in opened viewport');await page.screenshot({path:path.join(artifacts,'active-'+id+'-first-'+width+'.png'),fullPage:false});}
    await panel.locator('[data-practice-form] button').click();let state=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);assert.equal(state.records[state.active].attempts,0);
    async function answer(task,value){if(task.answer.kind==='number')await panel.locator('#ap-answer').fill(String(value));else await panel.getByLabel(task.answer.options.find(o=>o.value===value).label,{exact:true}).check();await panel.locator('[data-practice-form] button').click();}
    const wrong=first.answer.kind==='number'?first.answer.value+1:first.answer.options.find(o=>o.value!==first.answer.value).value;
    await answer(first,wrong);assert.equal(await panel.locator('[data-practice-hint]').isDisabled(),true);await answer(first,first.answer.kind==='number'?first.answer.value+2:wrong);assert.equal(await panel.locator('[data-practice-hint]').isDisabled(),false);
    await panel.locator('[data-practice-hint]').click();assert.ok((await panel.locator('.ap-help').innerText()).includes(first.hint));await answer(first,first.answer.value);
    state=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);assert.equal(state.records[state.active].outcome,'assisted');assert.equal(state.credits.length,0);
    await panel.locator('[data-practice-next]').click();const next=config.tasks[1];assert.notEqual(next.prompt,first.prompt,'mathematically different new condition');assert.equal(await panel.locator('.ap-problem').innerText(),next.prompt);assert.equal(await panel.locator('.ap-help').count(),0);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'active mathematical practice fits width');
    const figure=next.figure?await panel.locator('.ap-figure').boundingBox():null,prompt=await panel.locator('.ap-problem').boundingBox();assert.ok(prompt.y>=0&&prompt.y+prompt.height<900,'condition in opened first viewport');if(figure)assert.ok(figure.y>=0&&figure.y+figure.height<900,'figure in opened first viewport');
    await page.screenshot({path:path.join(artifacts,'active-'+id+'-'+width+'.png'),fullPage:false});
    await answer(next,next.answer.value);state=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);assert.equal(state.records[state.active].outcome,'independent');assert.equal(state.credits.length,1);
    assert.equal(await page.evaluate(()=>localStorage.getItem('mathExamCourseProgress.v1')),old,'new problem never changes old scores');
    await page.reload();await page.locator('#atanasyan-active-practice-open').click();assert.equal(await panel.locator('.ap-problem').innerText(),next.prompt);state=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);assert.equal(state.credits.length,1);
    await panel.locator('[data-practice-repeat]').click();await answer(next,next.answer.value);state=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);assert.equal(state.records[state.active].outcome,'repeated');assert.equal(state.credits.length,1);
    const downloadPromise=page.waitForEvent('download');await panel.locator('[data-practice-export]').click();const download=await downloadPromise,exported=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(exported.records[exported.active].condition.prompt,next.prompt);assert.equal(exported.credits.length,1);assert.ok(exported.records[Object.keys(exported.records)[0]].history.some(e=>e.type==='hint'));
    results.push({id,width,helpSeparated:true,freshIndependent:true,knownRepeat:true,persistence:true,oldCoreProgressPreserved:true,figureInOpenedViewport:!!next.figure,export:true});
   }
   await page.goto(base+'/geometry-course/trainers/'+ids[0]+'.html?g7-board=1');assert.equal(await page.locator('#atanasyan-active-practice').count(),0);assert.equal(await page.locator('#atanasyan-active-practice-open').count(),0);assert.deepEqual(errors,[]);await context.close();
  }
  fs.writeFileSync(path.join(artifacts,'active-practice-results.json'),JSON.stringify({status:'PASS',results},null,2));console.log('Atanasyan active practice browser PASS: '+results.length+' real-problem journeys at320/1280, native bypass');
 }catch(error){fs.writeFileSync(path.join(artifacts,'active-practice-results.json'),JSON.stringify({status:'FAIL',results,error:String(error)},null,2));throw error;}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
