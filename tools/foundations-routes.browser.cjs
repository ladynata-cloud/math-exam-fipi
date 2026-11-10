'use strict';
// Real Chromium synthetic learner journeys, not a real-pupil effectiveness trial.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright'),catalog=require('../foundations/route-catalog.js'),C=require('../foundations/route-core.js');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/foundations-routes');fs.mkdirSync(out,{recursive:true});
const errors=[],results={routes:catalog.routes.length,checkQuestions:0,visuals:0,viewports:[],screenshots:[]};
const server=http.createServer((req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://fixture').pathname);let file=path.resolve(root,'.'+pathname);if(file!==root&&!file.startsWith(root+path.sep))return res.writeHead(403).end();if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch(_){res.writeHead(404).end();}});
let origin,browser;
async function shot(page,name,inline=false){const file=path.join(out,name+'.png');await page.screenshot({path:file,fullPage:false});results.screenshots.push(name+'.png');if(inline&&process.env.FOUNDATIONS_INLINE_VISUALS==='1')console.log('FOUNDATIONS_VISUAL '+name+' '+fs.readFileSync(file).toString('base64'));}
async function fit(page,label){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+': horizontal overflow');}
async function route(page,r,mode='check-a'){await page.goto(origin+'/foundations/route.html#'+r.id+'?session='+mode);await page.locator('#question-title,#result-title').first().waitFor();assert.equal((await page.locator('#route-heading').textContent()).trim(),r.title);}
async function enter(page,q,value=String(q.answer)){
 await page.evaluate(({q,value})=>{const form=document.getElementById('answer-form');if(q.input==='choice'){const radio=[...form.querySelectorAll('input[name="answer"]')].find(n=>n.value===value);if(!radio)throw Error('missing choice '+q.id);radio.checked=true;radio.dispatchEvent(new Event('change',{bubbles:true}));}else{const input=document.getElementById('route-answer');input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));}form.requestSubmit();},{q:{id:q.id,input:q.input},value});
}
async function finishSet(page,r,mode,from=0){const qs=C.questions(r,mode);for(let i=from;i<6;i++){await page.locator('#question-title').waitFor();assert.equal((await page.locator('#question-title').textContent()).trim(),qs[i].prompt);await enter(page,qs[i]);await page.locator('#next-question').waitFor({state:'visible'});await page.locator('#next-question').click();}await page.locator('#result-title').waitFor();}
function collect(page,label){page.on('pageerror',e=>errors.push(label+': '+e.message));}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage();collect(page,'desktop');
  await page.goto(origin+'/foundations/');await page.locator('[data-course-route]').first().waitFor();assert.equal(await page.locator('[data-course-route]').count(),catalog.routes.length);assert.equal(await page.locator('.stage').count(),12);await fit(page,'home1280');
  await page.locator('[data-topic="signed"]').click();await page.locator('#stage-signed').scrollIntoViewIfNeeded();await shot(page,'signed-map-1280',true);
  // Every new route receives a complete new, six-answer independent check.
  for(const r of catalog.routes){await route(page,r);await finishSet(page,r,'check-a');assert.match(await page.locator('#result-title').textContent(),/Самостоятельная проверка пройдена/,r.id);await fit(page,'route '+r.id);results.checkQuestions+=6;}
  await page.goto(origin+'/foundations/');await page.locator('[data-course-route].verified').first().waitFor();assert.equal(await page.locator('[data-course-route].verified').count(),catalog.routes.length);
  // All exact diagrams are rendered by the same production renderer.
  await route(page,catalog.routes[0],'practice');
  for(const r of catalog.routes)for(const q of r.questions){if(!q.visual)continue;const rendered=await page.evaluate(v=>{const html=window.FoundationRoutePage.figure(v);const box=document.createElement('div');box.innerHTML=html;return{html,svg:!!box.querySelector('svg'),table:!!box.querySelector('table'),bars:!!box.querySelector('.bar-model')};},q.visual);assert(rendered.html&&!/NaN|undefined|Infinity/.test(rendered.html),q.id);assert(rendered.svg||rendered.table||rendered.bars,q.id);results.visuals++;}
  await context.close();
  // Narrow-screen input, sticky help, exact draft, first-attempt evidence and return.
  for(const width of [320,390]){
   const ctx=await browser.newContext({viewport:{width,height:900}}),p=await ctx.newPage();collect(p,'mobile'+width);
   const r=catalog.byId['decimal-place-value'],qs=C.questions(r,'practice');await route(p,r,'practice');await fit(p,'question'+width);
   await enter(p,qs[0],'999');await enter(p,qs[0],'998');assert(await p.locator('#question-hint').isVisible());
   await p.locator('#route-answer').fill('0,3');await p.reload();await p.locator('#route-answer').waitFor();assert.equal(await p.locator('#route-answer').inputValue(),'0,3');assert(await p.locator('#question-hint').isVisible());await shot(p,'decimal-help-'+width,width===320);
   await finishSet(p,r,'practice');assert.match(await p.locator('#result-title').textContent(),/Учебная порция/);await fit(p,'result'+width);
   await route(p,r,'check-a');await finishSet(p,r,'check-a');assert.match(await p.locator('#result-title').textContent(),/Самостоятельная/);
   await p.locator('#repeat-set').click();await finishSet(p,r,'check-a');assert.match(await p.locator('#result-title').textContent(),/знакомого набора/);
   // Actual retained archived trainer in its route frame; outer return stays available.
   const signed=catalog.byId['signed-add-negative'];await p.goto(origin+'/foundations/route.html#'+signed.id+'?trainer=0');await p.frameLocator('#trainer-frame').locator('body').waitFor();assert(await p.locator('#all-topics').isVisible());assert((await p.locator('#trainer-frame').getAttribute('src')).includes('negative-plus-negative'));await p.locator('#all-topics').click();await p.locator('#stage-signed[open]').waitFor();await fit(p,'map'+width);
   // Search acts on the skill maps, while original laboratory remains available.
   await p.locator('#route-search').fill('несуществующийнавык');assert.equal(await p.locator('.stage:visible').count(),0);await p.locator('#route-search').fill('дроб');assert(await p.locator('[data-course-route]:visible').count()>1);
   await ctx.close();results.viewports.push(width);
  }
  // Two tabs: assistance must remain attached even if the other tab answers.
  const peers=await browser.newContext({viewport:{width:1280,height:900}}),a=await peers.newPage(),b=await peers.newPage();collect(a,'peerA');collect(b,'peerB');
  const fr=catalog.byId['fraction-meaning'],fq=C.questions(fr,'check-a');await route(a,fr);await route(b,fr);await b.locator('#show-hint').click();await enter(a,fq[0]);await a.locator('#next-question').click();await a.reload();await a.locator('#question-title').waitFor();assert.match(await a.locator('.completed-work').textContent(),/С помощью/);await finishSet(a,fr,'check-a',1);assert.doesNotMatch(await a.locator('#result-title').textContent(),/Самостоятельная проверка пройдена/);await peers.close();
  // A saved representation instruction is enforced by the actual form.
  const forms=await browser.newContext({viewport:{width:390,height:900}}),fp=await forms.newPage();collect(fp,'formats');const dec=catalog.byId['decimal-place-value'];await route(fp,dec,'practice');await enter(fp,dec.questions[0],'37/100');assert(await fp.locator('#next-question').isHidden());assert.match(await fp.locator('#answer-feedback').textContent(),/десятичная/);await enter(fp,dec.questions[0],'0,37');assert(await fp.locator('#next-question').isVisible());await shot(fp,'decimal-format-390');await forms.close();
  // Keyboard-only answer and continuation remain usable without pointer interaction.
  const keys=await browser.newContext({viewport:{width:390,height:900}}),kp=await keys.newPage();collect(kp,'keyboard');const kr=catalog.byId['decimal-place-value'];await route(kp,kr,'check-b');const kq=C.questions(kr,'check-b')[0];await kp.locator('#route-answer').focus();await kp.keyboard.type(String(kq.answer));await kp.keyboard.press('Enter');await kp.locator('#next-question').waitFor({state:'visible'});assert.equal(await kp.evaluate(()=>document.activeElement.id),'next-question');await kp.keyboard.press('Enter');assert.equal((await kp.locator('#question-title').textContent()).trim(),C.questions(kr,'check-b')[1].prompt);await keys.close();
  // Exact graphic and instrument evidence from real source questions.
  const models=await browser.newContext({viewport:{width:1280,height:900}}),mp=await models.newPage();collect(mp,'models');
  for(const [type,name]of [['graph','graph-1280'],['angle','protractor-1280']]){
   const found=catalog.routes.flatMap(r=>r.questions.map((q,i)=>({r,q,i}))).find(x=>x.q.visual?.type===type&&(type!=='angle'||x.q.visual.protractor));
   assert(found,'model '+type);const mode=C.MODES[Math.floor(found.i/6)],offset=found.i%6;await route(mp,found.r,mode);const qs=C.questions(found.r,mode);for(let i=0;i<offset;i++){await enter(mp,qs[i]);await mp.locator('#next-question').click();}await fit(mp,type);await shot(mp,name,type==='graph');
  }
  await models.close();
  // Basic EGE keeps its original task return while offering the richer foundation map.
  const ectx=await browser.newContext({viewport:{width:1280,height:900}}),ep=await ectx.newPage();collect(ep,'ege');await ep.goto(origin+'/ege-baza/#foundation?skill=p-signs');await ep.locator('.foundation-route-entry a').waitFor();await ep.locator('.foundation-route-entry a').click();assert(new URL(ep.url()).pathname==='/foundations/');assert(new URL(ep.url()).hash==='#topic=signed');await ep.locator('#stage-signed [data-course-route]').first().click();await ep.locator('#exam-back').waitFor();assert((await ep.locator('#exam-back').getAttribute('href')).includes('/ege-baza/#foundation?skill=p-signs'));await ep.locator('#exam-back').click();await ep.locator('.foundation-route-entry').waitFor();await ectx.close();
  // Blocked storage keeps public learning usable, and states its limits visibly.
  const blocked=await browser.newContext({viewport:{width:320,height:900}});await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('denied by fixture');}}));const bp=await blocked.newPage();collect(bp,'blocked');await route(bp,catalog.routes[0],'practice');assert(await bp.locator('#storage-notice').isVisible());await enter(bp,catalog.routes[0].questions[0]);assert(await bp.locator('#next-question').isVisible());await blocked.close();
  // Independent checks stop before exposing a question if storage is unavailable.
  const denied=await browser.newContext({viewport:{width:320,height:900}});await denied.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('denied');}}));const dp=await denied.newPage();collect(dp,'deniedCheck');await dp.goto(origin+'/foundations/route.html#decimal-place-value?session=check-a');await dp.locator('#retry-save').waitFor();assert.equal(await dp.locator('#question-title').count(),0);await fit(dp,'deniedCheck320');await denied.close();
  // A failed help write cannot expose assistance or be skipped by navigating away.
  const retry=await browser.newContext({viewport:{width:390,height:900}});await retry.addInitScript(()=>{window.__rejectHint=true;const put=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(window.__rejectHint&&k.includes('.event.')){const e=JSON.parse(v);if(e.type==='hint')throw Error('temporary quota');}return put.call(this,k,v);};});const rp=await retry.newPage();collect(rp,'retryHelp');const rr=catalog.byId['decimal-place-value'];await route(rp,rr);await rp.locator('#route-map').locator('..').locator('summary').click();await rp.locator('#route-map a[href*="trainer=0"]').click();await rp.locator('#retry-save').waitFor();assert.equal(await rp.locator('#trainer-frame').count(),0);assert.equal(await rp.locator('#question-hint').count(),0);await rp.evaluate(()=>window.__rejectHint=false);await rp.locator('#retry-save').click();await rp.locator('#question-title').waitFor();assert(rp.url().endsWith('?session=check-a'));assert(await rp.locator('#question-hint').isVisible());await finishSet(rp,rr,'check-a');assert.doesNotMatch(await rp.locator('#result-title').textContent(),/Самостоятельная проверка пройдена/);await retry.close();
  assert.deepEqual(errors,[],'No browser exceptions');results.viewports.push(1280);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(results,null,2));console.log('FOUNDATIONS_COMPLETE_ROUTES_BROWSER_OK '+JSON.stringify(results));
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);if(errors.length)console.error(errors);fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({message:error.message,errors,results},null,2));server.close();process.exitCode=1;});
