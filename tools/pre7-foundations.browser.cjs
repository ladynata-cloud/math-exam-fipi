'use strict';
// Synthetic local learners only; two origins exercise the real managed iframe.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {createRequire}=require('node:module'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),serverRequire=createRequire(path.join(ROOT,'board-server/package.json')),express=serverRequire('express');
const {LearningStore}=require('../board-server/learning-store'),{createLearningApi}=require('../board-server/learning-api'),{createTeachingRouter}=require('../board-server/learning-teaching'),{hashPassword}=require('../board-server/learning-auth');
const contracts=require('../board-server/learning-contracts'),catalog=require('../learning/catalog');
const listen=app=>new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));}),close=s=>new Promise(resolve=>{s.closeAllConnections();s.close(resolve);});
const api=(page,route,body)=>page.evaluate(async({route,body})=>LearningApp.api(route,body===undefined?{}:{method:'POST',body:JSON.stringify(body)}),{route,body});
const frame=page=>page.frameLocator('#trainer-host iframe');
async function ready(page){await page.locator('#trainer-host iframe').waitFor();await page.waitForFunction(()=>document.querySelector('#trainer-host .frame-status')?.hidden);}
async function saved(page){await page.waitForFunction(()=>document.querySelector('#save-state')?.textContent==='Все изменения сохранены');}
async function navigate(page,route){await page.evaluate(route=>LearningApp.navigate(route),route);}
async function until(page,id,accept){for(let i=0;i<100;i++){const attempt=await api(page,'/attempts/'+id);if(accept(attempt))return attempt;await new Promise(resolve=>setTimeout(resolve,70));}throw new Error('Persistent state did not reach expected value: '+id);}
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pre7-models-')),store=new LearningStore({filePath:path.join(dir,'learning.sqlite'),contracts});assert(store.available);
 const password='Synthetic-pre7-browser-2026',invite=store.bootstrap({login:'fixture_pre7_teacher',name:'Fixture teacher'}),teacher=store.activate(invite.invitationToken,await hashPassword(password)).account;
 const invitation=store.createStudent(teacher,{login:'fixture_pre7_student',name:'Fixture learner'}),student=store.activate(invitation.invitationToken,await hashPassword(password,'student')).account;
 const trainerApp=express();trainerApp.use(express.static(ROOT));const trainerServer=await listen(trainerApp),trainerOrigin='http://127.0.0.1:'+trainerServer.address().port;
 const app=express();app.use(express.json({limit:'200kb'}));const server=await listen(app),origin='http://127.0.0.1:'+server.address().port;
 app.get('/api/learning/status',(_req,res)=>res.json({...store.status(),trainerOrigin}));const learning=createLearningApi({store,publicOrigin:origin,secureCookies:false});app.use('/api/learning',learning.router,createTeachingRouter(learning));app.use(express.static(ROOT));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});const errors=[],external=[];
 try{
  async function open(login){const context=await browser.newContext({viewport:{width:1300,height:1000},locale:'ru-RU'});await context.route('**/*',request=>{const u=new URL(request.request().url());if(['127.0.0.1','localhost'].includes(u.hostname)||['data:','blob:'].includes(u.protocol))return request.continue();external.push(u.origin+u.pathname);return request.abort();});const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/learning/');await page.locator('#auth-form [name=login]').fill(login);await page.locator('#auth-form [name=password]').fill(password);await page.locator('#auth-form [type=submit]').click();await page.locator('#navigation').waitFor();if(await page.locator('[data-mw-close]').isVisible())await page.locator('[data-mw-close]').click();return page;}
  const pupil=await open(student.login),tutor=await open(teacher.login),items=catalog.items.filter(x=>x.pre7);
  assert.equal(items.length,18);
  for(const item of items){await navigate(pupil,'practice='+encodeURIComponent(item.id));await pupil.getByRole('heading',{name:item.title,exact:true}).waitFor();assert.equal(await pupil.locator('[data-practice-start]').count(),1);}
  assert.equal((await api(pupil,'/attempts')).attempts.length,0,'reading cards does not create progress');
  for(const item of items){
   await navigate(pupil,'practice='+encodeURIComponent(item.id));await pupil.locator('[data-practice-start]').click();await ready(pupil);const attemptId=new URLSearchParams(new URL(pupil.url()).hash.slice(1)).get('attempt');assert(attemptId);
   await frame(pupil).locator('[data-stage="1"]').click();await saved(pupil);
   assert.equal(await frame(pupil).locator('[data-pre7-drawing]').count(),1,item.id);
   const selection=frame(pupil).locator('[data-pre7-select]').first(),selected=await selection.getAttribute('data-pre7-select');await selection.press('Space');await saved(pupil);
   await frame(pupil).locator('[data-pre7-next]').click();await saved(pupil);await frame(pupil).locator('[data-pre7-next]').click();await saved(pupil);
   const model=(await until(pupil,attemptId,a=>a.state.work.model?.revealed===2)).state.work.model;assert.equal(model.selected,selected);
   await pupil.reload();await ready(pupil);assert.equal(await frame(pupil).locator('[data-pre7-select][aria-pressed=true]').getAttribute('data-pre7-select'),selected);assert.equal(await frame(pupil).locator('[data-pre7-steps] li').count(),2);
   await navigate(tutor,'attempt='+attemptId);await ready(tutor);assert.equal(await frame(tutor).locator('#main').evaluate(el=>el.inert),true);
   assert.equal(await frame(tutor).locator('[data-pre7-drawing]').innerHTML(),await frame(pupil).locator('[data-pre7-drawing]').innerHTML());
   await tutor.locator('#trainer-control').click();await tutor.waitForFunction(()=>document.querySelector('#trainer-control')?.textContent.includes('Вернуть'));await frame(tutor).locator('[data-pre7-select]').nth(1).click();await saved(tutor);
   const teacherModel=(await api(tutor,'/attempts/'+attemptId)).state.work.model;await pupil.waitForFunction(()=>document.querySelector('#trainer-host .frame-status')?.hidden);await frame(pupil).locator('[data-pre7-select][aria-pressed=true]').filter({hasText:await frame(tutor).locator('[data-pre7-select][aria-pressed=true]').innerText()}).waitFor();assert.equal(await frame(pupil).locator('[data-pre7-next]').isDisabled(),true);
   await tutor.locator('#trainer-control').click();await tutor.waitForFunction(()=>document.querySelector('#trainer-control')?.textContent.includes('Подключиться'));
   await pupil.waitForFunction(()=>!document.querySelector('#trainer-host iframe')?.contentDocument); // Cross-origin boundary remains opaque to cabinet JS.
   for(let i=0;i<100&&await frame(pupil).locator('[data-pre7-clear]').isDisabled();i++)await new Promise(resolve=>setTimeout(resolve,70));
   assert.equal(await frame(pupil).locator('[data-pre7-clear]').isDisabled(),false);await frame(pupil).locator('[data-pre7-clear]').click();await saved(pupil);
   await frame(pupil).locator('[data-stage="2"]').click();await saved(pupil);let before=await api(pupil,'/attempts/'+attemptId);if(before.taskSpec.task.steps[0].choices){const wrong=before.taskSpec.task.steps[0].choices.find(c=>c.value!==String(before.taskSpec.task.steps[0].a));await frame(pupil).locator('[data-answer-choice="'+wrong.value+'"]').click();}else await frame(pupil).locator('#answer').fill('99999999');await frame(pupil).locator('#answerForm button.primary').click();await saved(pupil);await until(pupil,attemptId,a=>a.state.work.attempted);
   await frame(pupil).locator('#hint').click();await saved(pupil);let attempt=await api(pupil,'/attempts/'+attemptId);assert(attempt.state.work.help);
   const answer=await frame(pupil).locator('#main').evaluate((_el,task)=>PathData.answerText(task.steps[0]),attempt.taskSpec.task);if(attempt.taskSpec.task.steps[0].choices){await frame(pupil).locator('[data-answer-choice="'+answer+'"]').click();await frame(pupil).locator('#answerForm button.primary').click();}else{await frame(pupil).locator('#answer').fill(answer);await frame(pupil).locator('#answer').press('Enter');}await saved(pupil);await until(pupil,attemptId,a=>a.state.work.step===1);
   await pupil.reload();await ready(pupil);assert.equal(await frame(pupil).locator('.steps li').count(),1,'previous solution line survives reload');
   await pupil.setViewportSize({width:390,height:844});assert(await pupil.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert(await frame(pupil).locator('#main').evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),item.id+' mobile width');await pupil.setViewportSize({width:1300,height:1000});
   await pupil.locator('[data-submit-attempt]').click();await pupil.waitForFunction(()=>document.querySelector('[data-submit-attempt]')?.textContent==='Работа сдана');const submitted=await api(tutor,'/attempts/'+attemptId);assert.equal(submitted.submission.status,'submitted');assert.equal(submitted.assistance.teacher,true);assert.notEqual(submitted.outcome,'independent');assert(teacherModel.selected);
  }
  const publicPage=await browser.newPage({viewport:{width:390,height:844}});await publicPage.goto(trainerOrigin+'/grade7/#new-pre7');assert.equal(await publicPage.locator('#new-pre7 .practice-card').count(),18);assert(await publicPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log('PRE7_FOUNDATIONS_BROWSER_OK: all18 task-bound models, selection+hint restoration, teacher observation/control/handoff, incorrect+correct answers, persistent solution prefixes, mobile fit, one-click submission.');
 }finally{await browser.close();await close(server);await close(trainerServer);store.close();fs.rmSync(dir,{recursive:true,force:true});}
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
