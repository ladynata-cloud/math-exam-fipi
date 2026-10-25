'use strict';

// Real local classic-board/Socket.IO journeys with synthetic participants.
// No production account, room, saved plan or pupil attempt is touched.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { createReadStream, mkdirSync, statSync } = require('node:fs');
const { createServer } = require('node:http');
const { createServer: createNetServer } = require('node:net');
const { extname, join, resolve, sep } = require('node:path');
const { chromium } = require('playwright');

const ROOT = resolve(__dirname, '..');
const SHOTS = process.env.EGE_BAZA_BOARD_SHOTS;
const wait = ms => new Promise(done => setTimeout(done, ms));
let phase = 'startup';

async function freePort() {
  const server = createNetServer();
  await new Promise((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
  const port = server.address().port;
  await new Promise(done => server.close(done));
  return port;
}

function staticServer() {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
  return createServer((request, response) => {
    try {
      const path = decodeURIComponent(new URL(request.url, 'http://local').pathname);
      if (path === '/favicon.ico') { response.writeHead(204).end(); return; }
      let file = resolve(ROOT, '.' + path);
      if (file !== ROOT && !file.startsWith(ROOT + sep)) { response.writeHead(403).end(); return; }
      if (statSync(file).isDirectory()) file = join(file, 'index.html');
      response.setHeader('Content-Type', (types[extname(file)] || 'application/octet-stream') + '; charset=utf-8');
      response.setHeader('Cache-Control', 'no-store');
      createReadStream(file).pipe(response);
    } catch (_) { response.writeHead(404).end(); }
  });
}

async function healthy(url, child, logs) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error('Local server exited: ' + logs());
    try { if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) return; } catch (_) {}
    await wait(100);
  }
  throw new Error('Local server not ready: ' + logs());
}

async function session(browser, origin, name, errors) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(({ origin, name }) => {
    if (location.origin !== origin) return;
    if (window === top) {
      localStorage.setItem('baza-board-gate.control', 'untouched:' + name);
      window.__bazaMessages = 0;
      addEventListener('message', event => {
        if (event.source === document.querySelector('#trainerFrame')?.contentWindow && event.data?.type === 'mathexam:trainer-state') window.__bazaMessages++;
      });
    }
    if (/\/ege-baza-(11|13)\.html$/.test(location.pathname)) {
      window.__bazaStorage = [];
      for (const method of ['getItem', 'setItem', 'removeItem', 'clear']) {
        const original = Storage.prototype[method];
        Storage.prototype[method] = function (...args) {
          window.__bazaStorage.push(method);
          return original.apply(this, args);
        };
      }
    }
  }, { origin, name });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  page.setDefaultNavigationTimeout(20000);
  page.on('pageerror', error => errors.push(name + ': ' + error.message));
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.hostname === '127.0.0.1' && response.status() >= 400) errors.push(name + ': HTTP ' + response.status() + ' ' + url.pathname);
  });
  return { context, page, name };
}

async function frameFor(page, position) {
  const file = '/trainers/ege-baza-' + position + '.html';
  await page.waitForFunction(file => document.querySelector('#trainerFrame')?.src.includes(file), file);
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    const frame = page.frames().find(f => new URL(f.url() || 'about:blank').pathname === file);
    if (frame) { await frame.waitForFunction(() => !!window.__bazaBoard); return frame; }
    await wait(50);
  }
  throw Error('Base EGE frame did not load');
}
const snapshot = frame => frame.evaluate(() => window.__bazaBoard.getState());
const messages = page => page.evaluate(() => window.__bazaMessages);
const visible = frame => frame.evaluate(() => ({ text: document.querySelector('main').innerText, inputs: [...document.querySelectorAll('input,select,textarea')].map(e => [e.id,e.value]), details: [...document.querySelectorAll('details')].map(e => e.open), svg: [...document.querySelectorAll('svg')].map(e => e.innerHTML) }));
async function connected(page) { await page.waitForFunction(() => document.querySelector('#mirrorStatus')?.dataset.mirrorStatus === 'connected', null, { timeout: 15000 }); }
async function sync(controller, observer, label) {
  const value = await snapshot(controller);
  assert.equal(await controller.evaluate(v => __bazaBoard.validateState(v), value), true, label + ' state valid');
  try { await observer.waitForFunction(v => JSON.stringify(__bazaBoard.getState()) === JSON.stringify(v), value); } catch (error) { console.error(label, JSON.stringify({expected:value,actual:await snapshot(observer)})); throw error; }
  assert.deepEqual(await visible(observer), await visible(controller), label + ' visible work');
  return value;
}
async function quiet(pages) {
  let previous = await Promise.all(pages.map(messages)), unchanged = Date.now(); const deadline = Date.now() + 5000;
  while (Date.now() < deadline) { await wait(100); const current = await Promise.all(pages.map(messages)); if (current.some((v,i)=>v!==previous[i])) unchanged=Date.now(); else if(Date.now()-unchanged>500)return current; previous=current; }
  throw Error('Mirror echo loop');
}
async function help(frame, section) {
  if (!await frame.locator('#taskHelp').evaluate(e => e.open)) await frame.locator('#taskHelp > summary').click();
  const id=section==='model'?'taskModel':'taskSteps';
  if (!await frame.locator('#'+id).evaluate(e=>e.open)) await frame.locator('#'+id+' > summary').click();
  await frame.locator(section==='model'?'#model':'#taskStepsBody').waitFor({state:'visible'});
}
async function open(teacher, student, position) {
  await teacher.locator('#chooseTrainer').click();
  if (!await teacher.locator('#manualTrainerEntry').evaluate(e=>e.open)) await teacher.locator('#manualTrainerEntry summary').click();
  // Use the latest public course URL, not the wrapper, to verify the alias.
  await teacher.locator('#trainerUrl').fill('/ege-baza/path/index.html#lesson='+ (position===11?'practice-displacement':'scale'));
  await teacher.locator('#openTrainer').click();
  if (await teacher.locator('#pickerClose').isVisible()) await teacher.locator('#pickerClose').click();
  await Promise.all([connected(teacher),connected(student)]);
  return [await frameFor(teacher,position), await frameFor(student,position)];
}
async function handoff(teacher,student,on) {
  await teacher.locator('#openShare').click(); await teacher.locator('#controlToggle').click();
  await student.waitForFunction(on=>document.body.classList.contains('control-owner')===on,on);
  await teacher.waitForFunction(on=>document.body.classList.contains('control-owner')!==on,on);
  assert.equal(await student.locator('#trainerFrame').evaluate(e=>e.inert),!on);
  await teacher.locator('#sharePanel [data-close-panel]').click();
}
async function run(browser,origin,serverOrigin,errors) {
  const ts=await session(browser,origin,'teacher',errors), ss=await session(browser,origin,'student',errors),teacher=ts.page,student=ss.page;
  phase='create actual local room';
  await teacher.goto(origin+'/trainers/trainer-board.html?server='+encodeURIComponent(serverOrigin));
  await teacher.locator('#openShare').click(); await teacher.locator('#createRoom').click();
  await teacher.waitForFunction(()=>document.querySelector('#shareStatus')?.textContent==='подключено'&&document.querySelector('#studentLink')?.value.includes('role=student'));
  const link=await teacher.locator('#studentLink').inputValue(); await teacher.locator('#sharePanel [data-close-panel]').click();
  await student.goto(link);
  for (const n of [11,13]) {
    phase=n+': load latest course alias'; let [t,s]=await open(teacher,student,n); await sync(t,s,'initial '+n);
    phase=n+': all family navigation'; const ids=await t.evaluate(()=>BazaBoard.LESSONS[__bazaBoard.getState().position]);
    for (const id of ids) {
      await t.locator('.task-first-options > summary').click();
      await t.locator('#typeSelect').selectOption(id); await sync(t,s,'family '+id);
      const expectedTitle=await teacher.evaluate(async()=>{const data=await(await fetch('board-picker-data.json')).json();const url=document.querySelector('#trainerFrame').contentWindow.location.href;return data.entries.find(entry=>BoardPicker.canonical(entry.href)===BoardPicker.canonical(url))?.title||'Тренажёр по ссылке';});
      assert.equal(await teacher.locator('#openedTrainerTitle').innerText(),expectedTitle,'teacher title follows '+id);assert.equal(await student.locator('#openedTrainerTitle').innerText(),expectedTitle,'student title follows '+id);
      if(await t.locator('.task-first-options').evaluate(e=>e.open))await t.locator('.task-first-options > summary').click();
    }
    phase=n+': inputs, help and accepted step';
    await t.locator('#answer').fill('7/'); await help(t,'steps'); await t.locator('#stepAnswer').fill('3/');
    await sync(t,s,'separate drafts');
    const step=await t.evaluate(()=>{const st=__bazaBoard.getState();return PathData.task(st.route.slice(8),st.work.seed).steps[st.work.step].a;});
    await t.locator('#stepAnswer').fill(String(step)); await t.locator('#stepAnswer').press('Enter'); await sync(t,s,'accepted first step');
    await t.locator('#stepAnswer').fill('8'.repeat(401));assert.equal((await t.locator('#stepAnswer').inputValue()).length,200);await sync(t,s,'long pasted recreated step');
    await t.locator('#answer').fill('7'.repeat(401));assert.equal((await t.locator('#answer').inputValue()).length,200);await sync(t,s,'long pasted final');await t.locator('#answer').fill('7/');
    await help(t,'model');
    if(await t.locator('#angle').count())await t.locator('#angle').fill('43');
    if(await t.locator('#revealPlan').count())await t.locator('#revealPlan').click();
    await sync(t,s,'model and revealed work');
    await t.locator('#taskHelp > summary').click(); await sync(t,s,'hide help keeps work');
    assert.equal(await s.locator('#answer').inputValue(),'7/');
    let stable=await quiet([teacher,student]); await wait(550);assert.deepEqual(await Promise.all([teacher,student].map(messages)),stable,'no passive echo');
    phase=n+': late join and reload'; let late=await session(browser,origin,'late-'+n,errors); await late.page.goto(link);await connected(late.page);let l=await frameFor(late.page,n);await sync(t,l,'late join');await late.context.close();
    const before=await snapshot(t);await student.reload();await connected(student);s=await frameFor(student,n);await s.waitForFunction(v=>JSON.stringify(__bazaBoard.getState())===JSON.stringify(v),before);
    phase=n+': student writes';await handoff(teacher,student,true);await quiet([teacher,student]);const teacherMessages=await messages(teacher);
    await s.locator('#answer').fill('123');await sync(s,t,'student answer');await quiet([teacher,student]);assert.equal(await messages(teacher),teacherMessages,'teacher observer silent');
    const written=await snapshot(s);await teacher.reload();await connected(teacher);t=await frameFor(teacher,n);await t.waitForFunction(v=>JSON.stringify(__bazaBoard.getState())===JSON.stringify(v),written);
    await s.locator('#answer').press('Enter');await sync(s,t,'wrong answer feedback');
    await handoff(teacher,student,false);await quiet([teacher,student]);late=await session(browser,origin,'late-'+n,errors);await late.page.goto(link);await connected(late.page);l=await frameFor(late.page,n);await sync(t,l,'late join after transferred work');
    phase=n+': invalid state rejection';const unchanged=await snapshot(t);
    assert(await t.evaluate(()=>{const bad=__bazaBoard.getState();bad.work.independent=99;try{__bazaBoard.applyState(bad);return false;}catch{return true;}}));assert.deepEqual(await snapshot(t),unchanged);
    await t.locator('#new').click();await sync(t,s,'new task');await sync(t,l,'new task late');
    for(const [session,frame]of[[ts,t],[ss,s],[late,l]]){assert.equal(await session.page.evaluate(()=>localStorage.getItem('baza-board-gate.control')),'untouched:'+session.name);assert.deepEqual(await frame.evaluate(()=>window.__bazaStorage),[]);}
    phase=n+': screenshots and narrow layout';await t.locator('h1').scrollIntoViewIfNeeded();
    if(SHOTS){mkdirSync(SHOTS,{recursive:true});await teacher.screenshot({path:join(SHOTS,'baza-'+n+'-board.png'),fullPage:true});}
    await teacher.setViewportSize({width:390,height:1000});
    const size=await t.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert(size.scroll<=size.width+1,'mobile overflow '+JSON.stringify(size));
    if(SHOTS)await teacher.screenshot({path:join(SHOTS,'baza-'+n+'-mobile.png'),fullPage:true});
    await teacher.setViewportSize({width:1440,height:1000});await late.context.close();
  }
  assert.deepEqual(errors,[]);await ts.context.close();await ss.context.close();
  console.log('EGE_BAZA_BOARD_BROWSER_OK: latest course aliases; 12 families; teacher/student/late participant; distinct final and step drafts; help/model/accepted step; reload and control transfer; invalid-state rejection; no echo or personal storage; 1440/390px');
}
(async()=>{const server=staticServer();let browser,child,watchdog,logs='';try{
  await new Promise((done,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',done);});const origin='http://127.0.0.1:'+server.address().port;
  const port=await freePort(),serverOrigin='http://127.0.0.1:'+port,env={...process.env,HOST:'127.0.0.1',PORT:String(port),NODE_ENV:'test',CORS_ALLOWED_ORIGINS:origin};
  for(const key of Object.keys(env))if(/^(LEARNING_|PROGRESS_|GROUP_LESSON_)/.test(key))delete env[key];
  child=spawn(process.execPath,['index.js'],{cwd:join(ROOT,'board-server'),env,stdio:['ignore','ignore','pipe']});child.stderr.on('data',data=>{logs=(logs+String(data)).slice(-4000);});await healthy(serverOrigin+'/health',child,()=>logs);
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,headless:true,args:['--no-sandbox'],timeout:20000});
  await Promise.race([run(browser,origin,serverOrigin,[]),new Promise((_,reject)=>{watchdog=setTimeout(()=>reject(Error('Gate timeout '+phase)),240000);})]);
}finally{clearTimeout(watchdog);await browser?.close();if(child&&child.exitCode===null)child.kill('SIGTERM');await new Promise(done=>server.close(done));}})().catch(error=>{console.error('EGE_BAZA_BOARD_BROWSER_FAILED at '+phase+'\n'+(error.stack||error));process.exitCode=1;});
