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
    if (/\/trainers\/(?:atanasyan-grade7|geometry7-rebuild)\.html$/.test(location.pathname)) {
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
  await context.route('**/api/{learning,progress}/**',route=>route.abort());
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.setDefaultNavigationTimeout(60000);
  page.on('pageerror', error => errors.push(name + ': ' + error.message));
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.hostname === '127.0.0.1' && response.status() >= 400) errors.push(name + ': HTTP ' + response.status() + ' ' + url.pathname);
  });
  return { context, page, name };
}


async function connected(page){await page.waitForFunction(()=>document.querySelector('#mirrorStatus')?.dataset.mirrorStatus==='connected',null,{timeout:20000});}
async function frameFor(page,file){await page.waitForFunction(file=>document.querySelector('#trainerFrame')?.src.includes(file),file);let frame;for(let i=0;i<200;i++){frame=page.frames().find(f=>new URL(f.url()||'about:blank').pathname==='/trainers/'+file);if(frame){try{await frame.waitForFunction(()=>!!(window.Geometry7Practice?.getState()||window.__atanasyanGrade7Board||window.__bazaBoard),null,{timeout:1000});return frame;}catch(_){}}await wait(50);}throw Error('Trainer not ready '+file);}
const snapshot=frame=>frame.evaluate(()=>(window.Geometry7Practice||window.__atanasyanGrade7Board||window.__bazaBoard).getState());
async function settledSnapshot(frame){let previous='',stable=0;for(let i=0;i<100;i++){const value=await snapshot(frame),serialized=JSON.stringify(value);stable=serialized===previous?stable+1:0;if(stable>=2)return value;previous=serialized;await wait(50);}throw Error('Controller state did not settle');}
async function sync(a,b,label){const expected=await settledSnapshot(a);try{await b.waitForFunction(s=>JSON.stringify((window.Geometry7Practice||window.__atanasyanGrade7Board||window.__bazaBoard).getState())===JSON.stringify(s),expected);}catch(e){console.error(label,JSON.stringify({expected,actual:await snapshot(b)}));throw e;}assert.deepEqual(await snapshot(a),expected,label+' controller stable after asynchronous dispatch');console.log('PASS',label);return expected;}
async function native(page){await page.waitForFunction(()=>{const w=document.querySelector('#trainerFrame')?.contentWindow;return w?.document.documentElement.dataset.geometry7Board==='ready';});return page.frames().find(f=>f.url().includes('/geometry-course/trainers/'));}
async function handoff(teacher,student,on){await teacher.locator('#openShare').click();await teacher.locator('#controlToggle').click();await student.waitForFunction(on=>document.body.classList.contains('control-owner')===on,on);await teacher.locator('#sharePanel [data-close-panel]').click();}
async function run(browser,origin,serverOrigin,errors){
 const ts=await session(browser,origin,'teacher',errors),ss=await session(browser,origin,'pupil',errors),teacher=ts.page,student=ss.page;
 await teacher.goto(origin+'/trainers/trainer-board.html?server='+encodeURIComponent(serverOrigin));await teacher.locator('#openShare').click();await teacher.locator('#createRoom').click();
 await teacher.waitForFunction(()=>document.querySelector('#shareStatus')?.textContent==='подключено'&&document.querySelector('#studentLink')?.value.includes('role=student'));
 const link=await teacher.locator('#studentLink').inputValue();await teacher.locator('#sharePanel [data-close-panel]').click();await student.goto(link);
 for(const file of ['atanasyan-grade7.html','geometry7-rebuild.html','geometry7-practice.html']){
  phase=file;
  await teacher.locator('#chooseTrainer').click();if(!await teacher.locator('#manualTrainerEntry').evaluate(e=>e.open))await teacher.locator('#manualTrainerEntry summary').click();await teacher.locator('#trainerUrl').fill('/trainers/'+file);await teacher.locator('#openTrainer').click();if(await teacher.locator('#pickerClose').isVisible())await teacher.locator('#pickerClose').click();
  await Promise.all([connected(teacher),connected(student)]);let t=await frameFor(teacher,file),s=await frameFor(student,file);await sync(t,s,file+' initial');
  if(file==='atanasyan-grade7.html'){
   await t.locator('#catalog-search').fill('161');await t.locator('[data-lesson]').first().click();await t.locator('#final-answer').fill('Синтетическое доказательство параллельности.');await t.locator('[data-main-help]>summary').click();await t.getByRole('button',{name:'Разобрать по шагам',exact:true}).click();await t.getByRole('button',{name:'Увеличить чертёж',exact:true}).click();
  }else if(file==='geometry7-rebuild.html'){
   await t.locator('a[href^="#lesson="]').first().click();await t.locator('#answer').fill('123');await t.locator('#taskHelp>summary').click();await t.locator('#taskModel>summary').click();await t.waitForFunction(()=>__bazaBoard.getState().work.ui.model!==null);await t.locator('[data-geometry-select]').first().click();await t.locator('[data-geometry-next]').click();
  }else{
   await t.locator('#exercise-choice').selectOption('ch2-p1-t3-proof-sas');let n=await native(teacher);await n.locator('#geometry7-givens').fill('Дано: две стороны и угол между ними.');const text=await n.evaluate(()=>CARDS.find(c=>c.id==='overlay').txt);await n.getByRole('button',{name:text,exact:true}).click();await wait(1400);
  }
  const saved=await sync(t,s,file+' work');
  const late=await session(browser,origin,'late',errors);await late.page.goto(link);await connected(late.page);await sync(t,await frameFor(late.page,file),file+' late join');await late.context.close();
  await student.reload();await connected(student);s=await frameFor(student,file);await sync(t,s,file+' reload');
  await handoff(teacher,student,true);
  if(file==='atanasyan-grade7.html')await s.locator('#final-answer').fill('Синтетический ответ ученика.');else if(file==='geometry7-rebuild.html')await s.locator('#answer').fill('321');else await (await native(student)).locator('#geometry7-reasons').fill('Ученик объяснил основания.');
  await sync(s,t,file+' pupil control');
  await teacher.evaluate(()=>{window.__g7Disconnected=false;shared.socket.once('disconnect',()=>{window.__g7Disconnected=true;});});await ts.context.setOffline(true);await teacher.evaluate(()=>shared.socket.io.engine.close());await teacher.waitForFunction(()=>window.__g7Disconnected&&!shared.connected);
  if(file==='atanasyan-grade7.html')await s.locator('#final-answer').fill('Изменение при отключённом преподавателе.');else if(file==='geometry7-rebuild.html')await s.locator('#answer').fill('456');else await (await native(student)).locator('#geometry7-conclusion').fill('Вывод после отключения.');
  await ts.context.setOffline(false);await connected(teacher);await sync(s,t,file+' reconnect');await handoff(teacher,student,false);
  await student.evaluate(()=>{window.__g7Disconnected=false;shared.socket.once('disconnect',()=>{window.__g7Disconnected=true;});});await ss.context.setOffline(true);await student.evaluate(()=>shared.socket.io.engine.close());await student.waitForFunction(()=>window.__g7Disconnected&&!shared.connected);
  if(file==='atanasyan-grade7.html')await t.locator('#final-answer').fill('Учитель продолжил при отключённом ученике.');else if(file==='geometry7-rebuild.html')await t.locator('#answer').fill('789');else await(await native(teacher)).locator('#geometry7-givens').fill('a<b>c — сравнение сохраняется без потери знаков.');
  await ss.context.setOffline(false);await connected(student);await sync(t,s,file+' pupil reconnect');
  assert.equal(await student.locator('#trainerFrame').evaluate(e=>e.inert),true);
  if(file==='geometry7-practice.html'){await t.locator('#exercise-choice').selectOption('ch2-constr-angle-bisector');const n=await native(teacher);await n.locator('#cv').scrollIntoViewIfNeeded();const box=await n.locator('#cv').boundingBox();await teacher.mouse.move(box.x+150/640*box.width,box.y+390/460*box.height);await teacher.mouse.down();await teacher.mouse.move(box.x+330/640*box.width,box.y+390/460*box.height,{steps:12});await teacher.mouse.up();await n.waitForFunction(()=>step===1);await sync(t,s,'native compass arc through room');const peer=await native(student);await peer.waitForFunction(()=>step===1&&P.some(p=>p.name==='A')&&P.some(p=>p.name==='B'));await n.locator('#cv').scrollIntoViewIfNeeded();}
  else await t.evaluate(()=>window.scrollTo(0,0));
  if(SHOTS){mkdirSync(SHOTS,{recursive:true});await teacher.screenshot({path:join(SHOTS,file.replace('.html','.png')),fullPage:true});}
 }
 assert.deepEqual(errors,[]);await ts.context.close();await ss.context.close();console.log('GEOMETRY7_ROOM_GATE_PASS');
}
(async()=>{const server=staticServer();let browser,child,watchdog,logs='';try{
  let origin=process.env.GEOMETRY7_SITE,serverOrigin=process.env.GEOMETRY7_SERVER;
  if(origin){assert.equal(process.env.MATHEXAM_PUBLISHED_SMOKE,'1');assert.equal(origin,'https://mathexam.space');assert.equal(serverOrigin,'https://mathexam-board-ladynata.msk1.amvera.tech');}
  else{await new Promise((done,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',done);});origin='http://127.0.0.1:'+server.address().port;
  const port=await freePort();serverOrigin='http://127.0.0.1:'+port;const env={...process.env,HOST:'127.0.0.1',PORT:String(port),NODE_ENV:'test',CORS_ALLOWED_ORIGINS:origin};
  for(const key of Object.keys(env))if(/^(LEARNING_|PROGRESS_|GROUP_LESSON_)/.test(key))delete env[key];
  child=spawn(process.execPath,['index.js'],{cwd:join(ROOT,'board-server'),env,stdio:['ignore','ignore','pipe']});child.stderr.on('data',data=>{logs=(logs+String(data)).slice(-4000);});await healthy(serverOrigin+'/health',child,()=>logs);}
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,headless:true,args:['--no-sandbox'],timeout:20000});
  await Promise.race([run(browser,origin,serverOrigin,[]),new Promise((_,reject)=>{watchdog=setTimeout(()=>reject(Error('Gate timeout '+phase)),480000);})]);
}finally{clearTimeout(watchdog);await browser?.close();if(child&&child.exitCode===null)child.kill('SIGTERM');if(server.listening)await new Promise(done=>server.close(done));}})().catch(error=>{console.error('GEOMETRY7_ROOM_FAILED at '+phase+'\n'+String(error.stack||error).replace(/([?&](?:token|teacherToken|studentToken)=)[^&\s"'<>]+/gi,'$1[redacted]'));process.exitCode=1;});
