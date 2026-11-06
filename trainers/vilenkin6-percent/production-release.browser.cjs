'use strict';
// Live PR #471 verification in two fresh, anonymous Chromium contexts.
// Uses native UI actions and the published board. No pupil accounts or saved profiles.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const D=require('../../courses/vilenkin-6-part-1/textbook-data/units-A.json').find(u=>u.id===2);
let browser;const errors=[],blockedWrites=[];let createdRooms=0;
function safeError(error){return String(error?.stack||error?.message||error).replace(/https?:\/\/[^\s"'<>]+/g,value=>{try{const u=new URL(value);return u.origin+u.pathname+(u.search?'?[query-redacted]':'')+(u.hash?'#[fragment-redacted]':'');}catch(_){return '[URL redacted]';}}).replace(/((?:token|teacherToken|studentToken)\s*[:=]\s*)[^\s,;}\]]+/gi,'$1[redacted]');}
async function publicJSON(url){const r=await fetch(url,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(20000)});assert.equal(r.status,200,'public preflight HTTP status');return r.json();}
async function frame(page){await page.waitForFunction(()=>document.querySelector('#mirrorStatus')?.dataset.mirrorStatus==='connected');const f=page.frames().find(x=>x.url().includes('/vilenkin6-percent/'));assert(f);await f.waitForFunction(()=>typeof getBoardTrainerState==='function');return f;}
const state=f=>f.evaluate(()=>getBoardTrainerState());
async function same(a,b){const expected=await state(a);await b.waitForFunction(v=>JSON.stringify(getBoardTrainerState())===JSON.stringify(v),expected);const visible=f=>f.evaluate(()=>({condition:document.querySelector('#condition').textContent,history:document.querySelector('#history').innerHTML,answer:document.querySelector('#answer').value,notes:document.querySelector('#notes').value,hint:document.querySelector('#hint-text').hidden?'':document.querySelector('#hint-text').textContent,feedback:document.querySelector('#feedback').textContent,rules:document.querySelector('#rules').open}));assert.deepEqual(await visible(a),await visible(b));}
async function action(a,b,run){const before=JSON.stringify(await state(a));await run();await a.waitForFunction(v=>JSON.stringify(getBoardTrainerState())!==v,before);await same(a,b);}
(async()=>{try{
 const origin='https://mathexam.space',backend='https://mathexam-board-ladynata.msk1.amvera.tech';
 const expectedDigest='sha256:308e762cc9cd192e37b9e0dc385f9f7de350ecfe559969b78a84c1d89fdd0ff2';
 const health=await publicJSON(backend+'/health');
 assert.equal(health.ok,true);assert.equal(health.registryLoaded,true);assert.equal(health.registryError,null);assert.equal(health.registryEntryCount,56);assert.equal(health.registryDigest,expectedDigest);
 assert.equal(health.progressStoreReady,true);assert.equal(health.progressPersistenceConfirmed,true);assert.equal(health.progressAuthorizedTrainerCount,3);
 assert.equal(health.progressRegistryDigest,'sha256:407d647ec9a765f9d5e50aaec9ef2b04c26c91b397e1ca3039262492f59cadf6');
 const registry=await publicJSON(backend+'/api/trainer-registry');assert.equal(registry.schemaVersion,1);assert.equal(registry.trainers.length,56);
 assert.equal(registry.digest,expectedDigest);const admitted=registry.trainers.find(t=>t.trainerId==='vilenkin6-percent');assert(admitted,'percentage trainer admitted');
 assert.equal(admitted.version,'1.0.0');assert.equal(admitted.file,'trainers/vilenkin6-percent/index.html');assert.equal(admitted.stateSchemaVersion,1);assert.equal(admitted.bridgeProtocolVersion,1);assert.equal(admitted.allowLegacyHtml,false);
 const publishedUnits=await publicJSON(origin+'/courses/vilenkin-6-part-1/textbook-data/units-A.json');assert.deepEqual(publishedUnits.find(u=>u.id===2),D,'published source equals reviewed source');assert.equal(D.tasks.length,8);
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 const teacherContext=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'}),studentContext=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
 for(const context of [teacherContext,studentContext])await context.route('**/*',async route=>{
  const req=route.request(),u=new URL(req.url()),method=req.method();
  if(['GET','HEAD','OPTIONS'].includes(method))return route.continue();
  if(u.origin===backend&&method==='POST'&&u.pathname==='/api/rooms'){createdRooms++;if(createdRooms===1)return route.continue();}
  if(u.origin===backend&&method==='POST'&&u.pathname==='/socket.io/')return route.continue();
  blockedWrites.push({method,origin:u.origin,path:u.pathname});return route.abort('blockedbyclient');
 });
 const teacher=await teacherContext.newPage(),student=await studentContext.newPage();for(const p of [teacher,student]){p.setDefaultTimeout(20000);p.on('pageerror',e=>errors.push(safeError(e)));}
 await teacher.goto(origin+'/trainers/trainer-board.html?trainer='+encodeURIComponent('/trainers/vilenkin6-percent/index.html?task='+D.tasks[3].id));
 assert.equal(await teacher.evaluate(()=>publicSnapshot().pages.length),1,'fresh context has one board page');assert.equal(await teacher.evaluate(()=>publicSnapshot().pages.every(p=>p.strokes.length===0)),true,'fresh context has no personal ink');
 await teacher.locator('#openShare').click();await teacher.locator('#createRoom').click();await teacher.waitForFunction(()=>document.querySelector('#studentLink').value.includes('room='));const studentURL=await teacher.locator('#studentLink').inputValue();await teacher.keyboard.press('Escape');await student.goto(studentURL);
 let a=await frame(teacher),b=await frame(student);await same(a,b);assert.equal((await state(a)).taskId,D.tasks[3].id);
 const storage=f=>f.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([key])=>/vilenkin|learning|cabinet/.test(key))));const beforeStorage=await storage(a);
 await action(a,b,()=>a.locator('#task').selectOption(D.tasks[0].id));
 await action(a,b,()=>a.locator('#answer').fill('1'));await action(a,b,()=>a.locator('#check').click());assert(await a.locator('#hint').isHidden());
 await action(a,b,()=>a.locator('#check').click());assert(await b.locator('#hint').isVisible());await action(a,b,()=>a.locator('#hint').click());
 await action(a,b,()=>a.locator('#notes').fill('37 % = 37/100'));await action(a,b,()=>a.locator('#rules > summary').click());
 const expected=[['37/100','0,37'],['3,4','85'],['0,75','75'],['4','400'],['0,2','20'],['40','4,5','180'],['5','500'],['6','0,02','2']];
 assert.equal(expected.flat().length,18);
 for(let i=0;i<D.tasks.length;i++){
  if(i)await action(a,b,()=>a.locator('#task').selectOption(D.tasks[i].id));assert.equal(await b.locator('#condition').innerHTML(),await b.evaluate(prompt=>TextbookMath.fmt(prompt),D.tasks[i].prompt));
  if(D.tasks[i].role!=='learn')await action(a,b,()=>a.locator('#guided').click());
  for(const answer of expected[i]){await action(a,b,()=>a.locator('#answer').fill(answer));await action(a,b,()=>a.locator('#check').click());}
  assert.equal((await state(b)).works[D.tasks[i].id].complete,true);assert.equal(await b.locator('#history li').count(),expected[i].length);
 }
 await teacher.locator('#boardControlToggle').click();await student.waitForFunction(()=>canWrite());
 await action(b,a,()=>b.locator('#task').selectOption(D.tasks[3].id));await action(b,a,()=>b.locator('#repeat').click());
 await action(b,a,()=>b.locator('#answer').fill('400'));await action(b,a,()=>b.locator('#check').click());await action(b,a,()=>b.locator('#notes').fill('2 % — 8 человек; 100 % — 400 человек'));
 const canvas=student.locator('#canvas');await canvas.scrollIntoViewIfNeeded();const box=await canvas.boundingBox();await student.mouse.move(box.x+70,box.y+80);await student.mouse.down();await student.mouse.move(box.x+190,box.y+120,{steps:8});await student.mouse.up();await teacher.waitForFunction(()=>publicSnapshot().pages[0].strokes.length>0);
 const strokes=p=>p.evaluate(()=>publicSnapshot().pages[0].strokes.map(({createdAt,...v})=>v));assert.deepEqual(await strokes(teacher),await strokes(student));
 await student.reload();b=await frame(student);await same(a,b);assert.deepEqual(await strokes(teacher),await strokes(student));assert.deepEqual(await storage(a),beforeStorage);
 const mobile=await teacherContext.newPage();mobile.on('pageerror',e=>errors.push(safeError(e)));
 for(const width of [320,390,1280]){
  await mobile.setViewportSize({width,height:900});await mobile.goto(origin+'/trainers/vilenkin6-percent/index.html?task='+D.tasks[4].id);await mobile.locator('#workspace').waitFor({state:'visible'});
  assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const condition=await mobile.locator('#condition').boundingBox();assert(condition.y+condition.height<900);
  if(process.env.PERCENT_SCREENSHOT_DIR){fs.mkdirSync(process.env.PERCENT_SCREENSHOT_DIR,{recursive:true});await mobile.screenshot({path:path.join(process.env.PERCENT_SCREENSHOT_DIR,'percent-'+width+'.png')});}
 }
 assert.equal(createdRooms,1);assert.deepEqual(blockedWrites,[],'no unexpected HTTP writes');
 const healthAfter=await publicJSON(backend+'/health');assert.equal(healthAfter.serverStartedAt,health.serverStartedAt,'server stable throughout live test');assert.equal(healthAfter.registryDigest,expectedDigest);assert.equal(healthAfter.progressRegistryDigest,health.progressRegistryDigest);assert.equal(healthAfter.progressStoreReady,true);assert.equal(healthAfter.progressPersistenceConfirmed,true);
 if(process.env.PERCENT_SCREENSHOT_DIR){fs.mkdirSync(process.env.PERCENT_SCREENSHOT_DIR,{recursive:true});await teacher.screenshot({path:path.join(process.env.PERCENT_SCREENSHOT_DIR,'production-teacher.png')});await student.screenshot({path:path.join(process.env.PERCENT_SCREENSHOT_DIR,'production-student.png')});fs.writeFileSync(path.join(process.env.PERCENT_SCREENSHOT_DIR,'production-verification.json'),JSON.stringify({sourceCommit:'5a9d2416a0e9eace137c20ebacd0293e1facc419',checkedAt:new Date().toISOString(),serverStartedAt:health.serverStartedAt,registryDigest:health.registryDigest,registryEntries:health.registryEntryCount,tasks:D.tasks.length,steps:expected.reduce((n,a)=>n+a.length,0),freshAnonymousContexts:2,createdRooms,blockedWrites,matchedVisibleState:true,hintsAfterTwoErrors:true,reverseControl:true,sharedInk:true,studentReload:true},null,2)+'\n');}
 assert.deepEqual(errors,[]);console.log('VILENKIN6_PERCENT_PRODUCTION_OK: 8 exact source tasks, 18 steps, real paired Socket.IO boards, hints, notes, rules, reverse control, ink, reload, no personal progress writes, 320/390/1280 layout');
}finally{if(browser)await browser.close();}})().catch(e=>{console.error(safeError(e));process.exitCode=1;});
