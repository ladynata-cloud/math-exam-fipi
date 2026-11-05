'use strict';
// Real cabinet, HTTP and isolated SQLite. No production accounts or room writes.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {createRequire}=require('node:module');
const ROOT=path.resolve(__dirname,'..'),serverRequire=createRequire(path.join(ROOT,'board-server/package.json'));
const express=serverRequire('express');
let chromium;try{({chromium}=require('playwright'));}catch(_){({chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright')));}
const {LearningStore}=require('../board-server/learning-store');
const {createLearningApi}=require('../board-server/learning-api');
const {createTeachingRouter}=require('../board-server/learning-teaching');
const {hashPassword}=require('../board-server/learning-auth');
const contracts=require('../board-server/learning-contracts');
const ids=['oge-task11-graphs-trainer','oge-task15-triangles','oge-task16-circle','oge-task17-quadrilaterals','oge-task18-grid','task19-trainer'];
const password='Synthetic-return-navigation-2026';
const listen=app=>new Promise(resolve=>{const server=app.listen(0,'127.0.0.1',()=>resolve(server));});
const close=server=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);});
(async()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'learning-public-return-'));
 const store=new LearningStore({filePath:path.join(tmp,'learning.sqlite'),contracts});assert(store.available);
 const invite=store.bootstrap({login:'fixture_return_teacher',name:'Return teacher'});
 const teacher=store.activate(invite.invitationToken,await hashPassword(password)).account;
 const pupilInvite=store.createStudent(teacher,{login:'fixture_return_pupil',name:'Return pupil'});
 const pupil=store.activate(pupilInvite.invitationToken,await hashPassword(password,'student')).account;
 store.saveStudentProfile(teacher,pupil.id,{opId:crypto.randomUUID(),expectedVersion:0,course:'oge',goal:'pass',focus:''});
 const publicApp=express();publicApp.use(express.static(ROOT));
 const publicServer=await listen(publicApp),publicOrigin='http://localhost:'+publicServer.address().port;
 const app=express();app.use(express.json());
 const server=await listen(app),origin='http://127.0.0.1:'+server.address().port;
 const learning=createLearningApi({store,publicOrigin:origin,secureCookies:false});
 app.get('/api/learning/status',(_req,res)=>res.json({...store.status(),trainerOrigin:publicOrigin}));
 app.use('/api/learning',learning.router,createTeachingRouter(learning));app.use(express.static(ROOT));
 const items=JSON.stringify([{catalogId:'path:equations-linear',reason:'Existing recommendation',priority:'normal'}]);
 const note=ids.map(id=>'https://mathexam.space/trainers/'+id+'.html').join('\n');
 store.run('INSERT INTO learning_plans VALUES(?,?,?,?,?)',pupil.id,teacher.id,items,note,store.clock());
 const initialPlan=store.row('SELECT * FROM learning_plans WHERE learner_id=?',pupil.id);
 const initialProfile=store.studentProfile(teacher,pupil.id);
 let browser;const errors=[],writes=[],leaks=[];
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
  async function login(person){
   const context=await browser.newContext({viewport:{width:1280,height:900},locale:'ru-RU'});
   await context.route('**/*',route=>{const u=new URL(route.request().url());return ['127.0.0.1','localhost'].includes(u.hostname)||['data:','blob:'].includes(u.protocol)?route.continue():route.abort();});
   const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',error=>errors.push(error.message));
   context.on('request',request=>{
    if(request.url().startsWith(publicOrigin)&&(request.url().includes(pupil.id)||request.url().includes(teacher.id)||(request.headers().referer||'').startsWith(origin)||request.headers().cookie))leaks.push(request.url());
    if(request.url().includes('/api/learning/')&&request.method()!=='GET'&&!request.url().endsWith('/login'))writes.push(request.url());
   });
   await page.goto(origin+'/learning/#route');
   await page.locator('[name=login]').fill(person.login);await page.locator('[name=password]').fill(password);
   await page.locator('#auth-form [type=submit]').click();await page.locator('#navigation').waitFor();await page.locator('#main h1').waitFor();
   return page;
  }
  const page=await login(pupil);
  for(const [index,id] of ids.entries()){
   const link=page.locator('[data-plan-course="'+id+'"] [data-plan-course-open]');
   await link.waitFor();await page.waitForFunction(id=>document.querySelector('[data-plan-course="'+id+'"] [data-plan-course-open]')?.hash.startsWith('#public-practice='),id);
   await link.click();await page.locator('[data-public-workspace] iframe').waitFor();
   const frame=page.frameLocator('[data-public-workspace] iframe');await frame.locator('h1').waitFor();
   const url=await page.locator('[data-public-workspace] iframe').getAttribute('src');assert.equal(url,publicOrigin+'/trainers/'+id+'.html');
   assert.equal(new URL(page.url()).hash.includes('return=route'),true);
   if(index===0){
    await frame.getByRole('button',{name:'Хочешь подсказку?',exact:true}).click();
    await page.reload();await frame.locator('h1').waitFor();
   }
   const box=await page.locator('[data-cabinet-return]').boundingBox();assert(box&&box.y>=0&&box.y+box.height<100);
   await page.locator('[data-cabinet-return]').click();await page.locator('[data-plan-course="'+id+'"] [data-plan-course-open]').waitFor();
   assert.equal(new URL(page.url()).hash,'#route');assert.equal(await page.evaluate(()=>LearningApp.account().id),pupil.id);
   assert.equal(await page.locator('[data-public-workspace]').count(),0);
  }
  // Narrow phone, native Back/Forward and repeated return keep the session.
  await page.setViewportSize({width:320,height:900});
  await page.locator('[data-plan-course="task19-trainer"] [data-plan-course-open]').click();
  await page.frameLocator('[data-public-workspace] iframe').locator('h1').waitFor();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  const mobile=await page.locator('[data-cabinet-return]').boundingBox();assert(mobile.x>=0&&mobile.width>=120&&mobile.height>=44&&mobile.y+mobile.height<100);
  const output=process.env.LEARNING_RETURN_ARTIFACTS;
  if(output){fs.mkdirSync(output,{recursive:true});await page.screenshot({path:path.join(output,'return-mobile.png')});}
  await page.goBack();await page.locator('[data-plan-course="task19-trainer"]').waitFor();
  await page.goForward();await page.locator('[data-cabinet-return]').waitFor();await page.locator('[data-cabinet-return]').click();
  const teacherPage=await login(teacher);
  await teacherPage.goto(origin+'/learning/#preview='+pupil.id);await teacherPage.locator('.preview-banner').waitFor();
  await teacherPage.locator('[data-plan-course="oge-task15-triangles"] [data-plan-course-open]').click();
  await teacherPage.frameLocator('[data-public-workspace] iframe').locator('h1').waitFor();
  await teacherPage.locator('[data-cabinet-return]').click();await teacherPage.locator('.preview-banner').waitFor();
  assert.equal(new URL(teacherPage.url()).hash,'#preview='+pupil.id);assert.equal(await teacherPage.evaluate(()=>LearningApp.account().id),teacher.id);
  // Teacher board launch is framed too, and never sends a private student id.
  await teacherPage.goto(origin+'/learning/#student='+pupil.id);await teacherPage.locator('[data-plan-course-board]').first().waitFor();
  await teacherPage.locator('[data-plan-course="oge-task11-graphs-trainer"] [data-plan-course-board]').click();
  await teacherPage.frameLocator('[data-public-workspace] iframe').getByRole('button',{name:'Участники',exact:true}).waitFor();
  assert((await teacherPage.locator('[data-public-workspace] iframe').getAttribute('src')).includes('/trainers/trainer-board.html?trainer='));
  if(output)await teacherPage.screenshot({path:path.join(output,'return-board-desktop.png')});
  await teacherPage.locator('[data-cabinet-return]').click();await teacherPage.locator('[data-plan-course-board]').first().waitFor();
  assert.equal(new URL(teacherPage.url()).hash,'#student='+pupil.id);
  // Broken or forged public destination still has a useful cabinet return.
  await page.goto(origin+'/learning/#public-practice='+encodeURIComponent('https://evil.test/trainers/a.html')+'&return=route');
  await page.getByRole('heading',{name:'Не удалось открыть тренажёр'}).waitFor();assert.equal(await page.locator('#main iframe').count(),0);
  await page.getByRole('link',{name:'← В кабинет',exact:true}).click();await page.locator('[data-plan-course="task19-trainer"]').waitFor();
  assert.deepEqual(store.row('SELECT * FROM learning_plans WHERE learner_id=?',pupil.id),initialPlan);
  assert.deepEqual(store.studentProfile(teacher,pupil.id),initialProfile);
  assert.equal(store.row('SELECT COUNT(*) AS n FROM attempts').n,0);
  assert.deepEqual(writes,[]);assert.deepEqual(leaks,[]);assert.deepEqual(errors,[]);
  console.log('LEARNING_PUBLIC_RETURN_OK: six real trainers, pupil route, teacher preview/card, board, reload, native back/forward, 320px, isolated frame, no account/plan/result writes');
 }finally{await browser?.close();await close(server);await close(publicServer);store.close();fs.rmSync(tmp,{recursive:true,force:true});}
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
