'use strict';
// Full two-origin cabinet/trainer exercise with local API and isolated SQLite.
// All identities and credentials are synthetic. Public requests are blocked.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const express=require('node:module').createRequire(path.resolve(__dirname,'../board-server/package.json'))('express'),{chromium}=require('playwright');
const {LearningStore}=require('../board-server/learning-store'),{createLearningApi}=require('../board-server/learning-api'),{createTeachingRouter}=require('../board-server/learning-teaching'),{hashPassword}=require('../board-server/learning-auth'),contracts=require('../board-server/learning-contracts');
const root=path.resolve(__dirname,'..'),units=['A','B','C','D'].flatMap(p=>require('../courses/vilenkin-6-part-1/textbook-data/units-'+p+'.json')),manifest=require('../learning/vilenkin6-textbook-catalog');
const task=units.find(u=>u.id===6).tasks.find(t=>t.role==='practice'),password='Synthetic-Textbook-Browser-2026',oldMarker='Индивидуальный маршрут: только НОК и НОД.';
const listen=app=>new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));}),close=s=>s?new Promise(r=>{s.closeAllConnections();s.close(r);}):Promise.resolve();
async function until(fn,label){const end=Date.now()+15000;while(Date.now()<end){if(await fn())return;await new Promise(r=>setTimeout(r,50));}throw Error('Timed out: '+label);}
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'vilenkin-textbook-browser-')),filePath=path.join(dir,'learning.sqlite');let store,server,trainerServer,browser;
 const errors=[],checks=[],debug={};
 try{
  store=new LearningStore({filePath,contracts});assert(store.available);
  const teacher=store.activate(store.bootstrap({login:'book_browser_teacher',name:'Преподаватель проверки'}).invitationToken,await hashPassword(password)).account;
  async function pupil(login){return store.activate(store.createStudent(teacher,{login,name:'Учебный профиль проверки'}).invitationToken,await hashPassword(password,'student')).account;}
  const student=await pupil('book_browser_pupil'),peer=await pupil('book_browser_peer');
  for(const person of [student,peer])store.saveStudentProfile(teacher,person.id,{opId:crypto.randomUUID(),expectedVersion:0,course:'vilenkin6',goal:null,focus:'Сохрани прежнюю работу.\n'+oldMarker});
  const old=store.createAttempt(student,{opId:crypto.randomUUID(),trainerId:'vilenkin6-part1',contentId:'lesson-1'}).attempt,oldBefore=JSON.stringify(store.getAttempt(student,old.id));
  const trainer=express();trainer.use(express.static(root));trainerServer=await listen(trainer);const trainerOrigin='http://127.0.0.1:'+trainerServer.address().port;
  const app=express();app.use(express.json({limit:'200kb'}));server=await listen(app);const origin='http://127.0.0.1:'+server.address().port;
  app.get('/api/learning/status',(_req,res)=>res.json({...store.status(),trainerOrigin}));const learning=createLearningApi({store,publicOrigin:origin,secureCookies:false});app.use('/api/learning',learning.router,createTeachingRouter(learning));app.use(express.static(root));
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--disable-background-networking']});
  async function login(person){const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'ru-RU'});await context.route('**/*',route=>{const u=new URL(route.request().url());return [origin,trainerOrigin].includes(u.origin)||['data:','blob:','about:'].includes(u.protocol)?route.continue():route.abort();});
   await context.addInitScript(()=>localStorage.setItem('mathexam-vilenkin6-textbook-2024-v1','public-sentinel'));
   const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{window.fixtureEvents=[];['click','submit'].forEach(type=>document.addEventListener(type,e=>window.fixtureEvents.push({type,target:e.target.outerHTML?.slice(0,180),readOnly:document.body?.dataset.managedReadonly,blocked:e.defaultPrevented}),true));window.fixtureChanges=[];addEventListener('message',e=>{if(e.data?.type==='change')window.fixtureChanges.push(e.data.payload);});});await page.goto(origin+'/learning/#home');await page.locator('#auth-form [name=login]').fill(person.login);await page.locator('#auth-form [name=password]').fill(password);await page.locator('#auth-form [type=submit]').click();await page.locator('#navigation').waitFor();return page;}
  const page=await login(student),teacherPage=await login(teacher);
  await teacherPage.evaluate(id=>LearningApp.navigate('student='+id),student.id);await teacherPage.locator('#teaching-profile [name=routeMode]').selectOption('vilenkin-textbook');await teacherPage.locator('#teaching-profile [type=submit]').click();await until(()=>store.studentProfile(teacher,student.id).focus.includes('Курс в кабинете: Виленкин'),'teacher profile save');
  assert(store.studentProfile(teacher,peer.id).focus.includes(oldMarker));assert.equal(JSON.stringify(store.getAttempt(student,old.id)),oldBefore);checks.push('Versioned teacher mode changes only selected synthetic pupil; old27 attempt intact');
  let frame;async function managedFrame(target,{selector='#answer',readOnly=false}={}){
   // The iframe element appears before its document navigates. FrameLocator
   // retries across that navigation and waits for actual managed hydration.
   const child=target.frameLocator('#trainer-host iframe');await child.locator('body[data-managed-readonly="'+readOnly+'"]').waitFor();await child.locator(selector).first().waitFor();
   const loaded=target.frames().find(f=>f.url().startsWith(trainerOrigin));assert(loaded,'Hydrated trainer frame must exist');return loaded;
  }
  async function ready(options){frame=await managedFrame(page,options);}
  // Hold only the first trainer document to reproduce the former readiness
  // race deterministically; cabinet/API requests and assets remain untouched.
  let navigationHeld=false,navigationExpired=false,releaseNavigation;const navigationGate=new Promise(resolve=>releaseNavigation=resolve);
  await page.route(trainerOrigin+'/courses/vilenkin-6-part-1/textbook.html*',async route=>{navigationHeld=true;const timeout=setTimeout(()=>{navigationExpired=true;releaseNavigation();},15000);try{await navigationGate;await route.continue();}finally{clearTimeout(timeout);}},{times:1});
  let initialReady;
  try{
   await page.reload();await page.locator('[data-attached-course-open]').click();await page.locator('[data-vilenkin-textbook-unit="6"] summary').click();const button=page.locator('[data-vilenkin-textbook-open="vilenkin6-textbook:'+task.id+'"]');await button.click();
   await until(()=>navigationHeld,'held first trainer document');await page.locator('#trainer-host iframe').waitFor();
   assert.equal(page.frames().find(f=>f.url().startsWith(trainerOrigin)),undefined,'Visible iframe has not navigated to the trainer yet');
   assert.throws(()=>page.frames().find(f=>f.url().startsWith(trainerOrigin)).locator('#answer'),TypeError,'Former readiness lookup fails before child navigation');
   initialReady=ready();assert.equal(await Promise.race([initialReady.then(()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),100))]),false,'Hydration wait must remain pending while the document is held');assert.equal(navigationExpired,false,'Navigation hold must not expire');
  }finally{releaseNavigation();}
  await initialReady;checks.push('Held trainer navigation reproduces old lookup race; hydration wait resumes only after release');debug.page=page;debug.frame=frame;let id=new URLSearchParams(new URL(page.url()).hash.slice(1)).get('attempt');debug.id=id;assert(id);assert.equal(store.getAttempt(student,id).trainerId,'vilenkin6-textbook');assert.match(await frame.locator('.condition').innerText(),/Пункт 6/);assert.match(await frame.locator('.condition').innerText(),/§ 2/);
  await frame.locator('#answer').fill('2 · 3');await until(()=>store.getAttempt(student,id).state.task.draft==='2 · 3','cloud draft');
  await page.reload();await ready();assert.equal(await frame.locator('#answer').inputValue(),'2 · 3');const other=await login(student);await other.evaluate(id=>LearningApp.navigate('attempt='+id),id);const second=await managedFrame(other);assert.equal(await second.locator('#answer').inputValue(),'2 · 3');await other.context().close();checks.push('Typed source task resumes after reload and on another device');
  await frame.locator('[data-v6-support="prime-table"] > summary').click();await until(()=>store.getAttempt(student,id).state.task.helped,'prime assistance save');assert.equal(await frame.locator('[data-v6-primes] li').count(),25);await frame.locator('[data-v6-prime-limit]').selectOption('1000');assert.equal(await frame.locator('[data-v6-primes] li').count(),168);

  await frame.locator('[data-v6-support="prerequisites"] > summary').click();
  const divide=frame.locator('[data-v6-practice=divide]');assert.equal(await divide.getAttribute('href'),'https://mathexam.space/trainers/long-division-stepwise.html');
  // Map only the fixed public reference URL to the same local fixture document.
  // The popup still inherits the real trainer sandbox and noopener behavior.
  await divide.evaluate((link,origin)=>link.href=origin+new URL(link.href).pathname,trainerOrigin);
  const opened=page.context().waitForEvent('page');await divide.click();const popup=await opened;await popup.locator('#answer').waitFor();assert.equal(await popup.evaluate(()=>opener),null);
  await popup.evaluate(()=>{window.submitChecks=0;document.querySelector('#answer-form').addEventListener('submit',()=>window.submitChecks++,true);});
  await popup.locator('#answer').fill('999999');await popup.locator('#primary').click();assert.equal(await popup.evaluate(()=>window.submitChecks),1,'Reference trainer can check answers inside the inherited popup sandbox');await popup.close();checks.push('Fixed reference opens noopener popup and division answer check works');
  await frame.locator('#answer').fill(String(Array.isArray(task.answer)?task.answer[0]:task.answer));await frame.locator('#answer-form [type=submit]').click();await until(()=>store.getAttempt(student,id).outcome==='hinted','helped completion');const firstDone=JSON.stringify(store.getAttempt(student,id));checks.push('Prime table marks assistance, real server grades exact answer and saves hinted outcome');
  await page.setViewportSize({width:390,height:844});await frame.waitForFunction(()=>document.documentElement.scrollWidth<=innerWidth+2);assert.equal(await frame.evaluate(()=>localStorage.getItem('mathexam-vilenkin6-textbook-2024-v1')),'public-sentinel');
  await frame.locator('[data-action=repeat]').click();await until(()=>new URLSearchParams(new URL(page.url()).hash.slice(1)).get('attempt')!==id,'fresh repeat route');const repeatedId=new URLSearchParams(new URL(page.url()).hash.slice(1)).get('attempt');await ready();assert.equal(await frame.locator('#answer').inputValue(),'');assert.equal(JSON.stringify(store.getAttempt(student,id)),firstDone);assert(store.getAttempt(student,repeatedId).state.task.repeated);
  await frame.locator('#answer').fill(String(Array.isArray(task.answer)?task.answer[0]:task.answer));await frame.locator('#answer-form [type=submit]').click();await until(()=>store.getAttempt(student,repeatedId).outcome==='practiced','repeat outcome');checks.push('Fresh repeated task preserves old solution and cannot claim unseen independent mastery');

  const manualUnit=units.find(u=>u.tasks.some(t=>t.role!=='learn'&&t.answerType==='self-check'&&t.selfCheck.length>1)),manual=manualUnit.tasks.find(t=>t.role!=='learn'&&t.answerType==='self-check'&&t.selfCheck.length>1);
  await page.evaluate(()=>LearningApp.navigate('vilenkin-textbook'));await page.locator('[data-vilenkin-textbook-unit="'+manualUnit.id+'"] summary').click();await page.locator('[data-vilenkin-textbook-open="vilenkin6-textbook:'+manual.id+'"]').click();await ready({selector:'[data-criterion]'});const manualId=new URLSearchParams(new URL(page.url()).hash.slice(1)).get('attempt');
  await frame.locator('#answer-form [type=submit]').click();await until(()=>store.getAttempt(student,manualId).state.task.feedback.final?.kind==='manual','incomplete checklist feedback');assert.equal(store.getAttempt(student,manualId).outcome,'started');
  await frame.locator('[data-criterion]').nth(1).check();await until(()=>store.getAttempt(student,manualId).state.task.manualChecks.final?.[1]===true,'out-of-order criterion');assert.equal(store.getAttempt(student,manualId).state.task.manualChecks.final[0],false);
  await page.reload();await ready({selector:'[data-criterion]'});assert.equal(await frame.locator('[data-criterion]').nth(1).isChecked(),true);assert.equal(await frame.locator('[data-criterion]').first().isChecked(),false);checks.push('Incomplete manual check and second-checkbox-first persist through actual API/reload without false grading');
  await page.evaluate(id=>LearningApp.navigate('attempt='+id),repeatedId);await ready({selector:'.condition'});
  const peerPage=await login(peer);const forbidden=await peerPage.evaluate(async id=>{const response=await fetch('/api/learning/attempts/'+id);return response.status;},id);assert([403,404].includes(forbidden));
  const a=store.getAttempt(student,repeatedId);store.action(teacher,repeatedId,{opId:crypto.randomUUID(),expectedVersion:a.version,type:'control',payload:{controller:'teacher'}});await page.reload();await ready({selector:'.condition',readOnly:true});const version=store.getAttempt(student,repeatedId).version;await frame.evaluate(()=>document.querySelector('[data-action=repeat]')?.click());await new Promise(r=>setTimeout(r,250));assert.equal(store.getAttempt(student,repeatedId).version,version);checks.push('Peer cannot read attempt; teacher control makes learner frame read-only');
  assert.equal(JSON.stringify(store.getAttempt(student,old.id)),oldBefore);assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'VILENKIN_TEXTBOOK_BROWSER_OK',tasks:manifest.length,checks,errors,publicRequestsAllowed:0},null,2));
 }catch(error){console.error(error);if(debug.id)console.error(JSON.stringify(store.getAttempt({id:store.row("SELECT id FROM accounts WHERE login='book_browser_pupil'").id,role:'student'},debug.id)));if(debug.page)console.error(await debug.page.locator('body').innerText());if(debug.page){console.error('CHANGES',JSON.stringify(await debug.page.evaluate(()=>window.fixtureChanges)));for(const f of debug.page.frames().slice(1)){console.error('ATTRS',await f.evaluate(()=>({body:document.body.dataset,html:document.documentElement.dataset,inert:document.querySelector('main')?.inert})));console.error('EVENTS',await f.evaluate(()=>window.fixtureEvents));console.error(await f.locator('body').innerText());}}process.exitCode=1;}finally{await browser?.close();await close(server);await close(trainerServer);store?.close();fs.rmSync(dir,{recursive:true,force:true});}
})();
