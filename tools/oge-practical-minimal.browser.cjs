'use strict';
/* Run with Playwright's installed Chromium. Covers actual layouts, keyboard and retained scenario data. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),fallback=process.env.OGE_SOURCE_ROOT||root;
const output=process.env.PRACTICAL_SCREENSHOT_DIR||path.join(root,'artifacts/oge-practical-minimal');
const names=['practice-1-5-map.html','practice-1-5-roads-grid.html','practice-1-5-roads-schema.html','practice-1-5-tires.html','practice-1-5-stoves.html','practice-1-5-land-plots.html','practice-1-5-apartments.html','practice-1-5-tariffs.html','practice-1-5-paper-sheets.html','percent-table-trainer.html','practice-1-5-plan-reading.html','practice-1-5-entry-diagnostic-2026.html','practice-1-5-routes-checkpoint-2026.html'];
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.png':'image/png'};
const server=http.createServer((req,res)=>{let p;try{p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}for(const base of [root,fallback]){const f=path.resolve(base,'.'+p);if(!f.startsWith(base+path.sep))continue;if(fs.existsSync(f)&&fs.statSync(f).isFile()){res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));return;}}res.writeHead(404).end('not found');});
let browser;
async function reveal(locator){
 // Open the real native details by keyboard, from outer to inner.
 const ids=await locator.evaluate(el=>{const ds=[];for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS'&&!p.open){if(!p.id)p.id='browser-details-'+Math.random().toString(36).slice(2);ds.unshift(p.id);}return ds;});
 for(const id of ids){const summary=locator.page().locator('#'+id+'>summary');await summary.focus();await summary.press('Enter');}
}
async function hitTargets(page,label){
 const targets=page.locator('button:visible:not([disabled]),input:visible:not([disabled]),select:visible:not([disabled]),.pm-details>summary:visible,a[data-topic]:visible');
 const count=await targets.count();
 for(let i=0;i<count;i++){
  const target=targets.nth(i);
  await target.evaluate(el=>el.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'}));
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const hit=await target.evaluate(el=>{const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,top=document.elementFromPoint(x,y);return{ok:!!top&&(top===el||el.contains(top)),target:el.id||el.textContent.trim().slice(0,65)||el.tagName,interceptor:top?top.tagName+'.'+top.className:'outside viewport'};});
  assert.ok(hit.ok,label+': action is covered '+JSON.stringify(hit));
 }
}
async function layout(page,label){
 const result=await page.evaluate(()=>({width:innerWidth,documentWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth}));
 assert.ok(result.documentWidth<=result.width+2&&result.bodyWidth<=result.width+2,label+': document overflow '+JSON.stringify(result));
 const tiny=await page.locator('.pm-hint-button:visible,.pm-zoom-button:visible,.pm-details>summary:visible').evaluateAll(es=>es.filter(e=>e.getBoundingClientRect().height<43).map(e=>({text:e.textContent,height:e.getBoundingClientRect().height})));
 assert.deepEqual(tiny,[],label+': small disclosure targets');
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 fs.mkdirSync(output,{recursive:true});browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
 let cases=0;
 for(const width of [320,360,1280])for(const name of names){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  try{
   await page.goto(origin+'/trainers/oge-1-5-trainers/'+name);await page.waitForFunction(()=>document.documentElement.dataset.practicalMinimal==='ready');
   await layout(page,name+'@'+width);await hitTargets(page,name+' initial@'+width);
   if(name.includes('paper-sheets')){const condition=page.locator('.pm-paper-condition');assert.equal(await condition.isVisible(),true);assert.equal(await condition.evaluate(el=>el.nextElementSibling?.id),'taskCard');assert.match(await condition.textContent(),/1 м²/);}
   if(/entry-diagnostic|routes-checkpoint/.test(name)){
    const diag=name.includes('entry-diagnostic');const start=page.locator(diag?'#start-btn':'#start');await start.focus();await start.press('Enter');
    await page.locator(diag?'#question-text':'#question').waitFor({state:'visible'});
    assert.equal(await page.locator(diag?'#review-box':'#teacher-answer').isVisible(),false,'assessment answer leak');
    assert.equal(await page.locator('.pm-context-hint').count(),0);
    if(diag){
     const total=await page.locator('#stepper button').count();assert.equal(total,10,'diagnostic keeps ten questions');
     for(let number=1;number<=total;number++){
      assert.equal((await page.locator('#current-num').textContent()).trim(),String(number));
      assert.equal(await page.locator('#finish-btn').isVisible(),number===total,'finish is offered only at the final question');
      assert.equal(await page.locator('#review-box').isVisible(),false,'no answers during diagnosis');
      await layout(page,name+' question'+number+'@'+width);await hitTargets(page,name+' question'+number+'@'+width);
      if(number<total)await page.locator('#skip-btn').click();
     }
    }else{await page.locator('#next').click();await layout(page,name+' started@'+width);}
    await page.locator(diag?'#finish-btn':'#finish').click();await page.locator('#result').waitFor({state:'visible'});
   }else if(!name.includes('-map.')){
    const button=page.locator('button:visible,summary:visible').filter({hasText:/^Хочешь подсказку\?$/}).first();
    await button.waitFor({state:'visible'});if(name==='percent-table-trainer.html')await page.locator('#practice-input').fill('12,5');const identity=await button.evaluate(el=>{if(!el.id)el.id='browser-hint-control';return{id:el.id,tag:el.tagName};});await button.focus();await button.press('Enter');
    if(identity.tag==='BUTTON')assert.equal(await page.locator('#'+identity.id).getAttribute('aria-expanded'),'true',name+' hint ARIA');
    if(name==='percent-table-trainer.html'){assert.equal(await page.locator('#practice-input').inputValue(),'12,5','hint preserves the draft');assert.equal(await page.evaluate(()=>document.activeElement.id),identity.id,'hint keeps keyboard focus');}
    await layout(page,name+' help@'+width);await hitTargets(page,name+' help@'+width);
    if(/land-plots|tariffs|roads-schema/.test(name)){
     assert.equal(await page.locator('.pm-context-hint section').isVisible(),true);
     const control=page.locator(name.includes('roads-schema')?'#next':'#task-tabs button:nth-child(2)');await reveal(control);await control.click();
     assert.equal(await page.locator('.pm-context-hint section').isVisible(),false,'new task has closed help');
     await page.locator(name.includes('tariffs')?'#graph':name.includes('land-plots')?'#plan':'#app svg').first().waitFor({state:'visible'});
    }
   }else assert.equal(await page.locator('a[data-topic]:visible').count(),12);
   if(/roads-grid|apartments|tariffs/.test(name)){
    const figure=page.locator('.pm-figure-scroll'),zoom=page.locator('.pm-zoom-button');
    assert.equal(await zoom.getAttribute('aria-pressed'),'false');await zoom.focus();await zoom.press('Enter');assert.equal(await zoom.getAttribute('aria-pressed'),'true');
    await layout(page,name+' zoom@'+width);
    const labelSizes=await figure.locator('svg text').evaluateAll(es=>es.filter(e=>e.textContent.trim()).map(e=>parseFloat(getComputedStyle(e).fontSize)*e.getScreenCTM().a));assert.ok(labelSizes.length>0);assert.ok(Math.min(...labelSizes)>=12,name+' enlarged diagram labels remain readable: '+Math.min(...labelSizes));
    if(width===320){await figure.focus();await figure.press('ArrowRight');await page.screenshot({path:path.join(output,name.replace('.html','')+'-zoom-320.png'),fullPage:true});}
    await zoom.click();assert.equal(await zoom.getAttribute('aria-pressed'),'false');await layout(page,name+' zoom reset@'+width);
   }
   await hitTargets(page,name+' final@'+width);
   assert.deepEqual(errors,[],name+' runtime errors');
   if(width===320||(width===1280&&/roads-schema|roads-grid|apartments|tariffs/.test(name)))await page.screenshot({path:path.join(output,name.replace('.html','')+'-'+width+'.png'),fullPage:true});
   cases++;
  }catch(e){await page.screenshot({path:path.join(output,'FAIL-'+name+'-'+width+'.png'),fullPage:true}).catch(()=>{});throw e;}finally{await context.close();}
 }
 console.log('OGE_PRACTICAL_MINIMAL_BROWSER_OK '+cases+' route/viewport cases (320, 360, 1280)');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
