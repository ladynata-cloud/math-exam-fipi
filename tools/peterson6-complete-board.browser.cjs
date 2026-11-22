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
async function reloadFrame(page,wrapper){
  await page.reload({waitUntil:'domcontentloaded'});
  await waitConnected(page);
  return frameFor(page,wrapper);
}
async function transferTo(teacher,student,destination){
  const expectsStudent=destination==='student';
  await Promise.all([waitConnected(teacher),waitConnected(student)]);
  await teacher.locator('#openShare').click();
  const toggle=teacher.locator('#controlToggle');
  const owner=(page,expected)=>page.waitForFunction(v=>document.body.classList.contains('control-owner')===v,expected,{polling:50});
  const read=page=>page.evaluate(()=>({connected:document.querySelector('#shareStatus')?.textContent,mirror:document.querySelector('#mirrorStatus')?.dataset.mirrorStatus,
    owner:document.body.classList.contains('control-owner'),label:document.querySelector('#controlToggle')?.textContent,control:document.querySelector('#controlBadge')?.textContent}));
  try{
    await Promise.all([owner(teacher,expectsStudent),owner(student,!expectsStudent)]);
    assert.equal((await toggle.textContent()).trim(),expectsStudent?'Передать ход':'Забрать ход');
    await toggle.click();
    await Promise.all([owner(teacher,!expectsStudent),owner(student,expectsStudent)]);
  }catch(error){
    const [teacherState,studentState]=await Promise.all([read(teacher),read(student)]);
    throw new Error('Control transfer to '+destination+': '+JSON.stringify({teacher:teacherState,student:studentState})+'; '+error.message);
  }
  await teacher.locator('#sharePanel [data-close-panel]').click();
}
async function waitConnected(page) {
  try{
    await page.waitForFunction(() => document.querySelector('#shareStatus')?.textContent === 'подключено' &&
      document.querySelector('#mirrorStatus')?.dataset.mirrorStatus === 'connected', null, { polling: 50, timeout: 15000 });
  }catch(error){
    const state=await page.evaluate(()=>({share:document.querySelector('#shareStatus')?.textContent,mirror:document.querySelector('#mirrorStatus')?.dataset.mirrorStatus,
      mirrorLabel:document.querySelector('#mirrorStatus')?.textContent,control:document.querySelector('#controlBadge')?.textContent,
      frame:document.querySelector('#trainerFrame')?.contentDocument?.querySelector('h1')?.textContent,role:document.body.className}));
    throw new Error('Room and trainer connection: '+JSON.stringify(state)+'; '+error.message);
  }
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
    await teacher.locator('#sharePanel [data-close-panel]').click();await student.goto(link,{waitUntil:'domcontentloaded'});
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
    b=await reloadFrame(student,wrapper);await same(a,b,'observer reload');
    await transferTo(teacher,student,'student');
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
      await b.locator('#number-input').fill('8');await b.locator('#number-form button').click();await b.waitForFunction(()=>document.querySelector('h1')?.textContent==='Задание №8');
      await b.locator('[data-set-number="0"]').click();await b.locator('[data-set-number="1"]').click();
      await b.locator('#answer-form button').click();const numberSet=await same(b,a,'shared number-set model and error about zero');
      assert.equal(numberSet.route,'#n/8/008-1-a');assert.match(numberSet.message.text,/Ты включил ноль/);
      assert.equal(await a.locator('[data-set-number="0"]').getAttribute('aria-pressed'),'true');
      await b.locator('[data-set-number="0"]').click();await b.locator('[data-set-number="25 004"]').click();
      await b.locator('#answer-form button').click();const listed=await same(b,a,'set correction, manual work pending');assert(!listed.work.correct&&listed.work.submitted);assert.match(listed.message.text,/все нужные элементы/);
      const panel=b.locator('.equivalent-exercise');await panel.locator('summary').first().click();await panel.getByRole('button',{name:'Другой пример'}).click();
      await panel.locator('select').selectOption({index:1});await panel.locator('form button').click();const practiced=await same(b,a,'separate author variant and selected answer');assert.equal(practiced.analogue.attempt,1);assert(practiced.analogue.work.draft);
      a=await reloadFrame(teacher,wrapper);await same(b,a,'observer reload restores the exact exercise, picks and practice attempt');
      await transferTo(teacher,student,'teacher');
      b=await reloadFrame(student,wrapper);await same(a,b,'pupil reload restores same controls');
      await a.locator('#number-input').fill('10');await a.locator('#number-form button').click();await a.waitForFunction(()=>document.querySelector('h1')?.textContent==='Задание №10');await a.locator('#answer').fill('6 702 058');await a.locator('#answer-form button').click();const dictation=await same(a,b,'grouped millions accepted in shared dictation');assert(dictation.work.correct);assert.equal(dictation.work.draft,'6 702 058');
      await a.locator('#number-input').fill('11');await a.locator('#number-form button').click();await a.waitForFunction(()=>document.querySelector('h1')?.textContent==='Задание №11');await a.locator('[data-decimal-position]').selectOption('2');
      const cells=await same(a,b,'decimal position selected by the teacher');assert.equal(cells.route,'#n/11/011-a-1');assert.equal(cells.work.decimalView,2);assert.equal(await b.locator('[data-decimal-position]').inputValue(),'2');
      const oldScene={...cells,analogue:null};delete oldScene.work.decimalView;
      await b.evaluate(scene=>{
        if(!PetersonVolumeRoom.validateState(scene))throw Error('Earlier decimal room is no longer valid');
        PetersonVolumeRoom.applyState(scene);
        if(PetersonVolumeRoom.getState().analogue!==null)throw Error('Restored original room must keep its absent practice panel');
      },oldScene);
      await a.locator('[data-decimal-position]').selectOption('1');await same(a,b,'first controller change after old snapshot');
      await transferTo(teacher,student,'student');
      await b.locator('#answer').fill('15');await b.locator('#answer-form button').click();const scaleError=await same(b,a,'pupil shifted the decimal point');assert.match(scaleError.message.text,/разряд/);assert.equal(scaleError.work.firstErrors.final,'15');
      await b.locator('#answer').fill('1,5');await b.locator('#answer-form button').click();assert((await same(b,a,'corrected decimal on both screens')).work.correct);
      const decimalPanel=b.locator('.equivalent-exercise');await decimalPanel.locator('summary').first().click();await decimalPanel.getByRole('button',{name:'Другой пример'}).click();await decimalPanel.locator('input').fill('6,04');
      const varied=await same(b,a,'independent decimal variant and its draft');assert.equal(varied.analogue.attempt,1);assert.equal(varied.analogue.work.draft,'6,04');
      a=await reloadFrame(teacher,wrapper);await same(b,a,'decimal exercise, attempt and place survive teacher reconnect');
      await transferTo(teacher,student,'teacher');
      b=await reloadFrame(student,wrapper);await same(a,b,'decimal exercise, attempt and place survive pupil reconnect');
      await a.locator('#number-input').fill('16');await a.locator('#number-form button').click();await a.waitForFunction(()=>document.querySelector('h1')?.textContent==='Задание №16');await a.locator('.part-picker a[href="#n/16/016-d"]').click();await a.waitForFunction(()=>PetersonVolumeRoom.getState().route==='#n/16/016-d'&&document.querySelector('.part-picker a[aria-current="page"],.part-picker a.active')?.getAttribute('href')==='#n/16/016-d');await a.locator('[data-fraction-method]').selectOption('3');
      const fractionView=await same(a,b,'two roles inspect missing unit fractions');assert.equal(fractionView.work.fractionView,3);assert.equal(await b.locator('[data-fraction-host] [aria-label="1 разделить на 46"]').count(),1);
      await transferTo(teacher,student,'student');
      await b.locator('#answer').selectOption('>');await b.locator('#answer-form button').click();const unitMiss=await same(b,a,'incorrect comparison near one');assert.match(unitMiss.message.text,/недобирает/);
      await b.locator('[data-fraction-method]').selectOption('2');await b.locator('#answer').selectOption('<');await b.locator('#answer-form button').click();const correctedMethod=await same(b,a,'new method and correction');assert.equal(correctedMethod.work.fractionView,2);assert(correctedMethod.work.correct);assert.equal(correctedMethod.work.firstErrors.final,'>');
      a=await reloadFrame(teacher,wrapper);await same(b,a,'teacher reload preserves fraction method and answer');
      await transferTo(teacher,student,'teacher');
      b=await reloadFrame(student,wrapper);await same(a,b,'pupil reload preserves fraction method and handoff');
      await a.locator('#number-input').fill('18');await a.locator('#number-form button').click();await a.waitForFunction(()=>document.querySelector('h1')?.textContent==='Задание №18');
      await a.locator('[data-planet-relation]').selectOption('2');await a.locator('[data-planet-zone]').selectOption('1');await a.locator('[data-planet-use]').click();await a.locator('#answer-form button').click();
      const overlapPlanet=await same(a,b,'incorrect overlap in planet diagram');assert.equal(overlapPlanet.work.planetRelation,2);assert.equal(overlapPlanet.work.earthZone,1);assert.match(overlapPlanet.message.text,/в обоих списках/);
      await transferTo(teacher,student,'student');
      await b.locator('[data-planet-relation]').selectOption('1');await b.locator('[data-planet-zone]').selectOption('3');await b.locator('[data-planet-use]').click();await b.locator('#answer-form button').click();
      const giantEarth=await same(b,a,'pupil changes Earth placement');assert.equal(giantEarth.work.earthZone,3);assert.match(giantEarth.message.text,/название начинается/);
      await b.locator('[data-planet-zone]').selectOption('1');await b.locator('[data-planet-use]').click();await b.locator('#answer-form button').click();const earthDone=await same(b,a,'drawing corrected and submitted for human review');assert.match(earthDone.message.text,/совпало/);assert(earthDone.work.submitted&&!earthDone.work.correct&&!earthDone.work.independent);
      a=await reloadFrame(teacher,wrapper);await same(b,a,'constructed areas survive teacher reload');
      await transferTo(teacher,student,'teacher');b=await reloadFrame(student,wrapper);await same(a,b,'constructed areas survive pupil reload');
      await a.locator('#number-input').fill('20');await a.locator('#number-form button').click();await a.waitForFunction(()=>document.querySelector('h1')?.textContent==='Задание №20');
      await a.locator('[data-logic-left]').selectOption('1');await a.locator('[data-logic-right]').selectOption('2');await a.locator('[data-logic-use]').click();await a.locator('#answer-form button').click();const boundaryGap=await same(a,b,'strict inequality leaves the boundary unclaimed');assert.equal(boundaryGap.work.logicRight,2);assert.match(boundaryGap.message.text,/равенства/);
      await transferTo(teacher,student,'student');
      await b.locator('[data-logic-right]').selectOption('1');await b.locator('[data-logic-use]').click();await b.locator('#answer-form button').click();const correctedPair=await same(b,a,'pupil includes the boundary and leaves the explanation for review');assert.equal(correctedPair.work.logicRight,1);assert(correctedPair.work.submitted&&!correctedPair.work.correct);assert.match(correctedPair.message.text,/Пара записей подходит/);
      a=await reloadFrame(teacher,wrapper);await same(b,a,'constructed negation remains after teacher reload');
      await transferTo(teacher,student,'teacher');b=await reloadFrame(student,wrapper);await same(a,b,'negation fields remain after pupil reload');
      await a.locator('#number-input').fill('22');await a.locator('#number-form button').click();await a.waitForFunction(()=>document.querySelector('h1')?.textContent==='Задание №22');await a.locator('.part-picker a[href$="022-slovo"]').click();await a.locator('[data-cipher-letter="Б"]').click();await a.locator('[data-cipher-use]').click();await a.locator('#answer-form button').click();
      const falseLetter=await same(a,b,'false letter in arithmetic cipher');assert.equal(falseLetter.work.cipherLetters,'Б');assert.match(falseLetter.message.text,/Для буквы Б/);
      await transferTo(teacher,student,'student');await b.locator('[data-cipher-letter="Б"]').click();
      for(const letter of 'АСТЕРОИД')await b.locator('[data-cipher-letter="'+letter+'"]').click();await b.locator('[data-cipher-use]').click();await b.locator('#answer-form button').click();const cipherDone=await same(b,a,'pupil orders the eight true rows');assert.equal(cipherDone.work.cipherLetters,'АСТЕРОИД');assert(cipherDone.work.submitted&&!cipherDone.work.correct);assert.match(cipherDone.message.text,/астрономический термин/);
      a=await reloadFrame(teacher,wrapper);await same(b,a,'cipher survives teacher reload');await transferTo(teacher,student,'teacher');b=await reloadFrame(student,wrapper);await same(a,b,'cipher survives pupil reload');
      await a.locator('#number-input').fill('25');await a.locator('#number-form button').click();await a.waitForFunction(()=>document.querySelector('h1')?.textContent==='Задание №25');
      for(const [i,letter] of [...'ЛЕТОПЁ'].entries())await a.locator('[data-puzzle-letter="'+letter+'"]').selectOption('634217'[i]);await a.locator('[data-puzzle-use]').click();await a.locator('#answer-form button').click();const badCarry=await same(a,b,'one wrong carry in sum rebus');assert.equal(badCarry.work.puzzleDigits,'634217');assert.match(badCarry.message.text,/разряде десятков/);
      await transferTo(teacher,student,'student');await b.locator('[data-puzzle-letter="Ё"]').selectOption('8');await b.locator('[data-puzzle-use]').click();await b.locator('#answer-form button').click();
      const goodCarry=await same(b,a,'pupil corrects one letter');assert.equal(goodCarry.work.puzzleDigits,'634218');assert.equal(goodCarry.work.draft,'6342 + 6342 = 12684');assert(goodCarry.work.submitted&&!goodCarry.work.correct);
      a=await reloadFrame(teacher,wrapper);await same(b,a,'letter identities survive reconnection');await transferTo(teacher,student,'teacher');b=await reloadFrame(student,wrapper);await same(a,b,'letter identities survive pupil reload');
      await a.locator('#number-input').fill('26');await a.locator('#number-form button').click();await a.waitForFunction(()=>document.querySelector('h1')?.textContent==='Задание №26');await a.locator('.part-picker a[href$="026-12"]').click();await a.waitForFunction(()=>document.querySelector('.part-picker a[aria-current="page"]')?.getAttribute('href')?.endsWith('026-12'));
      await a.locator('[data-logic-left]').selectOption('1');await a.locator('[data-logic-right]').selectOption('2');await a.locator('[data-logic-use]').click();await a.locator('#answer-form button').click();const halfNegation=await same(a,b,'one arm of inclusive disjunction was left in the negation');assert.match(halfNegation.message.text,/острый или тупой/);
      await transferTo(teacher,student,'student');
      await b.locator('[data-logic-right]').selectOption('1');await b.locator('[data-logic-other]').fill('Не все углы острые или тупые. Например, угол 90°.');await b.locator('[data-logic-use]').click();await b.locator('#answer-form button').click();const twoForms=await same(b,a,'second logical formulation travels with the selected clauses');assert.match(twoForms.work.logicOther,/90°/);assert(twoForms.work.submitted&&!twoForms.work.correct);assert.match(twoForms.message.text,/Второе отрицание сохранено/);
      a=await reloadFrame(teacher,wrapper);await same(b,a,'second wording survives teacher reload');await transferTo(teacher,student,'teacher');b=await reloadFrame(student,wrapper);await same(a,b,'second wording survives pupil reload');
      await a.locator('#number-input').fill('27');await a.locator('#number-form button').click();await a.waitForFunction(()=>document.querySelector('h1')?.textContent==='Задание №27');await a.locator('.part-picker a[href$="027-2"]').click();await a.waitForFunction(()=>document.querySelector('.part-picker a[aria-current="page"]')?.getAttribute('href')?.endsWith('027-2'));
      await a.locator('[data-logic-left]').selectOption('2');await a.locator('[data-logic-right]').selectOption('2');await a.locator('[data-logic-use]').click();await a.locator('#answer-form button').click();const beyond=await same(a,b,'invalid endpoint is not evidence');assert.match(beyond.message.text,/исключает 3/);
      await transferTo(teacher,student,'student');await b.locator('[data-logic-right]').selectOption('1');await b.locator('[data-logic-other]').fill('Число 2 — натуральное и удовлетворяет обеим границам.');await b.locator('[data-logic-use]').click();await b.locator('#answer-form button').click();
      const endpoint=await same(b,a,'pupil uses included endpoint');assert.match(endpoint.work.logicOther,/обеим границам/);assert(endpoint.work.submitted&&!endpoint.work.correct);
      a=await reloadFrame(teacher,wrapper);await same(b,a,'counterexample survives teacher reload');await transferTo(teacher,student,'teacher');b=await reloadFrame(student,wrapper);await same(a,b,'counterexample survives pupil reload');
      await a.locator('#number-input').fill('28');await a.locator('#number-form button').click();await a.waitForFunction(()=>document.querySelector('h1')?.textContent==='Задание №28');await a.locator('.part-picker a[href$="028-10"]').click();await a.waitForFunction(()=>document.querySelector('.part-picker a[aria-current="page"]')?.getAttribute('href')?.endsWith('028-10'));
      await a.locator('[data-logic-left]').selectOption('1');await a.locator('[data-logic-right]').selectOption('2');await a.locator('[data-logic-use]').click();await a.locator('#answer-form button').click();const allClocks=await same(a,b,'replacing the rule by another universal claim');assert.match(allClocks.message.text,/два обобщения/);
      await transferTo(teacher,student,'student');await b.locator('[data-logic-right]').selectOption('1');await b.locator('[data-logic-other]').fill('Я сверил часы в 12:00 — они показали точное время.');await b.locator('[data-logic-use]').click();await b.locator('#answer-form button').click();
      const oneClock=await same(b,a,'pupil limits the witness to one clock and one instant');assert.match(oneClock.work.logicOther,/12:00/);assert(oneClock.work.submitted&&!oneClock.work.correct);a=await reloadFrame(teacher,wrapper);await same(b,a,'scope after teacher reload');await transferTo(teacher,student,'teacher');b=await reloadFrame(student,wrapper);await same(a,b,'scope after pupil reload');
      await a.locator('#number-input').fill('29');await a.locator('#number-form button').click();await a.waitForFunction(()=>document.querySelector('h1')?.textContent==='Задание №29');await a.locator('.part-picker a[href$="029-6"]').click();await a.waitForFunction(()=>document.querySelector('.part-picker a[aria-current="page"]')?.getAttribute('href')?.endsWith('029-6'));await a.locator('[data-divisor-m]').selectOption('12');await a.locator('[data-divisor-n]').selectOption('15');
      const common=await same(a,b,'two selected numbers are shared');assert.equal(common.work.divisorM,12);assert.equal(common.work.divisorN,15);assert.match(await b.locator('[data-divisor-results]').textContent(),/Общие делители: 1, 3/);
      await transferTo(teacher,student,'student');await b.locator('[data-divisor-n]').selectOption('25');await b.locator('[data-logic-left]').selectOption('3');await b.locator('[data-logic-right]').selectOption('1');await b.locator('[data-logic-other]').fill('Для пары из условия общий делитель 3. Для сравнения у 12 и 25 общий делитель только 1.');await b.locator('[data-logic-use]').click();await b.locator('#answer-form button').click();
      const coprime=await same(b,a,'pupil independently varies second operand');assert.equal(coprime.work.divisorN,25);assert.match(await a.locator('[data-divisor-results]').textContent(),/Общие делители: 1\./);assert(coprime.work.submitted&&!coprime.work.correct);a=await reloadFrame(teacher,wrapper);await same(b,a,'divisibility lab survives teacher reload');await transferTo(teacher,student,'teacher');b=await reloadFrame(student,wrapper);await same(a,b,'divisibility lab survives pupil reload');
      await a.locator('#number-input').fill('30');await a.locator('#number-form button').click();await a.waitForFunction(()=>document.querySelector('h1')?.textContent==='Задание №30');await a.locator('[aria-label="Таблица значений алгоритма"] a[href$="030-1-4"]').click();await a.waitForFunction(()=>document.querySelector('.part-picker a[aria-current="page"]')?.getAttribute('href')?.endsWith('030-1-4'));await a.locator('[data-flow-value]').fill('0,3');await a.locator('[data-flow-branch]').selectOption('no');await a.locator('[data-flow-check]').click();const branchError=await same(a,b,'equality cannot use the no branch');assert.equal(branchError.work.flowBranch,'no');assert.equal(branchError.work.flowValue,'0,3');assert.match(await b.locator('[data-flow-feedback]').textContent(),/равенстве порогу/);
      await transferTo(teacher,student,'student');await b.locator('[data-flow-branch]').selectOption('yes');await b.locator('[data-flow-check]').click();await b.locator('#answer').fill('0,21');await b.locator('#answer-form button').click();const branchFixed=await same(b,a,'pupil saves output after choosing boundary branch');assert.equal(branchFixed.work.flowBranch,'yes');assert(branchFixed.work.correct&&!branchFixed.work.independent);assert.match(await a.locator('[data-flow-output="030-1-4"]').textContent(),/0,21 · проверено/);
      a=await reloadFrame(teacher,wrapper);await same(b,a,'algorithm survives teacher reload');await transferTo(teacher,student,'teacher');b=await reloadFrame(student,wrapper);await same(a,b,'algorithm survives pupil reload');
      await a.locator('#number-input').fill('32');await a.locator('#number-form button').click();await a.waitForFunction(()=>document.querySelector('h1')?.textContent==='Задание №32');for(const [i,v] of ['0,5','0,55','0,6'].entries())await a.locator('[data-sequence-x="'+i+'"]').fill(v);await a.locator('[data-sequence-den]').selectOption('100');await a.locator('[data-sequence-use]').click();await a.locator('#answer-form button').click();const tooWide=await same(a,b,'last example outside range');assert.match(tooWide.message.text,/вышло за 0,6/);
      await transferTo(teacher,student,'student');await b.locator('[data-sequence-count]').selectOption('10000');await b.locator('[data-sequence-den]').selectOption('100000');await b.locator('[data-sequence-use]').click();await b.locator('#answer-form button').click();const dense=await same(b,a,'ten thousand distinct points fit after a smaller step');assert.equal(dense.work.intervalCount,10000);assert.equal(dense.work.intervalDen,100000);assert.match(await a.locator('[data-sequence-tape]').textContent(),/0,59999/);assert(dense.work.submitted&&!dense.work.correct);a=await reloadFrame(teacher,wrapper);await same(b,a,'sequence after teacher reload');await transferTo(teacher,student,'teacher');b=await reloadFrame(student,wrapper);await same(a,b,'sequence after pupil reload');




    }
    const late=await session(browser,origin,backend,id+'-late',failures);await late.page.goto(link,{waitUntil:'domcontentloaded'});
    await waitConnected(late.page);const c=await frameFor(late.page,wrapper);await same(b,c,'late participant receives open work');
    a=await reloadFrame(teacher,wrapper);await same(b,a,'teacher reload');
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
