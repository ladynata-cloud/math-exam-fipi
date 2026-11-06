'use strict';
// Real production router, isolated SQLite and real managed trainer frames.
// Synthetic accounts only: no production writes, pasted grades or real names.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { createRequire } = require('node:module');
const ROOT = path.resolve(__dirname, '..');
const serverRequire = createRequire(path.join(ROOT, 'board-server/package.json'));
const express = serverRequire('express');
const { LearningStore } = require('../board-server/learning-store');
const contracts = require('../board-server/learning-contracts');
const { chromium } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright') : 'playwright');
const PASSWORD = '0481';
const CONTENT = 'multiplication-division/long-division-from-simple-to-decimals';
const uuid = () => crypto.randomUUID();
async function artifact(page, name) {
  if (!process.env.LEARNING_FAMILY_ARTIFACTS) return;
  fs.mkdirSync(process.env.LEARNING_FAMILY_ARTIFACTS, { recursive: true });
  await page.screenshot({ path: path.join(process.env.LEARNING_FAMILY_ARTIFACTS, name + '.png'), fullPage: false });
}
async function until(read, accepts, label) {
  const end = Date.now() + 20000; let value;
  while (Date.now() < end) { value = await read(); if (accepts(value)) return value; await new Promise(resolve => setTimeout(resolve, 80)); }
  throw Error(label + ': ' + JSON.stringify(value));
}
const api = (page, route, body) => page.evaluate(async ({ route, body }) => LearningApp.api(route,
  body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }), { route, body });
const parentOverview = page => page.evaluate(async () => { const r = await fetch('/api/learning/parent/overview'); if (!r.ok) throw Error('Parent overview: ' + r.status); return r.json(); });
const trainerFrame = page => page.frameLocator('#trainer-host iframe');
async function frameReady(page) { await page.locator('#trainer-host iframe').waitFor(); await page.waitForFunction(() => document.querySelector('#trainer-host .frame-status')?.hidden); }
const saved = page => page.waitForFunction(() => /^(Все изменения сохранены|Сохранено в кабинете)/.test(document.querySelector('#save-state')?.textContent || ''));
const pending = page => page.waitForFunction(() => /Ожидает отправки|Нет связи/.test(document.querySelector('#save-state')?.textContent || ''));
async function main() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'oge-managed-'));
  const filePath = path.join(directory, 'learning.sqlite');
  const store = new LearningStore({ filePath, contracts }); assert(store.available);
  const invitation = store.bootstrap({ name: 'Тестовый преподаватель', login: 'fixture_progress_teacher' }); store.close();
  const trainer = express(); trainer.use(express.static(ROOT));
  const trainerServer = trainer.listen(0); await once(trainerServer, 'listening');
  const trainerOrigin = 'http://localhost:' + trainerServer.address().port;
  const socket = net.createServer(); socket.listen(0, '127.0.0.1'); await once(socket, 'listening');
  const port = socket.address().port; await new Promise(resolve => socket.close(resolve));
  const origin = 'http://127.0.0.1:' + port;
  const child = spawn(process.execPath, ['index.js'], { cwd: path.join(ROOT, 'board-server'),
    env: { PATH: process.env.PATH, NODE_ENV: 'test', HOST: '127.0.0.1', PORT: String(port),
      LEARNING_DB_PATH: filePath, LEARNING_LOCAL_DEV: '1', LEARNING_PUBLIC_ORIGIN: origin,
      LEARNING_TRAINER_ORIGIN: trainerOrigin, GROUP_LESSON_STORE_DIR: path.join(directory, 'group-lessons') },
    stdio: ['ignore', 'pipe', 'pipe'] });
  let log = ''; child.stdout.on('data', value => { log = (log + value).slice(-4000); }); child.stderr.on('data', value => { log = (log + value).slice(-4000); });
  let browser; const pageErrors = [];
  try {
    await until(async () => { try { return (await fetch(origin + '/api/learning/status')).ok; } catch (_) { if (child.exitCode !== null) throw Error(log); return false; } }, Boolean, 'Server ready');
    browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    async function open(width = 1280) {
      const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 960 }, locale: 'ru-RU' });
      await context.route('**/*', route => ['127.0.0.1', '127.0.0.2', 'localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort('blockedbyclient'));
      const page = await context.newPage(); page.setDefaultTimeout(15000); page.on('pageerror', error => pageErrors.push(error.message));
      return { page, context };
    }
    const teacher = await open(), tp = teacher.page;
    await tp.goto(origin + '/learning/#invite=' + invitation.invitationToken);
    await tp.locator('#auth-form [name=password]').fill(PASSWORD); await tp.locator('#auth-form [name=confirm]').fill(PASSWORD);
    await tp.locator('#auth-form [type=submit]').click(); await tp.locator('#recovery-saved').check(); await tp.locator('#done-codes').click();
    await tp.locator('#navigation').waitFor();
    const pupil = (await api(tp, '/teacher/students', { name: 'Тестовая ученица', login: 'fixture_progress_pupil', password: PASSWORD })).student;
    const peer = (await api(tp, '/teacher/students', { name: 'Другой тестовый ученик', login: 'fixture_progress_peer', password: PASSWORD })).student;
    for (const person of [pupil, peer]) await api(tp, '/teacher/students/' + person.id + '/profile', { opId: uuid(), expectedVersion: 0, course: 'oge', goal: 'pass', focus: '' });

    const issued = await api(tp, '/teacher/students/' + pupil.id + '/parent-access', { name: 'Тестовый родитель', expectedVersion: 0 });
    const parent = await open(), pp = parent.page;
    await pp.goto(origin + '/learning/parent.html#invite=' + issued.invitationToken);
    await pp.locator('#parent-auth-form [name=password]').fill(PASSWORD); await pp.locator('#parent-auth-form [name=confirm]').fill(PASSWORD); await pp.locator('#parent-auth-submit').click(); await pp.locator('#parent-overview').waitFor();
    const student=await open(),sp=student.page;
    await sp.goto(origin+'/learning/#login='+pupil.login);await sp.locator('#auth-form [name=password]').fill(PASSWORD);await sp.locator('#auth-form [type=submit]').click();await sp.locator('#navigation').waitFor();
    const publicRequests=[],frameMessages=[];
    student.context.on('request',request=>{if(request.url().startsWith(trainerOrigin))publicRequests.push({url:request.url(),headers:request.headers(),post:request.postData()});});
    await student.context.addInitScript(()=>{window.receivedLearning=[];addEventListener('message',e=>{if(e.data?.protocol==='mathexam-learning'&&e.data.type==='hydrate')receivedLearning.push(e.data);});window.storageAccess=[];for(const key of ['getItem','setItem','removeItem']){const original=Storage.prototype[key];Storage.prototype[key]=function(...args){storageAccess.push([key,args[0]]);return original.apply(this,args);};}});
    const selectors={11:['#m4-answer','#m4-check','#m4-hint'],15:['#board-answer','#board-check','#board-hint'],16:['#ans','#check','#courseHintToggle'],17:['#ans','#chk','#courseHintToggle'],18:['#ansIn','#chkBtn','#courseHintToggle']};
    const assigned=[];
    for(const n of [11,15,16,17,18,19]){
      const created=await api(tp,'/assignments',{opId:uuid(),learnerIds:[pupil.id],title:'ОГЭ №'+n+' · тестовая работа',trainerId:'oge-public',contentId:String(n)});
      const a=created.assignments[0];assigned.push(a);await api(tp,'/assignments/'+a.id+'/publish',{opId:uuid()});
      await sp.goto(origin+'/learning/#attempt='+a.attemptId);await frameReady(sp);
      let frame=sp.frames().find(f=>f.url().startsWith(trainerOrigin));
      assert(frame,'native public origin');
      await until(()=>frame.evaluate(()=>!!window.OgeLearningNative),Boolean,'native adapter');
      const expected=a.attempt.taskSpec.task.answer;
      if(n===11){const pinned=await frame.evaluate(()=>getBoardTrainerState().task);await frame.evaluate(()=>document.getElementById('m4-next').click());assert.deepEqual(await frame.evaluate(()=>getBoardTrainerState().task),pinned,'native Next cannot replace pinned task');}
      // Cross-check server-pinned mathematics against the actual native exercise.
      const actual=await frame.evaluate(n=>window.eval(n===11?'M4.task.key.join("")':n===15?'String(window.__oge15.buildSeeded(window.getBoardTrainerState().variantId,window.getBoardTrainerState().seed).ans)':n===16?'String(trTask.ans)':n===17?'String(CUR.ans)':n===18?'String(TR.task.ans)':'String(window.Task19Data.cards.find(c=>c.id===window.getBoardTrainerState().current.id).truth)'),n);
      assert.equal(actual,expected,'same native/server condition '+n);
      if(n!==19){const [field,check,hint]=selectors[n];
        if(n===17){let lost=false;await student.context.route('**/api/learning/attempts/'+a.attemptId+'/actions',async route=>{if(!lost&&route.request().postDataJSON()?.type==='check'){lost=true;await route.fetch();await route.abort('failed');}else await route.continue();});}
        await frame.locator(field).fill(n===11?(expected==='123'?'321':'123'):n===15?'5a':'98765');await frame.locator(check).click();
        await until(()=>api(sp,'/attempts/'+a.attemptId+'/history'),x=>x.events.some(e=>e.type==='check'),'wrong answer '+n);await saved(sp);
        if(n===15){
          await frame.locator(check).click();await until(()=>api(sp,'/attempts/'+a.attemptId+'/history'),x=>x.events.filter(e=>e.type==='check').length===2,'repeated identical error');
          await frame.locator('#board-guide').click();await frame.locator('[data-step-draft="0"]').fill('98765');await frame.locator('[data-step-check="0"]').click();
          await until(()=>api(sp,'/attempts/'+a.attemptId+'/history'),x=>x.events.some(e=>e.payload?.details?.scope==='step'),'verified intermediate error');
        }
        if(n%2===0){await frame.locator(hint).click();await until(()=>api(sp,'/attempts/'+a.attemptId),x=>x.assistance.hints,'hint saved');await saved(sp);}
        const before=await api(sp,'/attempts/'+a.attemptId);
        await sp.reload();await frameReady(sp);frame=sp.frames().find(f=>f.url().startsWith(trainerOrigin));
        const after=await api(sp,'/attempts/'+a.attemptId);assert.deepEqual(after.state,before.state,'server restore '+n);
        assert.equal(await frame.locator(field).inputValue(),before.state.answer,'draft restore '+n);
        await frame.locator(field).fill(expected);await frame.locator(check).click();
      } else {await frame.locator(expected==='true'?'#btnTrue':'#btnFalse').click();}
      const result=await until(()=>api(sp,'/attempts/'+a.attemptId),x=>x.outcome!=='started','correct answer '+n);
      assert.equal(result.outcome,n===15||n!==19&&n%2===0?'hinted':'independent','assistance '+n);
      await saved(sp);
      if(n===19){const before=(await api(sp,'/attempts/'+a.attemptId+'/history')).events.filter(e=>e.type==='check').length;await frame.evaluate(()=>{document.body.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyJ',bubbles:true}));document.body.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyN',ctrlKey:true,bubbles:true}));});await new Promise(r=>setTimeout(r,100));assert.equal((await api(sp,'/attempts/'+a.attemptId+'/history')).events.filter(e=>e.type==='check').length,before);}
      frameMessages.push(...await frame.evaluate(()=>window.receivedLearning||[]));
      assert.deepEqual(await frame.evaluate(()=>window.storageAccess),[],'managed frame never reads public personal storage '+n);
      await sp.goto(origin+'/learning/#assignment='+a.id);await sp.locator('[data-submit-work]').click();await until(()=>api(sp,'/assignments/'+a.id),x=>x.attempt?.submission?.status==='submitted','submission');
      console.log('OGE'+n+': wrong/correct, assistance, pinned condition, reload and submission PASS');
    }
    const report=await api(tp,'/teacher/students/'+pupil.id+'/report');
    assert.equal(report.attempts.filter(a=>a.ogePosition).length,6);
    assert.equal(report.attempts.filter(a=>a.wrongChecks===1).length,4);
    assert.equal(report.attempts.filter(a=>a.assistance.hints).length,3);
    const family=await parentOverview(pp);assert.equal(family.homework.total,6);assert.equal(family.progress.independentAttempts,3);assert.equal(family.progress.helpedAttempts,3);
    assert(!JSON.stringify(family).includes('checkedAnswers'));
    for(const r of publicRequests){assert(!JSON.stringify(r).includes(pupil.id));assert(!JSON.stringify(r).includes(pupil.login));assert(!r.headers.cookie);assert(!r.headers.referer?.startsWith(origin));}
    for(const m of frameMessages){assert(!JSON.stringify(m).includes(pupil.id));assert(!JSON.stringify(m).includes(pupil.login));}
    // Teacher uses the actual assignment/quantity/publication UI; two distinct tasks.
    await tp.goto(origin+'/learning/#practice=oge-public%3A19');await tp.reload();await tp.locator('[data-practice-start]').click();
    await tp.locator('#assignment-form [name=course]').selectOption('ege');
    assert.equal(await tp.locator('#assignment-form [name=content] option[value^="oge-public:"]').count(),0,
      'OGE homework must not enter the EGE assignment catalogue');
    await tp.locator('#assignment-form [name=course]').selectOption('oge');
    assert.deepEqual(await tp.locator('#assignment-form [name=content] option[value^="oge-public:"]').evaluateAll(options=>options.map(option=>option.value)),
      [11,15,16,17,18,19].map(number=>'oge-public:'+number));
    await tp.locator('#assignment-form [name=content]').selectOption('oge-public:19');
    await tp.locator('#assignment-form [name=count]').fill('2');await tp.locator('#assignment-form [name=student][value="'+peer.id+'"]').check();await tp.locator('#assignment-form [type=submit]').click();
    await tp.locator('[data-publish-batch]').click();
    const peerTasks=await until(()=>api(tp,'/assignments'),x=>x.assignments.filter(a=>a.learnerId===peer.id&&a.status==='published').length===2,'quantity publication');
    const peerAssigned=peerTasks.assignments.filter(a=>a.learnerId===peer.id);
    assert.notEqual(peerAssigned[0].attempt.taskSpec?.descriptor?.id||peerAssigned[0].attemptId,peerAssigned[1].attempt.taskSpec?.descriptor?.id||peerAssigned[1].attemptId);
    const other=await open(),opage=other.page;
    await opage.goto(origin+'/learning/#login='+peer.login);await opage.locator('#auth-form [name=password]').fill(PASSWORD);await opage.locator('#auth-form [type=submit]').click();await opage.locator('#navigation').waitFor();
    const wrongId=peerAssigned[0].attemptId,wrongA=await api(opage,'/attempts/'+wrongId);
    await opage.goto(origin+'/learning/#attempt='+wrongId);await frameReady(opage);let otherFrame=opage.frames().find(f=>f.url().startsWith(trainerOrigin));
    await otherFrame.locator(wrongA.taskSpec.task.answer==='true'?'#btnFalse':'#btnTrue').click();
    await until(()=>api(opage,'/attempts/'+wrongId+'/history'),x=>x.events.some(e=>e.type==='check'),'wrong assertion');await saved(opage);await opage.reload();await frameReady(opage);
    assert.equal((await api(opage,'/attempts/'+wrongId)).outcome,'started');
    await opage.goto(origin+'/learning/#assignment='+peerAssigned[0].id);await opage.locator('[data-submit-work]').click();
    await until(()=>api(opage,'/assignments/'+peerAssigned[0].id),x=>x.attempt.submission?.status==='submitted','wrong assertion submitted');
    const teacherId=peerAssigned[1].attemptId,teacherA=await api(tp,'/attempts/'+teacherId);
    await tp.goto(origin+'/learning/#attempt='+teacherId);await frameReady(tp);
    await tp.locator('#trainer-control').click();await until(()=>api(tp,'/attempts/'+teacherId),x=>x.controller==='teacher','teacher control');await frameReady(tp);
    const teacherFrame=tp.frames().find(f=>f.url().startsWith(trainerOrigin));await teacherFrame.locator(teacherA.taskSpec.task.answer==='true'?'#btnTrue':'#btnFalse').click();
    await until(()=>api(tp,'/attempts/'+teacherId),x=>x.outcome==='together','teacher work excluded from independent credit');
    const guided=(await api(opage,'/attempts',{opId:uuid(),trainerId:'oge-public',contentId:'15',fresh:true})).attempt;
    await opage.goto(origin+'/learning/#attempt='+guided.id);await frameReady(opage);otherFrame=opage.frames().find(f=>f.url().startsWith(trainerOrigin));
    await otherFrame.locator('#board-guide').click();
    for(let i=0;i<guided.taskSpec.task.steps.length;i++){
      await otherFrame.locator('[data-step-draft="'+i+'"]').fill(guided.taskSpec.task.steps[i].answer);
      await otherFrame.locator('[data-step-check="'+i+'"]').click();
      await until(()=>api(opage,'/attempts/'+guided.id+'/history'),x=>x.events.filter(e=>e.type==='check').length===i+1,'guided step saved');
    }
    assert.equal((await api(opage,'/attempts/'+guided.id)).outcome,'started');
    assert.equal(await otherFrame.locator('#board-answer').isDisabled(),false,'final answer stays editable after all guided steps');
    await otherFrame.locator('#board-answer').fill(guided.taskSpec.task.answer);await otherFrame.locator('#board-check').click();
    await until(()=>api(opage,'/attempts/'+guided.id),x=>x.outcome==='hinted','guided task explicit final submission');
    console.log('UI quantity, wrong assertion, teacher attribution and full guided solution PASS');
    // New login, same persistent attempts and account-scoped report.
    await api(sp,'/logout',{});await sp.goto(origin+'/learning/#login='+pupil.login);await sp.locator('#auth-form [name=password]').fill(PASSWORD);await sp.locator('#auth-form [type=submit]').click();await sp.locator('#navigation').waitFor();
    for(const a of assigned){const x=await api(sp,'/attempts/'+a.attemptId);assert.notEqual(x.outcome,'started');await sp.goto(origin+'/learning/#attempt='+a.attemptId);await frameReady(sp);const restored=sp.frames().find(f=>f.url().startsWith(trainerOrigin));assert.deepEqual(await restored.evaluate(()=>window.storageAccess),[]);}
    await tp.goto(origin+'/learning/#student='+pupil.id);await tp.locator('[data-oge-report]').waitFor();
    await tp.locator('[data-oge-report]').scrollIntoViewIfNeeded();await artifact(tp,'oge-homework-report-1280');
    await tp.setViewportSize({width:320,height:900});await tp.locator('[data-oge-report]').scrollIntoViewIfNeeded();await artifact(tp,'oge-homework-report-320');
    assert.equal(await tp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'teacher report fits mobile');
    assert.deepEqual(pageErrors,[]);console.log('OGE_INDEPENDENT_HOMEWORK_BROWSER_OK');
  }catch(error){console.error('server:',log);throw error;}
  finally{await browser?.close();child.kill();await Promise.race([once(child,'exit'),new Promise(r=>setTimeout(r,2000))]);await new Promise(r=>trainerServer.close(r));fs.rmSync(directory,{recursive:true,force:true});}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
