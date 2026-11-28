'use strict';

// Real local classic-board/Socket.IO journeys with synthetic participants.
// No production account, room, saved plan or pupil attempt is touched.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { createReadStream, statSync } = require('node:fs');
const { createServer } = require('node:http');
const { createServer: createNetServer } = require('node:net');
const { extname, join, resolve, sep } = require('node:path');
const { chromium } = require('playwright');

const ROOT = resolve(__dirname, '..');
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

async function run(browser, origin, serverOrigin) {
  const desktop=await browser.newContext({viewport:{width:1100,height:850}});
  const mobile=await browser.newContext({viewport:{width:360,height:780}});
  try {
    const teacher=await desktop.newPage(),student=await mobile.newPage();
    const courses=['5','6','7','8','9','10','11','foundation','probability','vilenkin5','vilenkin6','makarychev7-start','makarychev9'];
    for(const id of courses){
      phase='entry '+id;
      await student.goto(origin+'/school/index.html#course/'+id);
      const link=student.locator('a[href*="school-workshop-check/index.html"]').first();
      assert.match(await link.getAttribute('href'),new RegExp('course='+id+'$'));
      assert(await link.evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight),'First-screen access '+id);
      await link.click();await student.locator('#answer').waitFor();
      assert.equal(await student.locator('#course').inputValue(),id);
      assert(await student.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    }
    phase='standalone resume';
    await student.locator('#answer').fill('12345');
    await student.reload();assert.equal(await student.locator('#answer').inputValue(),'12345');
    phase='connect board';
    await teacher.goto(origin+'/trainers/trainer-board.html?server='+encodeURIComponent(serverOrigin));
    await teacher.locator('#openShare').click();await teacher.locator('#createRoom').click();
    await teacher.waitForFunction(()=>document.querySelector('#shareStatus')?.textContent==='подключено'&&document.querySelector('#studentLink')?.value.includes('role=student'));
    const invite=await teacher.locator('#studentLink').inputValue();await teacher.locator('#sharePanel [data-close-panel]').click();
    await student.goto(invite);
    await teacher.locator('#chooseTrainer').click();await teacher.locator('#pickerSearch').fill('Итоговая работа школьной мастерской');
    await teacher.locator('#pickerResults .picker-item').filter({hasText:'Итоговая работа школьной мастерской'}).first().click();
    const connected=p=>p.waitForFunction(()=>document.querySelector('#mirrorStatus')?.dataset.mirrorStatus==='connected');
    await Promise.all([connected(student),connected(teacher)]);
    const frame=p=>p.frameLocator('#trainerFrame'), t=frame(teacher), s=frame(student);
    const waitText=(f,selector,value)=>f.locator(selector).filter({hasText:value}).waitFor();
    const equalInput=(p,sel,v)=>p.waitForFunction(([k,a])=>document.querySelector('#trainerFrame')?.contentDocument?.querySelector(k)?.value===a,[sel,v]);
    phase='shared question, feedback and model';
    await t.locator('#course').selectOption('probability');await equalInput(student,'#course','probability');
    await t.locator('#answer').fill('123456');await equalInput(student,'#answer','123456');
    await t.locator('form button').click();await waitText(s,'#feedback','Пока не сходится');
    await t.locator('[data-action=hint]').click();await s.locator('#concept-model .model-image > *').first().waitFor();
    phase='delegate control';
    await teacher.locator('#openShare').click();await teacher.locator('#controlToggle').click();
    await student.waitForFunction(()=>document.body.classList.contains('control-owner'));
    await teacher.locator('#sharePanel [data-close-panel]').click();
    await s.locator('[data-action=skip]').click();await waitText(t,'#work','Задание 2 из 6');
    await s.locator('#answer').fill('47');await equalInput(teacher,'#answer','47');
    phase='late participant receives current state';
    const late=await browser.newContext();try{
      const newcomer=await late.newPage();await newcomer.goto(invite);await connected(newcomer);
      await equalInput(newcomer,'#course','probability');await equalInput(newcomer,'#answer','47');
      await waitText(frame(newcomer),'#work','Задание 2 из 6');
    }finally{await late.close();}
    const stored=await student.evaluate(()=>JSON.parse(localStorage.getItem('mathexam:school-final:v1:makarychev9')));
    assert.equal(stored.draft,'12345');
    console.log('13 course entries at 360 px, personal resume, room initial and edited work, model, control transfer, late observer and personal storage passed.');
  } finally {await desktop.close();await mobile.close();}
}
(async()=>{const server=staticServer();let browser,child,watchdog,logs='';try{
  await new Promise((done,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',done);});const origin='http://127.0.0.1:'+server.address().port;
  const port=await freePort(),serverOrigin='http://127.0.0.1:'+port,env={...process.env,HOST:'127.0.0.1',PORT:String(port),NODE_ENV:'test',CORS_ALLOWED_ORIGINS:origin};
  for(const key of Object.keys(env))if(/^(LEARNING_|PROGRESS_|GROUP_LESSON_)/.test(key))delete env[key];
  child=spawn(process.execPath,['index.js'],{cwd:join(ROOT,'board-server'),env,stdio:['ignore','ignore','pipe']});child.stderr.on('data',data=>{logs=(logs+String(data)).slice(-4000);});await healthy(serverOrigin+'/health',child,()=>logs);
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,headless:true,args:['--no-sandbox'],timeout:20000});
  await Promise.race([run(browser,origin,serverOrigin),new Promise((_,reject)=>{watchdog=setTimeout(()=>reject(Error('Gate timeout '+phase)),240000);})]);
}finally{clearTimeout(watchdog);await browser?.close();if(child&&child.exitCode===null)child.kill('SIGTERM');await new Promise(done=>server.close(done));}})().catch(error=>{console.error('SCHOOL_WORKSHOP_BOARD_FAILED at '+phase+'\n'+(error.stack||error));process.exitCode=1;});
