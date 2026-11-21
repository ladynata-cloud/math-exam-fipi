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

const catalogue=process.argv.includes('--makarychev9-2017')?{
  directory:'makarychev9-2017',entries:[[50,36,36]],search:'makarychev9-2017',match:'36 пунктов',lesson:'50-4',chart:'svg[aria-label*="раскрытия скобок"]',storage:'math:makarychev9-2017:v1:'
}:process.argv.includes('--merzlyak9-2014')?{
  directory:'merzlyak9-2014',entries:[[55,26,26]],search:'merzlyak9-2014',match:'все параграфы',lesson:'55-13',chart:'svg[aria-label*="штриховая"]',storage:'math:merzlyak9-2014:v1:'
}:{
  directory:'tyurin-statistics',entries:[[113,67,23],[114,29,10]],search:'Тюрин',match:'вероятность и статистика',lesson:'114-28',chart:'svg[aria-label*="рассеивания"]',storage:'math:tyurin-stats:v1:'
};
async function run(browser, origin, serverOrigin) {
  const tc=await browser.newContext(),sc=await browser.newContext({viewport:{width:360,height:780}});
  try {
    const teacher=await tc.newPage(),student=await sc.newPage();
    for(const [book,count,direct] of catalogue.entries){
      await student.goto(origin+'/school/index.html#book/source-'+book);
      assert.equal(await student.locator('#main .skill-row').count(),count);
      const links=await student.locator('#main a[href*="'+catalogue.directory+'/index.html"]').evaluateAll(links=>links.map(el=>el.href));
      assert.equal(links.length,direct);
      for(const url of links){
        await student.goto(url);await student.locator('#model').waitFor();
        assert(await student.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),url);
        const id=new URL(url).hash.slice(8);
        assert.equal(await student.locator('#lesson').inputValue(),id);
        await student.locator('[data-action=practice]').click();await student.locator('#answer').fill('9999999');
        await student.locator('#work form button').click();await student.locator('#feedback').filter({hasText:'Проверь ещё раз'}).waitFor();
      }
    }
    phase='joint room';
    await teacher.goto(origin+'/trainers/trainer-board.html?server='+encodeURIComponent(serverOrigin));
    await teacher.locator('#openShare').click();await teacher.locator('#createRoom').click();
    try {
      await teacher.waitForFunction(()=>document.querySelector('#studentLink')?.value.includes('role=student'));
    } catch (error) {
      const status=await teacher.locator('#shareStatus').innerText();
      throw new Error('Unable to open the test room: '+status,{cause:error});
    }
    const invite=await teacher.locator('#studentLink').inputValue();await teacher.locator('#sharePanel [data-close-panel]').click();await student.goto(invite);
    await teacher.locator('#chooseTrainer').click();await teacher.locator('#pickerSearch').fill(catalogue.search);
    await teacher.locator('#pickerResults .picker-item').filter({hasText:catalogue.match}).first().click();
    const connected=p=>p.waitForFunction(()=>document.querySelector('#mirrorStatus')?.dataset.mirrorStatus==='connected');
    await Promise.all([connected(student),connected(teacher)]);
    const frame=p=>p.frameLocator('#trainerFrame'),t=frame(teacher),s=frame(student);
    const value=(page,id,v)=>page.waitForFunction(([k,a])=>document.querySelector('#trainerFrame')?.contentDocument?.getElementById(k)?.value===a,[id,v]);
    await t.locator('#lesson').selectOption(catalogue.lesson);await value(student,'lesson',catalogue.lesson);
    await t.locator('#model').focus();await t.locator('#model').press('ArrowRight');await value(student,'model','1');
    assert.equal(await s.locator(catalogue.chart).count(),1);
    await t.locator('[data-action=practice]').click();await t.locator('#answer').fill('1234');await value(student,'answer','1234');
    await t.locator('#work form button').click();await s.locator('#feedback').filter({hasText:'Проверь ещё раз'}).waitFor();
    await t.locator('[data-action=hint]').click();await s.locator('#work ol li').first().waitFor();
    await teacher.locator('#openShare').click();await teacher.locator('#controlToggle').click();
    await student.waitForFunction(()=>document.body.classList.contains('control-owner'));await teacher.locator('#sharePanel [data-close-panel]').click();
    await s.locator('[data-action=hint]').click();await t.locator('#work ol li').nth(1).waitFor();
    await teacher.reload();
    await connected(teacher);
    await value(teacher,'answer','1234');
    await t.locator('#work ol li').nth(1).waitFor();
    await s.locator('#answer').fill('4321');await value(teacher,'answer','4321');
    await student.reload();
    await connected(student);
    await value(student,'answer','4321');
    await s.locator('#work ol li').nth(1).waitFor();
    assert.equal(await student.evaluate(key=>JSON.parse(localStorage.getItem(key)).draft,catalogue.storage+catalogue.lesson),'9999999');
    // A pupil disconnect returns control to the teacher. Re-grant it to the
    // reconnected pupil before exercising changes in the other direction.
    if (await teacher.locator('body').evaluate(body=>body.classList.contains('control-owner'))) {
      await teacher.locator('#openShare').click();
      await teacher.locator('#controlToggle').click();
      await teacher.locator('#sharePanel [data-close-panel]').click();
    }
    await student.waitForFunction(()=>document.body.classList.contains('control-owner'));
    const alternate=await s.locator('#lesson').evaluate(select=>Array.from(select.options).find(option=>option.value!==select.value).value);
    await s.locator('#lesson').selectOption(alternate);
    await value(teacher,'lesson',alternate);
    await s.locator('#model').focus();
    await s.locator('#model').press('ArrowRight');
    await value(teacher,'model','1');
    await s.locator('[data-action=practice]').click();
    await t.locator('#answer').waitFor();
    await s.locator('#answer').fill('98765');
    await value(teacher,'answer','98765');
    await s.locator('#work form button').click();
    await t.locator('#feedback').filter({hasText:'Проверь ещё раз'}).waitFor();
    console.log(catalogue.directory+' mobile practice entries; real teacher/student model, draft, error, help, transfer and personal storage passed.');
  } finally {await tc.close();await sc.close();}
}
(async()=>{const server=staticServer();let browser,child,watchdog,logs='';try{
  await new Promise((done,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',done);});const origin='http://127.0.0.1:'+server.address().port;
  const port=await freePort(),serverOrigin='http://127.0.0.1:'+port,env={...process.env,HOST:'127.0.0.1',PORT:String(port),NODE_ENV:'test',CORS_ALLOWED_ORIGINS:origin};
  for(const key of Object.keys(env))if(/^(LEARNING_|PROGRESS_|GROUP_LESSON_)/.test(key))delete env[key];
  child=spawn(process.execPath,['index.js'],{cwd:join(ROOT,'board-server'),env,stdio:['ignore','ignore','pipe']});child.stderr.on('data',data=>{logs=(logs+String(data)).slice(-4000);});await healthy(serverOrigin+'/health',child,()=>logs);
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,headless:true,args:['--no-sandbox'],timeout:20000});
  await Promise.race([run(browser,origin,serverOrigin),new Promise((_,reject)=>{watchdog=setTimeout(()=>reject(Error('Gate timeout '+phase)),240000);})]);
}finally{clearTimeout(watchdog);await browser?.close();if(child&&child.exitCode===null)child.kill('SIGTERM');await new Promise(done=>server.close(done));}})().catch(error=>{console.error('TYURIN_BOARD_FAILED at '+phase+'\n'+(error.stack||error));process.exitCode=1;});
