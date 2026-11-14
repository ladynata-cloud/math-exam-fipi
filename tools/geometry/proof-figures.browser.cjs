'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),out=path.resolve(process.env.GEOMETRY_FIGURES_EVIDENCE_DIR||path.join(root,'../geometry-figure-evidence'));
const ids=['segments','equality','length','chords-tangent','circle-position','projections','pythagoras'];
const widths=[320,390,1280],height=900;
const stageNames={2:'proof',3:'practice',4:'independent',5:'written'};

async function measureFirstScreen(page,id,stage,width){
  await page.evaluate(async()=>{await document.fonts.ready;scrollTo(0,0);});
  const figure=page.locator('#lesson > .lesson-figure');
  const condition=stage===2?page.locator('#lesson > .callout').first():stage===5?page.locator('#lesson > p').nth(1):page.locator('.task-question');
  await figure.waitFor({state:'visible'});
  const boxes={
    condition:await condition.boundingBox(),
    figure:await figure.boundingBox(),
    svg:await figure.locator('svg').boundingBox()
  };
  for(const [name,box] of Object.entries(boxes)){
    assert(box&&box.y>=0&&box.y+box.height<=height,`${id}/${stage}/${width}: ${name} outside first screen ${JSON.stringify(box)}`);
  }
  assert(boxes.condition.y+boxes.condition.height<=boxes.figure.y,`${id}/${stage}/${width}: figure overlaps condition`);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${id}/${stage}/${width}: horizontal overflow`);
  assert.equal(await figure.getAttribute('data-figure-kind'),stage===2||stage===5?'proof':'practice');
  return boxes;
}

(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const server=http.createServer((req,res)=>{let file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();try{if(fs.statSync(file).isDirectory())file+='/index.html';res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/plain');res.end(fs.readFileSync(file));}catch(_){res.writeHead(404).end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/geometry-course/atlas/';
  let browser,page;const results=[],measurements=[],errors=[];
  try{
    browser=await chromium.launch({executablePath:process.env.GEOMETRY_CHROMIUM||chromium.executablePath(),headless:true,args:['--no-sandbox']});
    for(const width of widths){
      const context=await browser.newContext({viewport:{width,height}});page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
      for(const id of ids){
        await page.goto(base+id+'.html');
        for(const stage of [2,3,4,5]){
          await page.locator(`[data-stage="${stage}"]`).click();
          const boxes=await measureFirstScreen(page,id,stage,width);
          measurements.push({id,width,stage,...boxes});
          await page.screenshot({path:path.join(out,`${id}-${width}-${stageNames[stage]}.png`),fullPage:false});
          if(stage===4){
            const scoring=page.locator('#lesson > details');
            await scoring.locator('summary').click();
            assert.equal(await scoring.getAttribute('open'),'');
            assert.deepEqual(await measureFirstScreen(page,id,stage,width),boxes);
            await scoring.locator('summary').click();
          }
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
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(out,'proof-figures-results.json'),JSON.stringify({results,measurements,errors},null,2)+'\n');
    console.log('GEOMETRY_PROOF_FIGURES_BROWSER_OK',JSON.stringify({scenarios:results.length,measurements:measurements.length,viewportWidths:widths,errors}));
  }catch(e){if(page&&!page.isClosed())await page.screenshot({path:path.join(out,'proof-figures-failure.png'),fullPage:true}).catch(()=>{});console.error(e);process.exitCode=1;}
  finally{if(browser)await browser.close();server.close();}
})();
