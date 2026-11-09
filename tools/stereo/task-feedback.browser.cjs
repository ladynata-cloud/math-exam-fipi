'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),C=require('../../stereo-course/data/course.json'),T=require('../../stereo-course/assets/tasks.js'),A=require('../../stereo-course/assets/answer.js');
const root=path.resolve(__dirname,'../..'),out=process.env.ATANASYAN_AUDIT_ARTIFACTS||path.join(require('os').tmpdir(),'mathexam-atanasyan-audit');fs.mkdirSync(out,{recursive:true});
const invalid=a=>Array.isArray(a)?'1,2,3':typeof a==='string'?'пока не знаю':'1/';
const wrong=a=>Array.isArray(a)?a.map(n=>n+137).join(';'):typeof a==='string'?(a==='да'?'нет':a==='нет'?'да':a==='эллипс'?'парабола':'эллипс'):String(a+137);
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox']}),errors=[],evidence=[];
 try{
  for(const width of [320,1280]){
   const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   const read=id=>page.evaluate(id=>JSON.parse(localStorage.getItem('mathExamStereo.v1')).units[id],id);
   for(const u of C.units){
    await page.goto('file://'+root+'/stereo-course/index.html#'+u.id);await page.reload();const initial=await read(u.id),t=T.make(u.task,initial.seed);
    await page.locator('#answer').fill(invalid(t.a));await page.locator('#answer-form button').click();let r=await read(u.id);assert.equal(r.checked,false);assert.equal(r.assisted,false);assert.equal(r.taskFirst.coach.errors,0);
    await page.reload();assert.equal(await page.locator('#answer').inputValue(),invalid(t.a));await page.locator('#answer').fill(wrong(t.a));await page.locator('#answer-form button').click();assert.equal(await page.locator('#coach-offer').isVisible(),false);await page.locator('#answer-form button').click();assert.equal(await page.locator('#coach-offer').isVisible(),true);r=await read(u.id);assert.equal(r.hints,0);assert.equal(r.taskFirst.coach.errors,2);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'feedback fits '+u.id+'/'+width);
    if(['sections','projection','sphere','vectors','conic-sections'].includes(u.id))await page.screenshot({path:path.join(out,'stereo-feedback-'+u.id+'-'+width+'.png'),fullPage:true});
    const diagnosis=await page.locator('#feedback').innerText();await page.locator('[data-action=coach-help]').click();assert.equal((await read(u.id)).hints,1);await page.locator('#task-guide>summary').click();await page.locator('#step-answer').fill(A.format(t.steps[0].a));await page.locator('#step-answer-form button').click();await page.locator('#step-answer').fill('Незавершённый шаг');
    await page.locator('[data-action=fresh-practice]').click();r=await read(u.id);assert.equal(r.taskHistory.length,1);assert.equal(r.taskHistory[0].mainDraft,wrong(t.a));assert.equal(r.taskHistory[0].stepDraft,'Незавершённый шаг');assert.equal(r.assisted,false);
    await page.locator('.attempt-history>summary').click();await page.locator('.attempt-history>details>summary').first().click();await page.locator('[data-action=resume-attempt]').first().click();r=await read(u.id);assert.equal(r.seed,initial.seed);assert.equal(r.taskStep,1);assert.equal(r.repeatedTask,true);assert.equal(await page.locator('#answer').inputValue(),wrong(t.a));assert.equal(await page.locator('#step-answer').inputValue(),'Незавершённый шаг');
    await page.reload();assert.equal(await page.locator('#step-answer').inputValue(),'Незавершённый шаг');await page.locator('#answer').fill(A.format(t.a));await page.locator('#answer-form button').click();assert.equal((await read(u.id)).independent,initial.independent);
    evidence.push({id:u.id,width,diagnosis,formatDoesNotCount:true,helpOfferAfterTwo:true,explicitHelpTracked:true,firstResponseRetained:true,unfinishedStepRestored:true,noRepeatedCredit:true});
   }
   // A format repair keeps independent eligibility in the actual trainer.
   await page.goto('file://'+root+'/stereo-course/index.html#projection');await page.reload();await page.locator('[data-action=fresh-practice]').click();const pending=await read('projection'),task=T.make('projection',pending.seed);assert.equal(pending.repeatedTask,false);await page.locator('#answer').fill('sqrt(');await page.locator('#answer-form button').click();assert.equal((await read('projection')).checked,false);await page.locator('#answer').fill(A.format(task.a));await page.locator('#answer-form button').click();assert.equal((await read('projection')).independent,pending.independent+1);
   await context.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'stereo-feedback-evidence.json'),JSON.stringify({evidence,errors},null,2));console.log('STEREO_TASK_FEEDBACK_BROWSER_OK:78actualtrainerjourneys, formatting, authored diagnosis, help, resume, credit,320/1280');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
