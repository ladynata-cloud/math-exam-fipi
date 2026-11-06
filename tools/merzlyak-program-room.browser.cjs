'use strict';

// Exercise the actual cabinet card and its nested board. The two browser
// contexts, learning database, room service and trainer origin are isolated.
const assert = require('node:assert/strict');
const {spawn} = require('node:child_process');
const {createRequire} = require('node:module');
const {createServer} = require('node:net');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {randomUUID} = require('node:crypto');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const express = createRequire(path.join(root, 'board-server/package.json'))('express');
const {LearningStore} = require('../board-server/learning-store');
const {createLearningApi} = require('../board-server/learning-api');
const {createTeachingRouter} = require('../board-server/learning-teaching');
const {hashPassword} = require('../board-server/learning-auth');
const contracts = require('../board-server/learning-contracts');

const listen = app => new Promise((resolve, reject) => {
  const server = app.listen(0, '127.0.0.1', () => resolve(server)); server.once('error', reject);
});
const close = server => server && new Promise(resolve => { server.closeAllConnections?.(); server.close(resolve); });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let phase = 'setup';

async function run() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'merzlyak-program-room-'));
  const store = new LearningStore({filePath:path.join(tmp,'learning.sqlite'),contracts});
  let publicServer, cabinetServer, roomProcess, browser;
  try {
    assert(store.available, 'isolated SQLite database required');
    const password = 'Synthetic-program-room-'+randomUUID();
    const invite = store.bootstrap({login:'fixture_room_teacher',name:'Преподаватель теста'});
    const teacher = store.activate(invite.invitationToken,await hashPassword(password)).account;
    const pupilInvite = store.createStudent(teacher,{login:'fixture_room_pupil',name:'Ученик теста'});
    const pupil = store.activate(pupilInvite.invitationToken,await hashPassword(password,'student')).account;
    store.saveStudentProfile(teacher,pupil.id,{opId:randomUUID(),expectedVersion:0,course:'school',goal:null,focus:'',
      program:{grade:10,courseIds:['merzlyak-10-base','nikolsky10']}});
    const initialProfile = store.studentProfile(teacher,pupil.id);
    const initialAttempts = store.row('SELECT COUNT(*) AS n FROM attempts').n;
    const staticApp = express(); staticApp.use(express.static(root)); publicServer = await listen(staticApp);
    const publicOrigin = 'http://localhost:'+publicServer.address().port;
    const app = express(); app.use(express.json()); cabinetServer = await listen(app);
    const cabinetOrigin = 'http://127.0.0.1:'+cabinetServer.address().port;
    const learning = createLearningApi({store,publicOrigin:cabinetOrigin,secureCookies:false});
    app.get('/api/learning/status',(_req,res)=>res.json({...store.status(),trainerOrigin:publicOrigin}));
    app.use('/api/learning',learning.router,createTeachingRouter(learning)); app.use(express.static(root));

    const reservation = await listen(createServer());
    const port = reservation.address().port; await close(reservation);
    const boardOrigin = 'http://127.0.0.1:'+port;
    roomProcess = spawn(process.execPath,['index.js'],{cwd:path.join(root,'board-server'),
      env:{PATH:process.env.PATH,HOST:'127.0.0.1',PORT:String(port),NODE_ENV:'test',CORS_ALLOWED_ORIGINS:publicOrigin},
      stdio:'ignore'});
    const deadline = Date.now()+15000;
    for (;;) {
      if (roomProcess.exitCode !== null) throw Error('isolated room service exited during setup');
      try { if ((await fetch(boardOrigin+'/health',{signal:AbortSignal.timeout(750)})).ok) break; } catch (_) {}
      if (Date.now()>=deadline) throw Error('isolated room service did not become healthy');
      await delay(75);
    }
    browser = await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,headless:true,
      args:['--no-sandbox','--disable-dev-shm-usage']});
    const allowed = new Set([publicOrigin,cabinetOrigin,boardOrigin]);
    const external=[], writes=[], leaks=[], errors=[];
    async function participant() {
      const context = await browser.newContext({viewport:{width:1280,height:900},locale:'ru-RU',serviceWorkers:'block'});
      // Unexpected WebSocket origins are rejected before connection; allowed
      // room traffic retains its native Socket.IO transport.
      await context.routeWebSocket(url=>url.origin!==boardOrigin.replace(/^http:/,'ws:'),socket=>{
        const url=new URL(socket.url()); external.push(url.origin+url.pathname);
        return socket.close({code:1000,reason:'Local room only'});
      });
      await context.route('**/*', async route => {
        const req=route.request(), u=new URL(req.url());
        if (!allowed.has(u.origin)&&!['data:','blob:'].includes(u.protocol)) { external.push(u.origin+u.pathname); return route.abort(); }
        if (u.origin===cabinetOrigin && u.pathname.startsWith('/api/learning/') && !['GET','HEAD'].includes(req.method()) && u.pathname!=='/api/learning/login')
          writes.push(req.method()+' '+u.pathname);
        if (u.origin===publicOrigin) {
          const headers=await req.allHeaders();
          if (req.url().includes(pupil.id)||req.url().includes(teacher.id)||headers.cookie||(headers.referer||'').startsWith(cabinetOrigin)) leaks.push(u.pathname);
        }
        return route.continue();
      });
      // Configure the board's normal saved server setting before public JS
      // runs. Only an ephemeral loopback service is reachable in this test.
      await context.addInitScript(({origin,server})=>{
        if(location.origin===origin && location.pathname==='/trainers/trainer-board.html')
          localStorage.setItem('mathexam.trainerBoard.serverUrl',server);
      },{origin:publicOrigin,server:boardOrigin});
      const page=await context.newPage();page.setDefaultTimeout(15000);
      page.on('pageerror',e=>errors.push(e.message));return page;
    }
    phase='assigned teacher card and nested board';
    const t=await participant(),s=await participant();
    const back='student='+pupil.id;
    await t.goto(cabinetOrigin+'/learning/?role=teacher#'+back);
    await t.locator('[name=login]').fill(teacher.login);await t.locator('[name=password]').fill(password);
    await t.locator('#auth-form [type=submit]').click();
    await t.locator('#navigation').waitFor();
    await t.goto(cabinetOrigin+'/learning/#'+back);
    const card=t.locator('[data-program-course="merzlyak-10-base"]');
    const launch=card.locator('[data-program-board][data-cabinet-practice]');
    await launch.click();
    await t.locator('[data-cabinet-return]').waitFor();await t.reload();
    const boardElement=t.locator('[data-public-workspace] iframe');
    const source=new URL(await boardElement.getAttribute('src'));
    assert.equal(source.origin,publicOrigin);assert.equal(source.pathname,'/trainers/trainer-board.html');
    assert.deepEqual([...source.searchParams],[['trainer','/trainers/merzlyak-10-base.html']]);
    const board=await (await boardElement.elementHandle()).contentFrame();
    await board.locator('#openShare').click();await board.locator('#createRoom').click();
    phase='room invite and joined mirrors';
    await board.waitForFunction(()=>document.querySelector('#shareStatus')?.textContent==='подключено' &&
      document.querySelector('#studentLink')?.value.includes('role=student'));
    const link=await board.locator('#studentLink').inputValue(), target=new URL(link);
    assert.equal(target.origin,publicOrigin);assert.equal(target.pathname,'/trainers/trainer-board.html');
    assert.equal(target.searchParams.get('role'),'student');assert.equal(target.searchParams.get('server'),boardOrigin);
    assert(target.searchParams.has('room')&&target.searchParams.has('token'));
    assert(!link.includes(pupil.id)&&!link.includes(teacher.id));
    await board.locator('#sharePanel [data-close-panel]').click();
    await s.goto(link);
    const ready=()=>document.querySelector('#mirrorStatus')?.dataset.mirrorStatus==='connected';
    await Promise.all([board.waitForFunction(ready),s.waitForFunction(ready)]);
    async function course(host) {
      const frame=await (await host.locator('#trainerFrame').elementHandle()).contentFrame();
      await frame.waitForFunction(()=>typeof window.__merzlyakBoard?.getState==='function');
      assert.equal(new URL(frame.url()).pathname,'/trainers/merzlyak-10-base.html');
      return frame;
    }
    const teacherCourse=await course(board),studentCourse=await course(s);
    const workKeys=()=>Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('mathExamTextbook.')).map(k=>[k,localStorage.getItem(k)]));
    const before=await Promise.all([teacherCourse.evaluate(workKeys),studentCourse.evaluate(workKeys)]);
    phase='first-semester task, bidirectional draft and return';
    await teacherCourse.locator('#catalog-search').fill('2.19');
    await teacherCourse.locator('[data-lesson="ex-02-019"]').click();
    await studentCourse.waitForFunction(()=>window.__merzlyakBoard.getState().lessonId==='ex-02-019');
    await teacherCourse.locator('#final-answer').fill('Запись преподавателя');
    const visibleDraft=value=>document.querySelector('#final-answer')?.value===value && window.__merzlyakBoard.getState().work.draft===value;
    await studentCourse.waitForFunction(visibleDraft,'Запись преподавателя');
    await board.locator('#openShare').click();await board.locator('#controlToggle').click();
    await s.waitForFunction(()=>document.body.classList.contains('control-owner'));
    await board.waitForFunction(()=>!document.body.classList.contains('control-owner'));
    await board.locator('#sharePanel [data-close-panel]').click();
    await studentCourse.locator('#final-answer').fill('Черновик ученика после передачи управления');
    await teacherCourse.waitForFunction(visibleDraft,'Черновик ученика после передачи управления');
    assert.deepEqual(await Promise.all([teacherCourse.evaluate(workKeys),studentCourse.evaluate(workKeys)]),before);
    await t.locator('[data-cabinet-return]').click();await launch.waitFor();
    assert.equal(new URL(t.url()).hash,'#'+back);assert.equal(await t.evaluate(()=>LearningApp.account().id),teacher.id);
    assert.equal(await t.locator('[data-public-workspace] iframe').count(),0);
    assert.deepEqual(store.studentProfile(teacher,pupil.id),initialProfile);
    assert.equal(store.row('SELECT COUNT(*) AS n FROM attempts').n,initialAttempts);
    assert.deepEqual(writes,[]);assert.deepEqual(leaks,[]);assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
    console.log('MERZLYAK_PROGRAM_ROOM_OK: real assigned-program teacher card → nested board → local two-client room; task 2.19, bidirectional drafts, control handoff and exact cabinet return; no account/attempt/personal-work changes');
  } finally {
    await browser?.close(); if(roomProcess?.exitCode===null)roomProcess.kill('SIGTERM');
    await close(cabinetServer);await close(publicServer);store.close();fs.rmSync(tmp,{recursive:true,force:true});
  }
}
run().catch(err=>{console.error('MERZLYAK_PROGRAM_ROOM_FAILED at '+phase+': '+String(err.stack||err).replace(/([?&](?:room|token)=)[^\s&"'<>]+/g,'$1[redacted]'));process.exitCode=1;});
