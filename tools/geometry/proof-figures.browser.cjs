'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),out=path.resolve(process.env.GEOMETRY_FIGURES_EVIDENCE_DIR||path.join(root,'../geometry-figure-evidence'));
const ids=['segments','equality','length','chords-tangent','circle-position','projections','pythagoras'];
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const server=http.createServer((req,res)=>{let file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();try{if(fs.statSync(file).isDirectory())file+='/index.html';res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/plain');res.end(fs.readFileSync(file));}catch(_){res.writeHead(404).end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/geometry-course/atlas/';
  let browser,page;const results=[],errors=[];
  try{
    browser=await chromium.launch({executablePath:process.env.GEOMETRY_CHROMIUM||chromium.executablePath(),headless:true,args:['--no-sandbox']});
    for(const width of [320,1280]){
      const context=await browser.newContext({viewport:{width,height:900}});page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
      for(const id of ids){
        await page.goto(base+id+'.html');
        for(const stage of [2,3,4,5]){
          await page.locator(`[data-stage="${stage}"]`).click();await page.evaluate(()=>scrollTo(0,0));
          const figure=page.locator('#lesson > .lesson-figure');await figure.waitFor({state:'visible'});const box=await figure.boundingBox();
          const condition=stage===2?page.locator('#lesson > .callout').first():stage===5?page.locator('#lesson > p').nth(1):page.locator('.task-question');
          const given=await condition.boundingBox();assert(given&&given.y>=0&&given.y+given.height<=900,`${id}/${stage}/${width}: condition outside first screen`);
          assert(box&&box.y>=0&&box.y+box.height<=900,`${id}/${stage}/${width}: figure outside first screen ${JSON.stringify(box)}`);
          assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${id}/${stage}/${width}: horizontal overflow`);
          assert.equal(await figure.getAttribute('data-figure-kind'),stage===2||stage===5?'proof':'practice');
          if(stage===2||stage===3)await page.screenshot({path:path.join(out,`${id}-${width}-${stage===2?'proof':'practice'}.png`),fullPage:false});
        }
        await page.locator('[data-stage="2"]').click();await page.locator('[data-proof="s1"]').click();
        assert.equal(await page.locator('#reason .lesson-figure').getAttribute('data-figure-step'),'1');
        await page.locator('#reason-choice').selectOption('yes');await page.locator('[data-action="reason-check"]').click();await page.reload();
        assert.equal(await page.locator('#lesson > .lesson-figure').getAttribute('data-figure-step'),'1');
        await page.locator('[data-stage="3"]').click();await page.locator('#answer').fill('123');await page.reload();assert.equal(await page.locator('#answer').inputValue(),'123');
        await page.locator('[data-stage="4"]').click();const current=await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem(GeoStore.KEY)).units[COURSE_CONFIG.unit.id];return {before:s.independent,question:GeoTasks.task(COURSE_CONFIG.unit.calc,s.seed).question,answer:GeoTasks.format(GeoTasks.task(COURSE_CONFIG.unit.calc,s.seed).answer)};});
        assert.equal(await page.locator('.task-question').innerText(),current.question);await page.locator('#answer').fill(current.answer);await page.locator('#answer-form button').click();
        assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(GeoStore.KEY)).units[COURSE_CONFIG.unit.id].independent),current.before+1);
        await page.locator('[data-stage="5"]').click();const text='Дано, построение и основание каждого перехода.';await page.locator('#written').fill(text);await page.reload();assert.equal(await page.locator('#written').inputValue(),text);assert.equal(await page.locator('#lesson > .lesson-figure').getAttribute('data-figure-step'),'0');
        results.push({id,width,proof:true,practice:true,written:true,reload:true,firstScreen:true});
      }
      await page.goto(base+'midline.html');for(const stage of [2,3,4,5]){await page.locator(`[data-stage="${stage}"]`).click();assert.equal(await page.locator('#lesson > .midline-diagram').count(),1);assert.equal(await page.locator('.lesson-figure').count(),0);}
      await context.close();
    }
    assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'proof-figures-results.json'),JSON.stringify({results,errors},null,2)+'\n');console.log('GEOMETRY_PROOF_FIGURES_BROWSER_OK',JSON.stringify({scenarios:results.length,viewportWidths:[320,1280],errors}));
  }catch(e){if(page&&!page.isClosed())await page.screenshot({path:path.join(out,'proof-figures-failure.png'),fullPage:true}).catch(()=>{});console.error(e);process.exitCode=1;}
  finally{if(browser)await browser.close();server.close();}
})();
