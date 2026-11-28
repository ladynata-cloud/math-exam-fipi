'use strict';
// Native wrappers, unmodified bridge and local room server in real Chromium.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { createReadStream, statSync } = require('node:fs');
const { createServer } = require('node:http');
const { createServer: createNetServer } = require('node:net');
const { extname, join, resolve, sep } = require('node:path');
const { chromium } = require('playwright');
const ROOT = resolve(__dirname, '..');
const PERSONAL_KEYS=['mathexam.peterson6.textbook.v1','mathexam.peterson6.workshop.v1','mathexam.peterson6.analogue.v1.175-1'];
const wait = ms => new Promise(done => setTimeout(done, ms));
let phase='startup';
async function freePort() {
  const server = createNetServer();
  await new Promise((done, fail) => { server.once('error', fail); server.listen(0, '127.0.0.1', done); });
  const port = server.address().port; await new Promise(done => server.close(done)); return port;
}
function staticServer() {
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
    '.svg': 'image/svg+xml', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp', '.woff2': 'font/woff2' };
  return createServer((request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://local').pathname);
      if (pathname === '/favicon.ico') { response.writeHead(204).end(); return; }
      let file = resolve(ROOT, '.' + pathname);
      if (file !== ROOT && !file.startsWith(ROOT + sep)) { response.writeHead(403).end(); return; }
      if (statSync(file).isDirectory()) file = join(file, 'index.html');
      response.setHeader('Content-Type', (mime[extname(file)] || 'application/octet-stream') + (/\.(html|js|css|json|svg)$/.test(file) ? '; charset=utf-8' : ''));
      response.setHeader('Cache-Control', 'no-store'); createReadStream(file).pipe(response);
    } catch (_) { response.writeHead(404).end(); }
  });
}
async function waitForHealth(origin, child, diagnostics) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error('Board server exited: ' + diagnostics());
    try { if ((await fetch(origin + '/health', { signal: AbortSignal.timeout(1000) })).ok) return; } catch (_) {}
    await wait(100);
  }
  throw new Error('Board server health timed out: ' + diagnostics());
}
async function session(browser, origin, backend, tag, failures) {
 const context=await browser.newContext({viewport:{width:1280,height:900}}), values=PERSONAL_KEYS.map(k=>'private:'+tag+':'+k);
 await context.route('**/*',r=>[origin,backend].includes(new URL(r.request().url()).origin)?r.continue():r.abort());
 await context.addInitScript(({origin,keys,values})=>{
  if(location.origin!==origin)return;
  if(window===top){if(!localStorage.getItem('privacy-test')){for(const [i,key] of keys.entries())localStorage.setItem(key,values[i]);localStorage.setItem('privacy-test','1');}return;}
  if(!/^\/trainers\/peterson6-(textbook|workshop)\.html$/.test(location.pathname))return;
  window.__privateAccess=0;
  for(const method of ['getItem','setItem','removeItem']){
   const original=Storage.prototype[method];
   Storage.prototype[method]=function(key,...args){if(key.startsWith('mathexam.peterson6.')){window.__privateAccess++;throw Error('Private storage accessed');}return original.call(this,key,...args);};
  }
 },{origin,keys:PERSONAL_KEYS,values});
 const page=await context.newPage();page.setDefaultTimeout(12000);
 page.on('pageerror',e=>failures.push(tag+': '+e.message));return {page,context,values};
}
async function frameFor(page,wrapper){
 const handle=page.frameLocator('#trainerFrame');await handle.locator('body[data-peterson-board]').waitFor();
 const frame=page.frames().find(f=>new URL(f.url(), 'about:blank').pathname===wrapper);
 assert(frame,'registered iframe');await frame.waitForFunction(()=>!!window.PetersonVolumeRoom);return frame;
}
const snap=frame=>frame.evaluate(()=>PetersonVolumeRoom.getState());
async function same(a,b,label){
 const scene=await snap(a);
 assert(await a.evaluate(v=>PetersonVolumeRoom.validateState(v),scene),label+' validation');
 try{
  await b.waitForFunction(scene=>JSON.stringify(PetersonVolumeRoom.getState())===JSON.stringify(scene),scene,{timeout:7000,polling:40});
 }catch(e){assert.deepEqual(await snap(b),scene,label);throw e;}
 const view=frame=>frame.evaluate(()=>({
  heading:document.querySelector('h1')?.textContent,question:document.querySelector('.problem')?.textContent,
  answer:document.querySelector('#answer')?.value,note:document.querySelector('#note')?.value,
  feedback:document.querySelector('#feedback')?.textContent,opened:[...document.querySelectorAll('#main details')].map(x=>x.open)
 }));
 assert.deepEqual(await view(b),await view(a),label+' visible');return scene;
}
async function waitConnected(page) {
  await page.waitForFunction(() => document.querySelector('#shareStatus')?.textContent === 'подключено' &&
    document.querySelector('#mirrorStatus')?.dataset.mirrorStatus === 'connected', null, { polling: 50, timeout: 15000 });
}
async function verifyEarlierRegistry(browser, origin, backend, failures) {
  const ids=['peterson6-textbook','peterson6-workshop'];
  const old=await session(browser,origin,backend,'earlier-registry',failures),page=old.page;
  let roomCreates=0;
  page.on('request',req=>{if(req.method()==='POST'&&new URL(req.url()).pathname==='/api/rooms')roomCreates++;});
  await old.context.route('**/api/trainer-registry',async route=>{
    const response=await route.fetch(),data=await response.json();
    data.trainers=data.trainers.filter(row=>!ids.includes(row.trainerId));
    // A real earlier projection is calculated by the server from the former list.
    data.digest='sha256:'+require('node:crypto').createHash('sha256').update(JSON.stringify(data.trainers)).digest('hex');
    await route.fulfill({response,json:data});
  });
  const start=origin+'/trainers/trainer-board.html?server='+encodeURIComponent(backend);
  await page.goto(start);await page.locator('#openShare').click();await page.locator('#createRoom').click();
  await page.waitForFunction(()=>document.querySelector('#studentLink').value.includes('role=student'));
  await page.locator('#sharePanel [data-close-panel]').click();await waitConnected(page);
  const prior=await page.evaluate(()=>({scene:publicSnapshot(),frame:frame.src,room:shared.roomId}));
  for(const id of ids){
    await page.locator('#chooseTrainer').click();await page.locator('#pickerSearch').fill(id);
    await page.locator('#pickerResults .picker-item').first().click();
    await page.waitForFunction(()=>!document.querySelector('#pickerError').hidden&&document.querySelector('#pickerError').textContent.includes('занятие сохранено'));
    assert.deepEqual(await page.evaluate(()=>({scene:publicSnapshot(),frame:frame.src,room:shared.roomId})),prior);
    await page.locator('#trainerPicker').evaluate(dialog=>dialog.close());
  }
  for(const id of ids){
    // This browser stored its local sheet while connected to the newer release.
    await page.evaluate(id=>sessionStorage.setItem('mathexam.trainerBoard.v1',JSON.stringify({
      current:0,trainerUrl:'/trainers/'+id+'.html#map',pages:[{id:'earlier-sheet',bg:'grid',strokes:[],redo:[]}]
    })),id);
    await page.goto(start+'&demo=1');
    await page.locator('#openShare').click();await page.locator('#createRoom').click();
    await page.waitForFunction(()=>document.querySelector('#shareStatus').textContent.includes('Текущая работа сохранена'));
  }
  assert.equal(roomCreates,1,'unregistered wrappers never create an empty or replacement room');
  await old.context.close();
}
async function run(browser, origin, backend, failures, published) {
  if (!published) await verifyEarlierRegistry(browser,origin,backend,failures);
  const byId = id => require('../trainers/board-compat.json').trainers.find(entry => entry.trainerId === id);
  for (const [id, route] of [['peterson6-textbook','#n/175'],['peterson6-workshop','#train/fraction-reduce/2']]) {
    phase=id;
    const wrapper='/trainers/'+id+'.html';
    const teacherSession=await session(browser,origin,backend,id+'-teacher',failures);
    const studentSession=await session(browser,origin,backend,id+'-student',failures);
    const teacher=teacherSession.page,student=studentSession.page;
    await teacher.goto(origin+'/trainers/trainer-board.html?server='+encodeURIComponent(backend));
    const publicRoute=id==='peterson6-textbook'?'/school/peterson6/textbook/':'/trainers/peterson6-workshop/';
    assert.equal(await teacher.evaluate(input=>BoardPicker.normalize(input), publicRoute+'?from=123&part=private'+route),wrapper+route);
    if(id==='peterson6-workshop'){
      const skills=require('../trainers/peterson6-workshop/generators.js').skills.map(s=>s.id);
      for(const skill of skills)assert.equal(await teacher.evaluate(input=>BoardPicker.normalize(input),publicRoute+'#train/'+skill+'/3'),wrapper+'#train/'+skill+'/3');
    }
    await teacher.locator('#openShare').click();await teacher.locator('#createRoom').click();
    await teacher.waitForFunction(()=>document.querySelector('#studentLink').value.includes('role=student')&&document.querySelector('#shareStatus').textContent==='подключено');
    const link=await teacher.locator('#studentLink').inputValue();
    await teacher.locator('#sharePanel [data-close-panel]').click();await student.goto(link);
    await teacher.locator('#chooseTrainer').click();await teacher.locator('#pickerSearch').fill(id);
    await teacher.locator('#pickerResults .picker-item').filter({hasText:byId(id).title}).first().click();
    await Promise.all([waitConnected(teacher),waitConnected(student)]);
    let a=await frameFor(teacher,wrapper),b=await frameFor(student,wrapper);
    await same(a,b,'initial map');assert.deepEqual(await snap(a),{route:'#map'});
    await a.locator('a[href="'+(id==='peterson6-textbook'?route:'#train/fraction-reduce/1')+'"]').first().click();
    if(id==='peterson6-workshop')await a.locator('a[href="'+route+'"]').first().click();
    await a.waitForSelector('#answer');
    await a.locator('#answer').fill('13');await a.locator('#answer-form button').click();
    await a.locator('[data-action=guided]').click();
    await a.locator('#note-details summary').click();await a.locator('#note').fill('Начали вместе');
    if(id==='peterson6-textbook'){
      assert.equal(await a.locator('input[type=file]').count(),0);
      await a.locator('.equivalent-exercise > summary').click();
      await a.locator('.equivalent-exercise > button').click();
      const field=a.locator('.equivalent-exercise form input,.equivalent-exercise form select');
      if(await field.evaluate(x=>x.tagName==='INPUT'))await field.fill('13');else await field.selectOption({index:1});
      await a.locator('.equivalent-exercise form button').click();
      await a.locator('.equivalent-exercise details summary').click();
      await a.locator('[data-action=zoom]').click();await same(a,b,'shared enlarged material');
      assert(await b.locator('dialog').evaluate(el=>el.open));await a.locator('#close-source').click();
    }else{
      await a.locator('[data-action=rule]').click();
    }
    const before=await same(a,b,'exercise, guidance, feedback and notes');
    assert.equal(before.work.assisted,true);assert.equal(before.work.independent,false);
    await student.reload();await waitConnected(student);b=await frameFor(student,wrapper);await same(a,b,'observer reload');
    await teacher.locator('#openShare').click();await teacher.locator('#controlToggle').click();
    await student.waitForFunction(()=>document.body.classList.contains('control-owner'));
    await teacher.locator('#sharePanel [data-close-panel]').click();
    await b.locator('#note').fill('Если a<b и c>d, то x<0. Записано ~l.');
    await same(b,a,'student keeps working in the same variant');
    assert.equal(await a.locator('#note').inputValue(),'Если a<b и c>d, то x<0. Записано ~l.');
    if(id==='peterson6-workshop'){
      const seed=(await snap(b)).seed;await b.locator('[data-action=new]').click();await same(b,a,'new seeded problem');
      assert.notEqual((await snap(b)).seed,seed);
    }else{
      await b.locator('a[href="#n/176"]').click();await b.waitForFunction(()=>document.querySelector('h1')?.textContent.includes('176'));
      await same(b,a,'next printed number');
      await b.locator('#number-input').fill('11');await b.locator('#number-form button').click();
      await b.waitForFunction(()=>document.querySelector('h1')?.textContent==='Задание №11');
      await b.locator('[data-action=guided]').click();await b.locator('[data-action=step-help]').click();
      await b.locator('[data-action=micro]').click();await b.locator('#micro-answer').fill('9');
      const nested=await same(b,a,'partial microstep and step-specific help');
      assert.equal(nested.work.micro[0].drafts[0],'9');assert.equal(nested.work.stepHelp[0],true);
      await b.locator('#number-input').fill('181');await b.locator('#number-form button').click();
      await b.waitForFunction(()=>document.querySelector('h1')?.textContent==='Задание №181');
      await b.locator('#answer').fill('17');await b.locator('#answer-form button').click();
      await b.locator('#answer').fill('7,6');await b.locator('#answer-form button').click();
      const corrected = await same(b,a,'pupil corrects a shared answer');
      assert.equal(corrected.work.firstErrors.final,'17');
      assert.equal(await a.locator('article .badge').innerText(),'Решено на общей доске');
    }
    const late=await session(browser,origin,backend,id+'-late',failures);await late.page.goto(link);
    await waitConnected(late.page);const c=await frameFor(late.page,wrapper);await same(b,c,'late participant receives open work');
    await teacher.reload();await waitConnected(teacher);a=await frameFor(teacher,wrapper);await same(b,a,'teacher reload');
    await b.evaluate(()=>{const bad={...PetersonVolumeRoom.getState(),records:{}};if(PetersonVolumeRoom.validateState(bad))throw Error('Unexpected history in room snapshot');try{PetersonVolumeRoom.applyState(bad);}catch(_){return;}throw Error('Invalid state accepted');});
    for(const [client,frame] of [[teacherSession,a],[studentSession,b],[late,c]]){
      assert.equal(await frame.evaluate(()=>window.__privateAccess),0);
      assert.deepEqual(await client.page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),PERSONAL_KEYS),client.values);
      await client.context.close();
    }
  }
  assert.deepEqual(failures,[]);
  console.log('Peterson volume 1: both classroom contracts passed with teacher, pupil, late join, role transfer, reload and isolated personal storage.');
}
(async () => {
  const server = staticServer(); let browser, child, watchdog, serverErrors = '';
  try {
    let origin = process.env.PETERSON6_SITE, backend = process.env.PETERSON6_BOARD_SERVER;
    const published = Boolean(origin || backend);
    const args = ['--no-sandbox', '--disable-dev-shm-usage'];
    if (published) {
      assert.equal(process.env.MATHEXAM_PUBLISHED_SMOKE, '1', 'published synthetic rooms require explicit opt-in');
      assert.equal(origin, 'https://mathexam.space');
      assert.equal(backend, 'https://mathexam-board-ladynata.msk1.amvera.tech');
      const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
      if (proxy) args.push('--proxy-server=' + proxy);
    } else {
      await new Promise((done, fail) => { server.once('error', fail); server.listen(0, '127.0.0.1', done); });
      origin = 'http://127.0.0.1:' + server.address().port;
      const port = await freePort();
      backend = 'http://127.0.0.1:' + port;
      const env = { ...process.env, HOST: '127.0.0.1', PORT: String(port), NODE_ENV: 'test', CORS_ALLOWED_ORIGINS: origin };
      for (const key of Object.keys(env)) if (/^(LEARNING_|PROGRESS_|GROUP_LESSON_)/.test(key)) delete env[key]; delete env.TRAINER_REGISTRY_PATH;
      child = spawn(process.execPath, ['index.js'], { cwd: join(ROOT, 'board-server'), env, stdio: ['ignore', 'ignore', 'pipe'] });
      child.stderr.on('data', chunk => { serverErrors = (serverErrors + String(chunk)).slice(-4000); });
      await waitForHealth(backend, child, () => serverErrors);
    }
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, headless: true, args, timeout: 15000 });
    const limit = published ? 420000 : 240000;
    await Promise.race([run(browser, origin, backend, [], published), new Promise((_, fail) => { watchdog = setTimeout(() => fail(new Error('Browser gate timed out at ' + phase)), limit); })]);
  } finally {
    clearTimeout(watchdog); await browser?.close(); if (child && child.exitCode === null) child.kill('SIGTERM'); if (server.listening) await new Promise(done => server.close(done));
  }
})().catch(error => { console.error('PETERSON_VOLUME_ROOM_FAILED at ' + phase + '\n' + (error.stack || error)); process.exitCode = 1; });
