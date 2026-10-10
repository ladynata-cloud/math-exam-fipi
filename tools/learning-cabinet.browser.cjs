'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
const express=require(path.join(ROOT,'board-server/node_modules/express'));
const {LearningStore}=require(path.join(ROOT,'board-server/learning-store'));
const {createLearningApi}=require(path.join(ROOT,'board-server/learning-api'));
const {createTeachingRouter}=require(path.join(ROOT,'board-server/learning-teaching'));
const contracts=require(path.join(ROOT,'board-server/learning-contracts'));
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'learning-cabinet-'));
const store=new LearningStore({filePath:path.join(tmp,'learning.sqlite'),contracts});
const password='0823';
const listen=app=>new Promise(resolve=>{const server=app.listen(0,'127.0.0.1',()=>resolve(server));});
const close=server=>new Promise(resolve=>server.close(resolve));
(async()=>{
 const trainerApp=express();trainerApp.use(express.static(ROOT));const trainerServer=await listen(trainerApp),trainerOrigin='http://127.0.0.1:'+trainerServer.address().port;
 const cabinet=express();cabinet.use(express.json({limit:'200kb'}));const server=await listen(cabinet),origin='http://127.0.0.1:'+server.address().port;
 cabinet.get('/api/learning/status',(_req,res)=>res.json({...store.status(),trainerOrigin}));
 const learning=createLearningApi({store,publicOrigin:origin,secureCookies:false});cabinet.use('/api/learning',learning.router);cabinet.use('/api/learning',createTeachingRouter(learning));cabinet.use(express.static(ROOT));
 const teacher=store.bootstrap({name:'Наталья Михайловна',login:'teacher'});
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
 const errors=[];
 try{
  const tc=await browser.newContext({viewport:{width:1440,height:1000}}),tp=await tc.newPage();tp.on('pageerror',e=>errors.push(e.message));
  await tp.goto(origin+'/learning/#invite='+teacher.invitationToken);await tp.locator('[name=password]').fill(password);await tp.locator('[name=confirm]').fill(password);await tp.locator('#auth-form [type=submit]').click();await tp.locator('#recovery-saved').check();await tp.locator('#done-codes').click();await tp.waitForSelector('#navigation');assert(!tp.url().includes('invite='),'invite scrubbed');
  const api=(page,url,body)=>page.evaluate(async({url,body})=>LearningApp.api(url,body===undefined?{}:{method:'POST',body:JSON.stringify(body)}),{url,body});
  // Existing issued invitations remain supported even though ready passwords
  // are now the primary creation flow. Create this legacy fixture through the
  // real teacher API, and activate all eight pupils through their actual links.
  const invites=[await api(tp,'/teacher/students',{name:'Ученик 1',login:'student1'})];
  for(let i=2;i<=8;i++)invites.push(await api(tp,'/teacher/students',{name:'Ученик '+i,login:'student'+i}));
  await tp.evaluate(()=>LearningApp.refresh());await tp.locator('[data-nav=lessons]').click();await tp.locator('#create-lesson').click();await tp.locator('#lesson-form [name=title]').fill('Проверка восьми учеников');for(const box of await tp.locator('#lesson-form [name=student]').all())await box.check();await tp.locator('#lesson-form [type=submit]').click();await tp.waitForSelector('#lesson-grid');const lessonId=new URLSearchParams(tp.url().split('#')[1]).get('lesson');assert.equal(await tp.locator('.lesson-tile').count(),4);await tp.locator('[data-sheet="1"]').click();assert.equal(await tp.locator('.lesson-tile').count(),4);await tp.locator('[data-sheet="0"]').click();
  await tp.locator('#lesson-assign').click();await tp.locator('#lesson-assignment-form [name=content]').selectOption('path:equations-linear');await tp.locator('#lesson-assignment-form [type=submit]').click();await tp.waitForSelector('#modal:not([open])',{state:'attached'});await tp.waitForFunction(()=>[...document.querySelectorAll('.lesson-tile .frame-status')].length===4&&[...document.querySelectorAll('.lesson-tile .frame-status')].every(n=>n.hidden),null,{timeout:20000});
  const clients=[];
  for(const invitation of invites){const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/learning/#invite='+invitation.invitationToken);await page.locator('[name=password]').fill(password);await page.locator('[name=confirm]').fill(password);await page.locator('#auth-form [type=submit]').click();await page.waitForSelector('#navigation');await page.locator('[data-mw-close]').click();await page.evaluate(id=>LearningApp.navigate('lesson='+id),lessonId);await page.waitForSelector('#trainer-host iframe');await page.waitForFunction(()=>document.querySelector('#trainer-host .frame-status')?.hidden);clients.push({context,page,id:invitation.student.id});}
  const student=clients[0].page,peer=clients[1].page,frame=page=>page.frameLocator('#trainer-host iframe');
  await frame(student).locator('#answer').fill('777');await student.waitForFunction(()=>document.querySelector('#save-state').textContent==='Все изменения сохранены');
  const firstId=clients[0].id;await tp.locator('[data-open-seat="'+firstId+'"]').click();await tp.waitForSelector('#trainer-control');await tp.waitForFunction(()=>document.querySelector('#trainer-host .frame-status')?.hidden);await assertValue(frame(tp).locator('#answer'),'777');
  // Acknowledged input must not destroy focus or replace later queued keystrokes.
  await frame(student).locator('#answer').fill('');await frame(student).locator('#answer').pressSequentially('12345',{delay:100});await assertValue(frame(student).locator('#answer'),'12345');assert.equal(await frame(student).locator('#answer').evaluate(n=>n===document.activeElement),true);
  await tp.locator('#trainer-control').click();await tp.waitForFunction(()=>document.querySelector('#trainer-control').textContent.includes('Вернуть'));await frame(tp).locator('#answer').fill('2468');await assertValue(frame(student).locator('#answer'),'2468');
  await tp.locator('#present-work').click();await peer.waitForSelector('#watch-trainer iframe');await peer.waitForFunction(()=>document.querySelector('#watch-trainer .frame-status')?.hidden);await assertValue(peer.frameLocator('#watch-trainer iframe').locator('#answer'),'2468');assert.equal(await peer.frameLocator('#watch-trainer iframe').locator('#main').evaluate(n=>n.inert),true,'broadcast frame is inert');
  const peerState=await frame(peer).locator('#answer').inputValue();assert.notEqual(peerState,'2468','presentation does not overwrite own work');
  await tp.locator('[data-work-view=board]').click();const canvas=tp.locator('#drawing-host canvas'),box=await canvas.boundingBox();await tp.mouse.move(box.x+30,box.y+30);await tp.mouse.down();await tp.mouse.move(box.x+130,box.y+100,{steps:8});await tp.mouse.up();await tp.waitForFunction(()=>document.querySelector('#save-state').textContent==='Все изменения сохранены');const current=await api(tp,'/lessons/'+lessonId);const attemptId=current.seats.find(s=>s.learnerId===firstId).attempt.id;assert.equal((await api(tp,'/attempts/'+attemptId)).strokes.length,1);
  await tp.locator('#undo-stroke').click();await tp.waitForFunction(()=>document.querySelector('#save-state').textContent==='Все изменения сохранены');assert.equal((await api(tp,'/attempts/'+attemptId)).strokes.length,0,await tp.locator('#notice').innerText());
  await tp.locator('#show-history').click();await tp.waitForSelector('#history-range');await tp.locator('#history-range').fill('0');await tp.locator('#history-range').dispatchEvent('input');assert.equal((await api(tp,'/attempts/'+attemptId)).state.work.draft,'2468','history does not mutate live');await tp.locator('#exit-history').click();
  // Ink has its own append order; it must not invalidate the trainer controller's draft.
  await tp.locator('#trainer-control').click();await tp.waitForFunction(()=>document.querySelector('#trainer-control').textContent.includes('Подключиться'));
  await frame(student).locator('#main').evaluate(n=>n.inert).then(async()=>{for(let i=0;i<60&&await frame(student).locator('#main').evaluate(n=>n.inert);i++)await new Promise(r=>setTimeout(r,100));});
  let heldState,notifyState;const stateHeld=new Promise(resolve=>notifyState=resolve);
  const actionURL='**/api/learning/attempts/'+attemptId+'/actions';
  await student.route(actionURL,route=>{if(route.request().postDataJSON().type==='state'&&!heldState){heldState=route;notifyState();}else route.continue();});
  await frame(student).locator('#answer').fill('1122');await stateHeld;
  await draw(tp,210);await tp.waitForFunction(()=>document.querySelector('#save-state').textContent==='Все изменения сохранены');
  assert.equal((await api(tp,'/attempts/'+attemptId)).strokes.length,1);
  await heldState.continue();await student.unroute(actionURL);await student.waitForFunction(()=>document.querySelector('#save-state').textContent==='Все изменения сохранены');
  assert.equal((await api(tp,'/attempts/'+attemptId)).state.work.draft,'1122','teacher ink cannot reject learner text');
  assert.equal((await api(tp,'/attempts/'+attemptId)).strokes.length,1);
  // Hold two strokes captured from the same visible revision, then release both.
  await student.locator('[data-work-view=board]').click();let heldTeacher,heldStudent,gotTeacher,gotStudent;
  const strokesHeld=[new Promise(r=>gotTeacher=r),new Promise(r=>gotStudent=r)];
  await tp.route(actionURL,route=>{if(route.request().postDataJSON().type==='stroke'){heldTeacher=route;gotTeacher();}else route.continue();});
  await student.route(actionURL,route=>{if(route.request().postDataJSON().type==='stroke'){heldStudent=route;gotStudent();}else route.continue();});
  await Promise.all([draw(tp,310),draw(student,100)]);await Promise.all(strokesHeld);await Promise.all([heldTeacher.continue(),heldStudent.continue()]);await tp.unroute(actionURL);await student.unroute(actionURL);
  await Promise.all([tp.waitForFunction(()=>document.querySelector('#save-state').textContent==='Все изменения сохранены'),student.waitForFunction(()=>document.querySelector('#save-state').textContent==='Все изменения сохранены')]);
  const ink=await api(tp,'/attempts/'+attemptId);assert.equal(ink.strokes.length,3,'both simultaneous pens saved');assert.equal(ink.state.work.draft,'1122');
  await tp.locator('#undo-stroke').click();await tp.waitForFunction(()=>document.querySelector('#save-state').textContent==='Все изменения сохранены');let afterUndo=await api(tp,'/attempts/'+attemptId);assert.equal(afterUndo.strokes.length,2);assert.equal(afterUndo.strokes.filter(s=>s.author===firstId).length,1,'teacher undo preserves pupil ink');
  await student.locator('#undo-stroke').click();await student.waitForFunction(()=>document.querySelector('#save-state').textContent==='Все изменения сохранены');assert.equal((await api(tp,'/attempts/'+attemptId)).strokes.length,1);
  await student.locator('[data-work-view=trainer]').click();
  // Lost acknowledgement: a retried old operation cannot carry its queued descendants over a teacher correction.
  let lostRoute,acceptedNotice,heldOnce=false;const accepted=new Promise(resolve=>acceptedNotice=resolve);
  await student.route(actionURL,async route=>{if(!heldOnce&&route.request().postDataJSON().type==='state'){heldOnce=true;await route.fetch();lostRoute=route;acceptedNotice();}else await route.continue();});
  await frame(student).locator('#answer').fill('300');await accepted;await frame(student).locator('#answer').pressSequentially('9876',{delay:20});
  await tp.locator('#trainer-control').click();await tp.waitForFunction(()=>document.querySelector('#trainer-control').textContent.includes('Вернуть'));await tp.locator('[data-work-view=trainer]').click();await frame(tp).locator('#answer').fill('999');await tp.waitForFunction(()=>document.querySelector('#save-state').textContent==='Все изменения сохранены');await tp.locator('#trainer-control').click();await tp.waitForFunction(()=>document.querySelector('#trainer-control').textContent.includes('Подключиться'));
  await lostRoute.abort('failed');await assertValue(frame(student).locator('#answer'),'999');await student.unroute(actionURL);
  assert.equal((await api(tp,'/attempts/'+attemptId)).state.work.draft,'999','queued descendants cannot overwrite correction');
  const rejected=await student.evaluate(()=>Object.values(sessionStorage).flatMap(value=>{try{return JSON.parse(value).rejected||[];}catch(_){return [];}}));assert(rejected.length>0,'stale work retained for export');assert((await student.locator('#save-state').innerText()).includes('неподтверждённые действия'),'conflict status does not claim every action was saved');
  const secondContext=await browser.newContext(),second=await secondContext.newPage();second.on('pageerror',e=>errors.push(e.message));await second.goto(origin+'/learning/');await second.locator('[name=login]').fill('student1');await second.locator('[name=password]').fill(password);await second.locator('#auth-form [type=submit]').click();await second.waitForSelector('#navigation');await second.locator('[data-mw-close]').click();await second.evaluate(id=>LearningApp.navigate('attempt='+id),attemptId);await second.waitForSelector('#trainer-host iframe');await assertValue(frame(second).locator('#answer'),'999');
  // A pupil's new analogue stays in the group seat and retains classroom observation.
  await frame(student).locator('#new').click();await student.waitForFunction(id=>location.hash==='#lesson='+id,lessonId);await student.waitForFunction(()=>document.querySelector('#trainer-host .frame-status')?.hidden);
  let updatedLesson;for(let i=0;i<80;i++){updatedLesson=await api(tp,'/lessons/'+lessonId);if(updatedLesson.seats.find(s=>s.learnerId===firstId).attemptId!==attemptId)break;await new Promise(r=>setTimeout(r,100));}
  assert.notEqual(updatedLesson.seats.find(s=>s.learnerId===firstId).attemptId,attemptId,'new analogue remains attached to learner seat');assert.equal((await api(tp,'/attempts/'+attemptId)).state.work.draft,'999','prior attempt preserved');assert((await student.locator('#save-state').innerText()).includes('неподтверждённые действия'),'earlier unsaved work stays visible after a new analogue');
  await peer.setViewportSize({width:390,height:844});assert.equal(await peer.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'mobile no overflow');await peer.locator('[data-mobile-tab=watch]').click();assert.equal(await peer.locator('#work-columns').getAttribute('data-mobile-view'),'watch');await peer.locator('[data-mobile-tab=own]').click();assert.equal(await frame(peer).locator('#answer').inputValue(),peerState);
  await tp.setViewportSize({width:1440,height:1000});await tp.evaluate(id=>LearningApp.navigate('lesson='+id),lessonId);await tp.waitForSelector('#lesson-grid');await tp.locator('#expand-overview').click();assert.equal(await tp.evaluate(()=>document.querySelector('#sheet-tabs').getBoundingClientRect().bottom<=innerHeight),true,'all four works and sheet tabs fit screen');const artifact=process.env.LEARNING_BROWSER_ARTIFACTS;if(artifact){fs.mkdirSync(artifact,{recursive:true});await tp.screenshot({path:path.join(artifact,'teacher-overview.png'),fullPage:true});await student.screenshot({path:path.join(artifact,'student-workspace.png'),fullPage:true});}
  // Reset archives existing work, closes its classroom editor, and locks already-open copies.
  const reset=await api(tp,'/teacher/students/'+firstId+'/reset',{opId:require('node:crypto').randomUUID(),scope:'all',reason:'Повторная диагностика'});assert(reset.archived>=2);assert.equal(reset.preservedHistory,true);
  await student.waitForSelector('#trainer-host iframe',{state:'detached'});await student.getByRole('heading',{name:'Скоро начнём'}).waitFor();
  await second.waitForSelector('#archived-notice:not([hidden])');assert.equal(await frame(second).locator('#main').evaluate(n=>n.inert),true,'archived standalone trainer is read-only');assert.equal(await second.locator('#undo-stroke').isDisabled(),true,'archived strokes are locked');
  assert.equal((await api(tp,'/attempts/'+attemptId)).state.work.draft,'999','reset preserves prior solution');assert((await api(tp,'/attempts/'+attemptId+'/history')).events.some(e=>e.type==='archive'),'archive recorded in history');
  // A common explanation is available even before a pupil receives another individual task.
  await tp.locator('#open-common').click();await tp.waitForSelector('#present-work');await tp.locator('#present-work').click();await student.waitForSelector('#watch-drawing:not([hidden]) canvas');assert.equal(await student.locator('#watch-caption').innerText(),'Общая доска · только просмотр');
  await secondContext.close();
  assert.deepEqual(errors,[]);console.log('LEARNING_CABINET_BROWSER_OK: auth, 8 seats, cloned assignments, live state, control, presentation, concurrent ink and text, authored undo, lost-ACK fencing, cross-device resume, in-lesson analogue, history, mobile, four-screen mode, live reset and archived history, common explanation without personal task');
 }finally{await browser.close();await close(server);await close(trainerServer);store.close();fs.rmSync(tmp,{recursive:true,force:true});}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
async function assertValue(locator,value){await locator.page().waitForFunction(()=>true);for(let i=0;i<80;i++){if(await locator.inputValue()===value)return;await new Promise(resolve=>setTimeout(resolve,100));}assert.equal(await locator.inputValue(),value);}

async function draw(page,offset){const box=await page.locator('#drawing-host canvas').boundingBox();await page.mouse.move(box.x+offset,box.y+40);await page.mouse.down();await page.mouse.move(box.x+offset+60,box.y+120,{steps:6});await page.mouse.up();}
