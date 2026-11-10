'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),artifacts=path.resolve(process.env.ATANASYAN_AUDIT_ARTIFACTS||path.join(root,'artifacts/atanasyan-audit'));
const samples=['ch2-p2-t2-isosceles-intro','ch2-constr-angle-bisector','ch2-p2-t6-quiz'];
(async()=>{
 fs.mkdirSync(artifacts,{recursive:true});
 const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'application/octet-stream');res.end(fs.readFileSync(file));}catch(_){res.writeHead(404).end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;const results=[];
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.GEOMETRY_CHROMIUM||process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||chromium.executablePath(),args:['--no-sandbox']});
  const base='http://127.0.0.1:'+server.address().port;
  for(const width of [320,1280]){
   const context=await browser.newContext({viewport:{width,height:900},acceptDownloads:true});const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
   for(const id of samples){
    await page.goto(base+'/geometry-course/trainers/'+id+'.html');const notebook=page.locator('#atanasyan-notebook');await notebook.waitFor();
    assert.equal(await notebook.getAttribute('open'),null);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'no new page overflow '+id);
    const original=await page.evaluate(()=>localStorage.getItem('mathExamCourseProgress.v1'));
    await page.locator('#atanasyan-notebook-open').click();const prediction='Проверю, какие элементы даны. '+width;await notebook.locator('[data-note="prediction"]').fill(prediction);
    await notebook.locator('[data-note="reflection"]').fill('Измерение на рисунке помогает заметить связь; затем нужно обоснование.');await notebook.locator('[data-note="next"]').fill('Проверить новое условие без подсказки.');
    assert.equal(await page.evaluate(()=>localStorage.getItem('mathExamCourseProgress.v1')),original,'personal writing preserves legacy record');
    await notebook.locator('[data-checkpoint]').click();assert.match(await notebook.locator('[data-review]').innerText(),/Повторить/);
    if(id!=='ch2-p2-t6-quiz'){
      await page.locator('[onclick="showHint()"]').first().click();assert.match(await notebook.locator('[data-journal]').innerText(),/помощь — 1/);
    }
    const saved=await page.evaluate(id=>JSON.parse(localStorage.getItem('mathExamGeometryNotebook.v1.'+id)),id);assert.equal(Object.hasOwn(saved,'independent'),false);assert.equal(Object.hasOwn(saved,'passed'),false);
    await page.reload();await notebook.locator(':scope > summary').click();assert.equal(await notebook.locator('[data-note="prediction"]').inputValue(),prediction);assert.equal(await notebook.locator('[data-note="next"]').inputValue(),'Проверить новое условие без подсказки.');
    await notebook.scrollIntoViewIfNeeded();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'expanded notebook within page '+id);await page.screenshot({path:path.join(artifacts,'legacy-'+id+'-'+width+'.png'),fullPage:false});
    const downloadPromise=page.waitForEvent('download');await notebook.locator('[data-export]').click();const download=await downloadPromise,exported=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(exported.prediction,prediction);assert.equal(exported.trainer,id);
    const href=await notebook.locator('[data-practice]').getAttribute('href');const response=await page.goto(new URL(href,page.url()).href);assert.equal(response.status(),200);await page.locator('[data-stage="4"]').click();assert.equal(await page.locator('#answer').count(),1);
    results.push({id,width,persistence:true,legacyPreserved:true,reviewCheckpoint:true,download:true,practiceLink:true});
   }
   await page.goto(base+'/geometry-course/trainers/'+samples[0]+'.html?g7-board=1');assert.equal(await page.locator('#atanasyan-notebook').count(),0,'native replay receives no new controls');
   assert.deepEqual(errors,[]);await context.close();
  }
  fs.writeFileSync(path.join(artifacts,'legacy-results.json'),JSON.stringify({status:'PASS',results},null,2));console.log('Atanasyan legacy notebook browser PASS: '+results.length+' journeys, widths 320/1280, native bypass');
 }catch(error){fs.writeFileSync(path.join(artifacts,'legacy-results.json'),JSON.stringify({status:'FAIL',results,error:String(error)},null,2));throw error;}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
