'use strict';
// Real local HTTP, SQLite and managed frames; all accounts/passwords synthetic.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {createRequire}=require('node:module'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),serverRequire=createRequire(path.join(ROOT,'board-server/package.json')),express=serverRequire('express');
const {LearningStore}=require('../board-server/learning-store'),{createLearningApi}=require('../board-server/learning-api'),{createTeachingRouter}=require('../board-server/learning-teaching'),{hashPassword}=require('../board-server/learning-auth');
const contracts=require('../board-server/learning-contracts'),catalog=require('../learning/catalog');
const password='Synthetic-grade7-browser-2026',op=()=>crypto.randomUUID(),listen=app=>new Promise(resolve=>{const server=app.listen(0,'127.0.0.1',()=>resolve(server));}),close=server=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);});
const api=(page,route,body)=>page.evaluate(async({route,body})=>LearningApp.api(route,body===undefined?{}:{method:'POST',body:JSON.stringify(body)}),{route,body});
const frame=page=>page.frameLocator('#trainer-host iframe');
async function ready(page){await page.locator('#trainer-host iframe').waitFor();await page.waitForFunction(()=>document.querySelector('#trainer-host .frame-status')?.hidden);}
async function saved(page){await page.waitForFunction(()=>document.querySelector('#save-state')?.textContent==='Все изменения сохранены');}
async function navigate(page,route){await page.evaluate(route=>LearningApp.navigate(route),route);}
async function waitAttempt(page,id,accept){let attempt;for(let n=0;n<100;n++){attempt=await api(page,'/attempts/'+id);if(accept(attempt))return attempt;await new Promise(resolve=>setTimeout(resolve,80));}return attempt;}
async function value(locator,expected){for(let n=0;n<80;n++){if(await locator.inputValue()===expected)return;await new Promise(resolve=>setTimeout(resolve,100));}assert.equal(await locator.inputValue(),expected);}
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'grade7-cabinet-')),store=new LearningStore({filePath:path.join(dir,'learning.sqlite'),contracts});assert(store.available);
 const teacherInvite=store.bootstrap({login:'fixture_g7_teacher',name:'Fixture teacher'}),teacher=store.activate(teacherInvite.invitationToken,await hashPassword(password)).account;
 const studentInvite=store.createStudent(teacher,{login:'fixture_g7_student',name:'Fixture pupil'}),student=store.activate(studentInvite.invitationToken,await hashPassword(password,'student')).account;
 const trainerApp=express();trainerApp.use(express.static(ROOT));const trainerServer=await listen(trainerApp),trainerOrigin='http://127.0.0.1:'+trainerServer.address().port;
 const app=express();app.use(express.json({limit:'200kb'}));const server=await listen(app),origin='http://127.0.0.1:'+server.address().port;
 app.get('/api/learning/status',(_req,res)=>res.json({...store.status(),trainerOrigin}));const learning=createLearningApi({store,publicOrigin:origin,secureCookies:false});app.use('/api/learning',learning.router,createTeachingRouter(learning));app.use(express.static(ROOT));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});const errors=[],external=[];
 try{
  async function open(login,route='home'){
   const context=await browser.newContext({viewport:{width:1300,height:1000},locale:'ru-RU'});await context.route('**/*',request=>{const url=new URL(request.request().url());if(['127.0.0.1','localhost'].includes(url.hostname)||['data:','blob:'].includes(url.protocol))return request.continue();external.push(url.origin+url.pathname);return request.abort();});
   const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/learning/#'+route);await page.locator('#auth-form [name=login]').fill(login);await page.locator('#auth-form [name=password]').fill(password);await page.locator('#auth-form [type=submit]').click();await page.locator('#navigation').waitFor();if(await page.locator('[data-mw-close]').isVisible())await page.locator('[data-mw-close]').click();return {page,context};
  }
  const items=catalog.items.filter(item=>item.grade7),entry='practice='+encodeURIComponent(items[0].id),learner=await open(student.login,entry),lp=learner.page;
  await lp.locator('[data-practice-start]').waitFor();assert.equal(new URL(lp.url()).hash,'#'+entry,'direct route survives private login');
  for(const item of items){await navigate(lp,'practice='+encodeURIComponent(item.id));await lp.getByRole('heading',{name:item.title,exact:true}).waitFor();assert.equal(await lp.locator('[data-practice-start]').count(),1);}
  assert.equal((await api(lp,'/attempts')).attempts.length,0,'opening every curriculum card creates no attempt or progress');
  await navigate(lp,'practice=path%3Anot-a-grade7-item');await lp.getByRole('heading',{name:'Эта тема пока недоступна'}).waitFor();assert.equal((await api(lp,'/attempts')).attempts.length,0);
  const teacherClient=await open(teacher.login),tp=teacherClient.page;
  await navigate(tp,'course');assert.equal(await tp.getByRole('link',{name:'Маршрут 7 класса и повторение основ →'}).getAttribute('href'),'/grade7/','teacher course link opens the public course instead of a learner-only route');
  for(const contentId of ['grade7-a-equation-two-brackets','grade7-g-angle-bisector','grade7-b-ratio-units']){
   await navigate(lp,'practice='+encodeURIComponent('path:'+contentId));await lp.locator('[data-practice-start]').click();await ready(lp);assert(!String(await lp.locator('#trainer-host iframe').getAttribute('sandbox')).includes('allow-forms'));assert.equal(await lp.locator('.learning-references').count(),0,'school attempts do not show an EGE reference sheet');const attemptId=new URLSearchParams(new URL(lp.url()).hash.slice(1)).get('attempt');assert(attemptId);
   await frame(lp).locator('#answer').fill('−3/7');await saved(lp);assert.equal((await api(lp,'/attempts/'+attemptId)).state.work.draft,'−3/7');
   await frame(lp).locator('[data-stage="2"]').click();await saved(lp);await frame(lp).locator('#hint').click();await saved(lp);
   let attempt=await api(lp,'/attempts/'+attemptId),first=attempt.taskSpec.task.steps[0],answer=String(first.a);if(typeof first.a==='number')answer=await frame(lp).locator('#main').evaluate((_el,task)=>PathData.answerText(task.steps[0]),attempt.taskSpec.task);
   if(first.choices)await frame(lp).locator('[data-answer-choice="'+answer+'"]').click();else await frame(lp).locator('#answer').fill(answer);await saved(lp);await frame(lp).locator('#answer').dispatchEvent('keydown',{key:'Enter',isComposing:true});assert.equal((await api(lp,'/attempts/'+attemptId)).state.work.step,0,'IME confirmation is not a check');if(contentId.startsWith('grade7-b-'))await frame(lp).locator('#answer').press('Enter');else await frame(lp).locator('#answerForm button.primary').click();await saved(lp);const checked=await waitAttempt(lp,attemptId,attempt=>attempt.state.work.step===1);assert.equal(checked.state.work.step,1,JSON.stringify({contentId,answer,first,state:checked.state,notice:await lp.locator('#notice').innerText(),feedback:await frame(lp).locator('#feedback').innerText()}));
   assert.equal((await api(lp,'/attempts/'+attemptId+'/history')).events.filter(event=>event.type==='check').length,1,'one user check creates one receipt');
   await navigate(tp,'attempt='+attemptId);await ready(tp);assert.equal(await frame(tp).locator('.steps li').count(),1);assert.equal(await frame(tp).locator('#main').evaluate(el=>el.inert),true);
   await tp.locator('#trainer-control').click();await tp.waitForFunction(()=>document.querySelector('#trainer-control')?.textContent.includes('Вернуть'));await frame(tp).locator('[data-stage="1"]').click();await saved(tp);
   if(contentId.startsWith('grade7-g-')){
    await frame(tp).locator('[data-geometry-select]').first().press('Space');await frame(tp).locator('[data-geometry-next]').click();await frame(tp).locator('[data-geometry-next]').click();await saved(tp);
    const expected=(await waitAttempt(tp,attemptId,attempt=>attempt.state.work.model?.revealed===2)).state.work.model;assert.equal(expected.revealed,2);assert.equal(typeof expected.selected,'string');
    await lp.waitForFunction(()=>document.querySelector('#trainer-host .frame-status')?.hidden);for(let n=0;n<80&&await frame(lp).locator('[data-geometry-steps] li').count()!==2;n++)await new Promise(resolve=>setTimeout(resolve,100));assert.equal(await frame(lp).locator('[data-geometry-steps] li').count(),2);
    assert.equal(await frame(tp).locator('[data-geometry-drawing]').innerHTML(),await frame(lp).locator('[data-geometry-drawing]').innerHTML());
    await lp.reload();await ready(lp);assert.equal(await frame(lp).locator('[data-geometry-steps] li').count(),2);assert.equal(await frame(lp).locator('[data-geometry-select][aria-pressed=true]').getAttribute('data-geometry-select'),expected.selected);
    assert.equal(await frame(lp).locator('[data-geometry-next]').isDisabled(),true,'student cannot mutate model while teacher controls');
   }else{
    const model=await frame(tp).locator('#model').innerText();assert(model.length>20);await frame(tp).locator('[data-stage="3"]').click();await frame(tp).locator('#answer').fill('19/4');await saved(tp);await value(frame(lp).locator('#answer'),'19/4');await lp.reload();await ready(lp);await value(frame(lp).locator('#answer'),'19/4');
   }
   await tp.locator('#trainer-control').click();await tp.waitForFunction(()=>document.querySelector('#trainer-control')?.textContent.includes('Подключиться'));for(let n=0;n<80&&await frame(lp).locator('#main').evaluate(el=>el.inert);n++)await new Promise(resolve=>setTimeout(resolve,100));assert.equal(await frame(lp).locator('#main').evaluate(el=>el.inert),false);
   if(contentId.startsWith('grade7-g-')){assert.equal(await frame(lp).locator('[data-geometry-clear]').isDisabled(),false,'handoff re-enables existing model buttons without losing state');await frame(lp).locator('[data-geometry-clear]').click();await saved(lp);assert.equal((await waitAttempt(lp,attemptId,attempt=>attempt.state.work.model?.selected===null)).state.work.model.selected,null);}
   await lp.locator('[data-submit-attempt]').click();await lp.waitForFunction(()=>document.querySelector('[data-submit-attempt]')?.textContent==='Работа сдана');const submitted=await api(tp,'/attempts/'+attemptId);assert.equal(submitted.submission.status,'submitted');assert.equal(submitted.assistance.teacher,true);assert.notEqual(submitted.outcome,'independent');
  }
  await navigate(lp,'route');await lp.locator('#route-grade7-algebra').waitFor();assert.equal(await lp.locator('[data-route-item^="path:grade7-"]').count(),24);await lp.setViewportSize({width:390,height:844});assert.equal(await lp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  await navigate(lp,'practice='+encodeURIComponent('path:grade7-g-angle-naming'));await lp.locator('[data-practice-start]').click();await ready(lp);await frame(lp).locator('[data-stage="2"]').click();await saved(lp);await frame(lp).locator('[data-answer-choice]').first().press('Space');await saved(lp);assert.equal(await frame(lp).locator('[data-answer-choice][aria-pressed=true]').count(),1);assert.equal(await frame(lp).locator('#main').evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'labelled choices fit a narrow managed frame');
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log('LEARNING_GRADE7_BROWSER_OK: 24 explicit entry cards; no automatic attempts; algebra/geometry/foundation durable work, hint and prefix, teacher takeover, keyboard geometry, cross-device reload and one-click submission.');
 }finally{await browser.close();await close(server);await close(trainerServer);store.close();fs.rmSync(dir,{recursive:true,force:true});}
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
