'use strict';
// Public practice evidence: actual controls, reloads and two independent tabs.
// The shared-room checks use the unchanged native bridge and the same storage.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const {legacy}=require('./task11-test-evidence.cjs');
const root=path.resolve(__dirname,'..');
const artifacts=path.resolve(process.env.TASK11_AUDIT_ARTIFACTS||path.join(root,'artifacts/task11-audit-learning'));
const KEY='mathExamCourseProgress.v1',TID='oge-t11-grafiki',URL_PATH='/trainers/oge-task11-graphs-trainer.html';
const fixture={
  'audit-sibling':{v:1,solvedByType:{one:7},ext:{unrelated:['retain',11]}},
  [TID]:{v:1,updatedAt:123456,solvedByType:{t43:4},ext:{skills:{oge:{total:4,first:3}},foreign:{keep:true}}}
};
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
function serve(req,res){
  let url;try{url=new URL(req.url,'http://localhost');}catch(_){res.writeHead(400).end();return;}
  if(url.pathname==='/favicon.ico'){res.writeHead(204).end();return;}
  if(url.pathname==='/trainers/trainer-board.html'&&url.searchParams.has('task11AuditHarness')){
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}).end('<!doctype html><meta charset="utf-8"><title>Shared native fixture</title><iframe name="audit-shared" title="Shared trainer" style="width:100%;height:90vh;border:0" src="'+URL_PATH+'"></iframe>');return;
  }
  let pathname;try{pathname=decodeURIComponent(url.pathname);}catch(_){res.writeHead(400).end();return;}
  const file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(error,body)=>{if(error){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'}).end(body);});
}
const state=(page,module)=>page.evaluate(m=>Task11Learning.getState(m),module);
const progress=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)||'{}'),KEY);
const attempts=async page=>(await progress(page))[TID]?.ext?.auditLearning?.attempts||[];
const condition=(page,module)=>page.evaluate(m=>m==='m1'?{title:M1.q.title,svg:M1.q.svg}:m==='m2'?{p:M2G.p}:m==='m3'?{formula:document.getElementById('m3-formula').textContent,xs:M3.task.xs,ys:M3.task.ys}:{type:M4.task.type,items:M4.task.items.map(i=>i.desc),graphs:document.getElementById('m4-graphs').innerHTML},module);
async function ready(page){await page.waitForFunction(()=>window.Task11Learning&&document.querySelector('#m4-graphs svg'));}
async function openModule(page,module){
  if(!(await page.locator('#task11-more').evaluate(el=>el.open)))await page.locator('#task11-more > summary').click();
  await page.locator('#tabs button[data-m="'+module+'"]').click();
  if(module==='m2')await page.locator('#m2-chips button[data-k="par"]').click();
  assert(await page.locator('#'+module).isVisible(),module+' is visible');
}
async function fits(page,label){
  const bad=await page.evaluate(()=>[...document.querySelectorAll('section.module.active,section.module.active .card,section.module.active .task11-learning,section.module.active table.pts,section.module.active table.pts input,section.module.active .task11-learning button')].filter(el=>el.getClientRects().length).map(el=>{const r=el.getBoundingClientRect();return{id:el.id||el.tagName,left:r.left,right:r.right};}).filter(r=>r.left< -1||r.right>innerWidth+1));
  assert.deepEqual(bad,[],label+' elements fit the viewport');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' has no horizontal page scroll');
}
async function solveM4(page){await page.locator('#m4-answer').fill(await page.evaluate(()=>M4.task.key.join('')));await page.locator('#m4-check').click();assert(await page.locator('#m4-good').isVisible());}
async function solveM1(page){const i=await page.evaluate(()=>M1.q.opts.findIndex(x=>x.ok));await page.locator('#m1-opts button').nth(i).click();assert(await page.locator('#m1-good').isVisible());}
async function firstM3(page){
  if(await page.evaluate(()=>M3.kind==='par')){await page.locator('#m3-x0').fill(String(await page.evaluate(()=>M3.task.p.x0)));await page.locator('#m3-check1').click();}
  else{
    const i=await page.evaluate(()=>[...document.querySelectorAll('#m3-stage .opts button')].findIndex(b=>M3.kind==='hyp'?b.dataset.q===(M3.task.m>0?'13':'24'):b.textContent==='(0; '+fnum(M3.task.ys[0])+')'));
    assert(i>=0,'a unique mathematical first step is offered');await page.locator('#m3-stage .opts button').nth(i).click();
  }
  assert(await page.locator('#m3-stage table.pts').isVisible());
}
async function tableM3(page){
  const values=await page.evaluate(()=>M3.task.ys),fields=page.locator('#m3-stage table.pts input');
  assert.equal(await fields.count(),values.length);for(let i=0;i<values.length;i++)await fields.nth(i).fill(String(values[i]));
  await page.locator('#m3-checkT').click();assert(await page.locator('#m3-graph svg').isVisible());
}
async function fresh(page,module){
  const old=await state(page,module),button=page.locator('[data-task11-next="'+module+'"]');
  assert(await button.isVisible(),'a fresh comparable task is offered after work');assert((await button.boundingBox()).height>=44,'fresh task has a usable touch target');
  await button.focus();await page.keyboard.press('Enter');
  const next=await state(page,module);assert.notEqual(next.taskKey,old.taskKey,'the new task changes the full mathematical condition');assert.equal(next.skill,old.skill);assert.equal(next.helpUsed,false);assert.equal(next.completed,false);
  return next;
}
async function publicJourney(page,url,width,evidence){
  await page.goto(url);await ready(page);
  const legacyBefore=legacy(await progress(page));assert.deepEqual(legacyBefore,fixture);
  assert.equal((await progress(page))[TID].ext.auditLearning.resume,undefined,'a first view is not unfinished work');
  await fits(page,width+' initial matching');
  const before=await condition(page,'m4'),id=(await state(page,'m4')).id;
  await page.locator('#m4-answer').fill('23');
  await page.locator('#m4-hint').focus();await page.keyboard.press('Enter');await page.locator('#m4-hint').click();
  await page.locator('#m4-desc .function-help').first().focus();await page.keyboard.press('Enter');await page.locator('#t11-help-close').click();
  assert.equal((await state(page,'m4')).helpUsed,true);assert.equal((await attempts(page)).length,0);
  assert.deepEqual(legacy(await progress(page)),legacyBefore,'opening and closing help preserves all legacy data');
  await page.reload();await ready(page);
  assert.deepEqual(await condition(page,'m4'),before,'reload retains each formula and plotted graph');assert.equal((await state(page,'m4')).id,id);
  assert.equal(await page.locator('#m4-answer').inputValue(),'23');assert.equal((await state(page,'m4')).helpUsed,true);
  assert.deepEqual(legacy(await progress(page)),legacyBefore,'restore does not write score or error history');
  await solveM4(page);assert.equal((await attempts(page)).at(-1).outcome,'helped');const n=(await attempts(page)).length;
  await page.locator('#m4-check').click();await page.reload();await ready(page);await page.locator('#m4-check').click();assert.equal((await attempts(page)).length,n,'double checks and reload create one completion');
  await fits(page,width+' helped matching');await page.screenshot({path:path.join(artifacts,width+'-01-helped-matching.png'),fullPage:true});
  await fresh(page,'m4');assert.equal((await condition(page,'m4')).type,before.type);await solveM4(page);assert.equal((await attempts(page)).at(-1).outcome,'independent');

  await openModule(page,'m1');const warmup=await condition(page,'m1'),warmType=await page.evaluate(()=>M1.q.type);
  await page.locator('#m1-opts button').nth(await page.evaluate(()=>M1.q.opts.findIndex(x=>!x.ok))).click();
  assert((await state(page,'m1')).helpKinds.includes('automatic-feedback'),'automatic rule feedback is assistance');
  await page.reload();await ready(page);assert.deepEqual(await condition(page,'m1'),warmup);await solveM1(page);assert.equal((await attempts(page)).at(-1).outcome,'helped');
  await fresh(page,'m1');assert.equal(await page.evaluate(()=>M1.q.type),warmType);await solveM1(page);assert.equal((await attempts(page)).at(-1).outcome,'independent');await fits(page,width+' warmup');

  await openModule(page,'m2');const vertex=await condition(page,'m2'),truth=await page.evaluate(()=>M2G.p.x0===0?'zero':M2G.p.x0<0?'left':'right');
  const wrong=['left','zero','right'].find(x=>x!==truth);await page.locator('#m2g-opts button[data-v="'+wrong+'"]').click();await page.locator('#m2g-build').click();
  const graph=await page.locator('#m2g-graph').innerHTML();await page.locator('#m2g-opts button[data-v="'+truth+'"]').click();
  await page.reload();await ready(page);assert.deepEqual(await condition(page,'m2'),vertex);assert.equal(await page.locator('#m2g-graph').innerHTML(),graph);
  assert.equal((await state(page,'m2')).completed,false,'selecting a corrected forecast is not a completed answer');assert.equal((await state(page,'m2')).helpUsed,true);
  await page.locator('#m2g-build').click();assert.equal((await attempts(page)).at(-1).outcome,'helped');await fits(page,width+' vertex prediction');
  await page.screenshot({path:path.join(artifacts,width+'-02-vertex-reload.png'),fullPage:true});
  await fresh(page,'m2');const newTruth=await page.evaluate(()=>M2G.p.x0===0?'zero':M2G.p.x0<0?'left':'right');await page.locator('#m2g-opts button[data-v="'+newTruth+'"]').click();await page.locator('#m2g-build').click();assert.equal((await attempts(page)).at(-1).outcome,'independent');

  await openModule(page,'m3');await firstM3(page);const construction=await condition(page,'m3');
  const fields=page.locator('#m3-stage table.pts input');await fields.nth(0).fill('-17');await fields.nth(1).fill('3/2');
  await page.locator('#m3-vertex-details > summary').click();await page.locator('#m3-vertex-details > summary').click();
  const values=await fields.evaluateAll(nodes=>nodes.map(n=>n.value));await openModule(page,'m4');await page.reload();await ready(page);assert.equal(await page.locator('section.module.active').getAttribute('id'),'m4','ordinary reload retains the chosen module');
  await page.goto(url+'?resume=1');await ready(page);assert.equal(await page.locator('section.module.active').getAttribute('id'),'m3','the course resume link opens the unfinished construction');
  assert.deepEqual(await condition(page,'m3'),construction);assert.deepEqual(await page.locator('#m3-stage table.pts input').evaluateAll(nodes=>nodes.map(n=>n.value)),values);assert.equal((await state(page,'m3')).helpUsed,true);
  await fits(page,width+' partial table');await page.screenshot({path:path.join(artifacts,width+'-03-partial-table.png'),fullPage:true});
  await tableM3(page);assert.equal((await attempts(page)).at(-1).outcome,'helped');const done=(await attempts(page)).length;await page.locator('#m3-checkT').click();assert.equal((await attempts(page)).length,done);
  await fresh(page,'m3');assert.equal(await page.evaluate(()=>M3.kind),'par');await firstM3(page);await tableM3(page);assert.equal((await attempts(page)).at(-1).outcome,'independent');
  for(const kind of ['lin','hyp','root']){await page.locator('#m3-chips [data-k="'+kind+'"]').click();await firstM3(page);await tableM3(page);assert.equal((await attempts(page)).at(-1).outcome,'independent',kind+' first correct table');await fits(page,width+' '+kind+' table');}
  const after=await progress(page);assert.deepEqual(after['audit-sibling'],fixture['audit-sibling']);assert.deepEqual(after[TID].ext.foreign,fixture[TID].ext.foreign);
  assert.equal(after[TID].ext.auditLearning.resume.unfinished,false);assert(after[TID].ext.auditLearning.attempts.every(a=>a.id&&a.skill&&a.taskKey&&a.at>0&&typeof a.fresh==='boolean'&&typeof a.helpUsed==='boolean'));
  evidence.push({width,matchingReload:true,warmupAutomaticHelp:true,vertexReload:true,partialTableReload:true,constructionFamilies:4,freshAfterHelp:true,keyboard:true,legacyAndForeignPreserved:true,completions:after[TID].ext.auditLearning.attempts.length});
}
async function tabsJourney(context,page,url,evidence){
  await openModule(page,'m4');await fresh(page,'m4');await page.locator('#m4-answer').fill('12');
  const other=await context.newPage();await other.goto(url);await ready(other);assert.equal(await other.locator('#m4-answer').inputValue(),'12');
  await other.locator('#m4-answer').fill('23');await other.locator('#m4-hint').click();await other.locator('#m4-hint').click();
  const latest=await other.evaluate(key=>localStorage.getItem(key),KEY),n=(await attempts(other)).length;
  await page.locator('#m4-check').click();assert.equal(await page.locator('#m4-answer').inputValue(),'23');assert.equal((await state(page,'m4')).helpUsed,true);assert.equal((await attempts(page)).length,n);
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),latest,'the stale check restores before any score or draft overwrite');
  await solveM4(page);assert.equal((await attempts(page)).length,n+1);assert.equal((await attempts(page)).at(-1).outcome,'helped');
  const completed=legacy(await progress(page));await other.locator('#m4-check').click();assert.equal((await state(other,'m4')).completed,true);assert.equal((await attempts(other)).length,n+1);assert.deepEqual(legacy(await progress(other)),completed,'another stale check cannot duplicate legacy credit');
  // A valid peer answer must also wait for a new, deliberate action. A stale
  // blur/change followed by the original click must never submit it unseen.
  await fresh(page,'m4');await page.locator('#m4-answer').fill('12');await other.reload();await ready(other);
  const peerAnswer=await other.evaluate(()=>M4.task.key.join(''));await other.locator('#m4-answer').fill(peerAnswer);await other.locator('#m4-hint').click();await other.locator('#m4-hint').click();
  const validDraft=await other.evaluate(key=>localStorage.getItem(key),KEY);
  await page.locator('#m4-check').click();assert.equal(await page.locator('#m4-answer').inputValue(),peerAnswer);assert.equal((await attempts(page)).length,n+1);
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),validDraft,'the stale gesture cannot submit a correct peer answer');
  await page.locator('#m4-check').focus();await page.keyboard.press('Enter');assert.equal((await attempts(page)).length,n+2);assert.equal((await attempts(page)).at(-1).outcome,'helped');
  await other.locator('#m4-check').click();assert.equal((await attempts(other)).length,n+2);assert.equal((await state(other,'m4')).completed,true);
  await other.close();evidence.push({twoTabs:true,staleCheckRestoresFirst:true,staleCorrectAnswerRestoresFirst:true,stickyHelp:true,oneCompletionPerAttempt:true,keyboardAfterRestore:true});
}
async function isolationJourney(browser,origin,evidence,errors){
  const context=await browser.newContext();await context.addInitScript(({key,value})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(value));},{key:KEY,value:fixture});
  const page=await context.newPage();page.on('pageerror',error=>errors.push('isolation: '+error.message));
  await page.goto(origin+URL_PATH+'?board=1');await ready(page);assert.equal(await page.evaluate(()=>OgeCourseSharedMode),true);assert.equal(await page.evaluate(()=>Task11Learning.enabled),false);assert.equal(await page.locator('.task11-learning').count(),0);
  await page.locator('#m4-hint').click();await solveM4(page);assert.deepEqual(await progress(page),fixture,'shared practice touches no personal key');
  await page.goto(origin+'/trainers/trainer-board.html?task11AuditHarness=1');const frame=page.frame({name:'audit-shared'});assert(frame);await ready(frame);
  assert.equal(await frame.evaluate(()=>OgeCourseSharedMode),true);assert.equal(await frame.evaluate(()=>Task11Learning.enabled),false);assert.equal(await frame.locator('.task11-learning').count(),0);
  await frame.locator('#m4-hint').click();await solveM4(frame);assert.deepEqual(await progress(frame),fixture,'a board iframe remains isolated from public drafts and scores');
  assert.equal(await frame.evaluate(()=>getBoardTrainerState().version),1,'the native state schema remains version 1');
  await page.goto(origin+URL_PATH+'?learning=1');await ready(page);assert.equal(await page.evaluate(()=>Task11Learning.enabled),false);assert.equal(await page.locator('.task11-learning').count(),0);assert.deepEqual(await progress(page),fixture);
  await context.close();evidence.push({sharedQuery:true,boardIframe:true,managedMode:true,noPublicLayer:true,nativeStateVersion:1,personalStorageUnchanged:true});
}
async function main(){
  fs.mkdirSync(artifacts,{recursive:true});const server=http.createServer(serve);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port,url=origin+URL_PATH;let browser,livePage,liveContext,liveWidth;const errors=[],evidence=[];
  try{
    browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
    for(const width of [320,390,1280]){
      const context=await browser.newContext({viewport:{width,height:900}});liveContext=context;liveWidth=width;await context.tracing.start({screenshots:true,snapshots:true});
      await context.addInitScript(({key,value})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(value));},{key:KEY,value:fixture});
      const page=await context.newPage();livePage=page;page.on('pageerror',error=>errors.push(width+': '+error.message));
      await publicJourney(page,url,width,evidence);if(width===390)await tabsJourney(context,page,url,evidence);
      await context.tracing.stop({path:path.join(artifacts,width+'-trace.zip')});await context.close();livePage=null;liveContext=null;
    }
    await isolationJourney(browser,origin,evidence,errors);assert.deepEqual(errors,[],'no browser execution errors');
    fs.writeFileSync(path.join(artifacts,'evidence.json'),JSON.stringify({ok:true,evidence,errors},null,2)+'\n');console.log('TASK11_AUDIT_LEARNING_BROWSER_OK');
  }catch(error){
    if(livePage)await livePage.screenshot({path:path.join(artifacts,'failure.png'),fullPage:true}).catch(()=>{});
    if(liveContext)await liveContext.tracing.stop({path:path.join(artifacts,liveWidth+'-trace.zip')}).catch(()=>{});
    fs.writeFileSync(path.join(artifacts,'evidence.json'),JSON.stringify({ok:false,evidence,errors,failure:error.stack||String(error)},null,2)+'\n');throw error;
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
