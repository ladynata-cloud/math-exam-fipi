'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),C=require('../../stereo-course/data/course.json'),T=require('../../stereo-course/assets/tasks.js'),A=require('../../stereo-course/assets/answer.js');
const http=require('node:http');
const root=path.resolve(__dirname,'../..'),out=process.env.ATANASYAN_AUDIT_ARTIFACTS||path.join(require('os').tmpdir(),'mathexam-atanasyan-audit');fs.mkdirSync(out,{recursive:true});
const invalid=a=>Array.isArray(a)?'1,2,3':typeof a==='string'?'пока не знаю':'1/';
const wrong=a=>Array.isArray(a)?a.map(n=>n+137).join(';'):typeof a==='string'?(a==='да'?'нет':a==='нет'?'да':a==='эллипс'?'парабола':'эллипс'):String(a+137);
async function assertTaskStart(page,label){
 assert.equal(await page.evaluate(()=>document.activeElement?.id),'task-title',label+' focuses the task heading');
 assert(await page.locator('.task-question').evaluate(el=>{const b=el.getBoundingClientRect();return b.top>=-1&&b.bottom<=innerHeight+1;}),label+' shows the complete new or restored condition in the viewport');
}
(async()=>{
 // Exercise the generated standalone lesson on a stable web origin, as on Pages.
 // file:// storage can disappear before application boot during a Chromium reload.
 const server=http.createServer((request,response)=>{
  try{
   let file=path.resolve(root,'.'+decodeURIComponent(new URL(request.url,'http://localhost').pathname));
   if(!file.startsWith(root+path.sep)){response.writeHead(403).end();return;}
   if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
   response.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');
   response.end(fs.readFileSync(file));
  }catch(_){response.writeHead(404).end();}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 const base='http://127.0.0.1:'+server.address().port+'/stereo-course/index.html';
 let browser;
 try{browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});}catch(error){await new Promise(resolve=>server.close(resolve));throw error;}
 const errors=[],evidence=[];let active=null;
 try{
  for(const width of [320,1280]){
   const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   const read=id=>page.evaluate(id=>JSON.parse(localStorage.getItem('mathExamStereo.v1')).units[id],id);
   const completedUnits=[];
   for(const u of C.units){
    active={id:u.id,width,stage:'open'};
    await page.goto(base+'#'+u.id);await page.reload();const initial=await read(u.id),t=T.make(u.task,initial.seed);
    await page.locator('#answer').fill(invalid(t.a));await page.locator('#answer-form button').click();let r=await read(u.id);assert.equal(r.checked,false);assert.equal(r.assisted,false);assert.equal(r.taskFirst.coach.errors,0);
    active.stage='format-before-reload';active.beforeReload=await read(u.id);assert.equal(active.beforeReload.taskFirst.mainDraft,invalid(t.a),u.id+'/'+width+' draft is persisted before reload');
    const previousUnits=await page.evaluate(ids=>{const units=JSON.parse(localStorage.getItem('mathExamStereo.v1')).units;return Object.fromEntries(ids.map(id=>[id,units[id]]));},completedUnits);
    for(const id of completedUnits)assert.ok(previousUnits[id],u.id+'/'+width+' keeps earlier topic '+id+' after navigation');
    await page.reload();active.stage='format-after-reload';active.afterReload=await read(u.id);assert.equal(active.afterReload.taskFirst.mainDraft,invalid(t.a),u.id+'/'+width+' persisted draft survives reload');
    assert.deepEqual(await page.evaluate(ids=>{const units=JSON.parse(localStorage.getItem('mathExamStereo.v1')).units;return Object.fromEntries(ids.map(id=>[id,units[id]]));},completedUnits),previousUnits,u.id+'/'+width+' reload preserves earlier topics');
    assert.equal(await page.locator('#answer').inputValue(),invalid(t.a));await page.locator('#answer').fill(wrong(t.a));await page.locator('#answer-form button').click();assert.equal(await page.locator('#coach-offer').isVisible(),false);await page.locator('#answer-form button').click();assert.equal(await page.locator('#coach-offer').isVisible(),true);r=await read(u.id);assert.equal(r.hints,0);assert.equal(r.taskFirst.coach.errors,2);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'feedback fits '+u.id+'/'+width);
    if(['sections','projection','sphere','vectors','conic-sections'].includes(u.id))await page.screenshot({path:path.join(out,'stereo-feedback-'+u.id+'-'+width+'.png'),fullPage:true});
    const diagnosis=await page.locator('#feedback').innerText();await page.locator('[data-action=coach-help]').click();assert.equal((await read(u.id)).hints,1);await page.locator('#task-guide>summary').click();await page.locator('#step-answer').fill(A.format(t.steps[0].a));await page.locator('#step-answer-form button').click();await page.locator('#step-answer').fill('Незавершённый шаг');
    await page.locator('[data-action=fresh-practice]').click();await assertTaskStart(page,u.id+'/'+width+' new');r=await read(u.id);assert.equal(r.taskHistory.length,1);assert.equal(r.taskHistory[0].mainDraft,wrong(t.a));assert.equal(r.taskHistory[0].stepDraft,'Незавершённый шаг');assert.equal(r.assisted,false);
    await page.locator('.attempt-history>summary').click();await page.locator('.attempt-history>details>summary').first().click();await page.locator('[data-action=resume-attempt]').first().click();await assertTaskStart(page,u.id+'/'+width+' resume');r=await read(u.id);assert.equal(r.seed,initial.seed);assert.equal(r.taskStep,1);assert.equal(r.repeatedTask,true);assert.equal(await page.locator('#answer').inputValue(),wrong(t.a));assert.equal(await page.locator('#step-answer').inputValue(),'Незавершённый шаг');
    active.stage='restored-before-reload';active.beforeReload=await read(u.id);assert.equal(active.beforeReload.taskFirst.stepDraft,'Незавершённый шаг',u.id+'/'+width+' restored draft is persisted before reload');
    await page.reload();active.stage='restored-after-reload';active.afterReload=await read(u.id);active.rendered=await page.evaluate(()=>{const input=document.getElementById('step-answer'),notice=document.getElementById('storage-notice');return {url:location.href,readyState:document.readyState,value:input?.value,attribute:input?.getAttribute('value'),defaultValue:input?.defaultValue,notice:notice?.hidden?null:notice?.textContent};});assert.equal(active.afterReload.taskFirst.stepDraft,'Незавершённый шаг',u.id+'/'+width+' persisted draft survives reload');assert.equal(await page.locator('#step-answer').inputValue(),'Незавершённый шаг',u.id+'/'+width+' rendered draft agrees with persisted work after reload');await page.locator('#answer').fill(A.format(t.a));await page.locator('#answer-form button').click();assert.equal((await read(u.id)).independent,initial.independent);
    completedUnits.push(u.id);
    evidence.push({id:u.id,width,diagnosis,formatDoesNotCount:true,helpOfferAfterTwo:true,explicitHelpTracked:true,firstResponseRetained:true,unfinishedStepRestored:true,noRepeatedCredit:true});
   }
   // A format repair keeps independent eligibility in the actual trainer.
   await page.goto(base+'#projection');await page.reload();await page.locator('[data-action=fresh-practice]').click();const pending=await read('projection'),task=T.make('projection',pending.seed);assert.equal(pending.repeatedTask,false);await page.locator('#answer').fill('sqrt(');await page.locator('#answer-form button').click();assert.equal((await read('projection')).checked,false);await page.locator('#answer').fill(A.format(task.a));await page.locator('#answer-form button').click();assert.equal((await read('projection')).independent,pending.independent+1);
   await context.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'stereo-feedback-evidence.json'),JSON.stringify({evidence,errors},null,2));console.log('STEREO_TASK_FEEDBACK_BROWSER_OK:78actualtrainerjourneys, formatting, authored diagnosis, help, resume, credit,320/1280');
 }catch(error){fs.writeFileSync(path.join(out,'stereo-feedback-failure.json'),JSON.stringify({head:process.env.GITHUB_SHA||null,active,evidence,errors,failure:String(error.stack||error)},null,2));throw error;}finally{try{await browser.close();}finally{await new Promise(resolve=>server.close(resolve));}}
})().catch(e=>{console.error(e);process.exitCode=1;});
