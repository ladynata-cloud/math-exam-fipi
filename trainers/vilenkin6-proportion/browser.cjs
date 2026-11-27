'use strict';
// Real shared board + real local backend, independent teacher/pupil browsers.
// All 32 tasks and 82 steps are covered by the pure math test; this tests
// the actual bridge, UI, transport, ownership, retention and four entrances.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),net=require('node:net'),{spawn}=require('node:child_process'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'../..'), FILE='/trainers/vilenkin6-proportion/index.html';
const units=require('../../courses/vilenkin-6-part-1/textbook-data/units-D.json').filter(u=>[18,19,20,21].includes(u.id));
let browser,child;const errors=[];
const site=http.createServer((req,res)=>{try{
  const u=new URL(req.url,'http://localhost');let file=path.resolve(ROOT,'.'+decodeURIComponent(u.pathname));
  if(!file.startsWith(ROOT+path.sep))throw Error('outside root');
  if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
}catch(_){res.writeHead(404).end();}});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function frame(page){
  await page.waitForFunction(()=>document.querySelector('#mirrorStatus')?.dataset.mirrorStatus==='connected',null,{timeout:30000});
  const f=page.frames().find(x=>{try{return new URL(x.url()).pathname===FILE;}catch(_){return false;}});
  assert(f,'registered proportion frame exists');
  await f.waitForFunction(()=>typeof getBoardTrainerState==='function');return f;
}
const state=f=>f.evaluate(()=>getBoardTrainerState());
const visible=f=>f.evaluate(()=>({task:document.querySelector('#task').value,condition:document.querySelector('#condition').textContent,history:document.querySelector('#history').innerHTML,answer:document.querySelector('#answer').value,notes:document.querySelector('#notes').value,hint:document.querySelector('#hint-text').hidden?'':document.querySelector('#hint-text').textContent,feedback:document.querySelector('#feedback').textContent,rules:document.querySelector('#rules').open}));
async function same(a,b){
  const expected=await state(a);
  await b.waitForFunction(v=>JSON.stringify(getBoardTrainerState())===JSON.stringify(v),expected,{timeout:20000});
  assert.deepEqual(await visible(a),await visible(b),'same visible work, not only same snapshot');
}
async function action(a,b,run){
  const before=JSON.stringify(await state(a));await run();
  await a.waitForFunction(v=>JSON.stringify(getBoardTrainerState())!==v,before);
  await same(a,b);
}
const privateStorage=f=>f.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([key])=>/vilenkin|learning|cabinet/.test(key))));
const strokes=p=>p.evaluate(()=>publicSnapshot().pages[0].strokes.map(({createdAt,...v})=>v));
(async()=>{try{
  await new Promise(r=>site.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+site.address().port;
  const probe=net.createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
  const env={...process.env,HOST:'127.0.0.1',PORT:String(port)};
  delete env.TRAINER_REGISTRY_PATH;delete env.PROGRESS_STORE_PATH;delete env.PROGRESS_PERSISTENCE_CONFIRMED;delete env.BOARD_ROOM_STORE_DIR;
  child=spawn(process.execPath,['index.js'],{cwd:path.join(ROOT,'board-server'),env,stdio:['ignore','ignore','pipe']});child.stderr.on('data',()=>{});
  const backend='http://127.0.0.1:'+port;
  let ready=false;for(let i=0;i<150;i++){try{if((await fetch(backend+'/health')).ok){ready=true;break;}}catch(_){}await pause(50);}assert(ready,'backend starts');
  const registry=await(await fetch(backend+'/api/trainer-registry')).json();
  assert.deepEqual(registry.trainers.find(x=>x.trainerId==='vilenkin6-proportion'),{trainerId:'vilenkin6-proportion',file:FILE.slice(1),version:'1.0.0',stateSchemaVersion:1,bridgeProtocolVersion:1,allowLegacyHtml:false});
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
  const tc=await browser.newContext({viewport:{width:1280,height:900}}),sc=await browser.newContext({viewport:{width:1280,height:900}});
  const teacher=await tc.newPage(),student=await sc.newPage();
  for(const p of [teacher,student]){p.setDefaultTimeout(20000);p.on('pageerror',e=>errors.push(e.message));}
  const start=units[1].tasks[0].id;
  await teacher.goto(origin+'/trainers/trainer-board.html?server='+encodeURIComponent(backend)+'&trainer='+encodeURIComponent(FILE+'?task='+encodeURIComponent(start)));
  await teacher.locator('#openShare').click();await teacher.locator('#createRoom').click();
  await teacher.waitForFunction(()=>document.querySelector('#studentLink').value.includes('room='));
  const invitation=await teacher.locator('#studentLink').inputValue();await teacher.keyboard.press('Escape');await student.goto(invitation);
  let a=await frame(teacher),b=await frame(student);await same(a,b);assert.equal((await state(a)).taskId,start);
  assert.equal(await student.evaluate(()=>canWrite()),false);
  const beforeTeacher=await privateStorage(a),beforeStudent=await privateStorage(b);
  const first=units[0].tasks[0].id;
  await action(a,b,()=>a.locator('#task').selectOption(first));
  await action(a,b,()=>a.locator('#answer').fill('1'));await action(a,b,()=>a.locator('#check').click());
  assert.equal((await state(b)).works[first].feedback,'wrong');
  await action(a,b,()=>a.locator('#hint').click());assert.equal(await b.locator('#hint-text').isVisible(),true);
  await action(a,b,()=>a.locator('#notes').fill('Отношение сравниваем в одинаковых единицах.'));
  await action(a,b,()=>a.locator('#rules > summary').click());
  const examples=[
    [first,['45','5/9']],
    [start,['224','224','Да']],
    [units[2].tasks[1].id,['Обратная','54','6']],
    [units[3].tasks[0].id,['100000','650000','6,5']]
  ];
  for(const [id,answers] of examples){
    if((await state(a)).taskId!==id)await action(a,b,()=>a.locator('#task').selectOption(id));
    for(const answer of answers){await action(a,b,()=>a.locator('#answer').fill(answer));await action(a,b,()=>a.locator('#check').click());}
    assert.equal((await state(b)).works[id].complete,true,id);
    assert.equal(await b.locator('#history li').count(),answers.length,id);
  }
  assert.match((await state(b)).works[first].notes,/одинаковых единицах/);
  await teacher.locator('#boardControlToggle').click();
  // The two clients receive the authoritative control event independently.
  // Wait for both, rather than sampling the teacher at the pupil's arrival.
  await Promise.all([student.waitForFunction(()=>canWrite()),teacher.waitForFunction(()=>!canWrite())]);
  assert.equal(await teacher.evaluate(()=>canWrite()),false);
  const next=units[1].tasks[1].id;
  await action(b,a,()=>b.locator('#task').selectOption(next));
  await action(b,a,()=>b.locator('#independent').click());
  await action(b,a,()=>b.locator('#answer').fill('7'));await action(b,a,()=>b.locator('#check').click());
  await action(b,a,()=>b.locator('#notes').fill('Крест-накрест.'));
  assert.equal((await state(a)).works[next].complete,true);
  const canvas=student.locator('#canvas');await canvas.scrollIntoViewIfNeeded();const box=await canvas.boundingBox();assert(box);
  await student.mouse.move(box.x+70,box.y+80);await student.mouse.down();await student.mouse.move(box.x+190,box.y+120,{steps:8});await student.mouse.up();
  await teacher.waitForFunction(()=>publicSnapshot().pages[0].strokes.length>0);
  assert.deepEqual(await strokes(teacher),await strokes(student));
  // The pupil still holds the pen. The authored warm-up uses the same registered
  // mirror as the textbook and keeps earlier work when the selected task changes.
  const workshop=require('./corridor.js');
  for(const task of workshop.tasks){
    await action(b,a,()=>b.locator('#task').selectOption(task.id));
    const transfer=task.role==='transfer';
    assert.equal(await a.locator('#corridor-model').isVisible(),!transfer);
    if(task.id==='ratio-division-start'){
      await action(b,a,()=>b.locator('#answer').fill('9999'));
      await action(b,a,()=>b.locator('#check').click());
      assert.equal((await state(a)).works[task.id].feedback,'wrong');
    }
    const keys=transfer?[task.answer]:task.steps.map(step=>step.answer);
    for(const key of keys){
      const value=Array.isArray(key)?key[0]:key;
      await action(b,a,()=>b.locator('#answer').fill(value));
      await action(b,a,()=>b.locator('#check').click());
      assert.equal((await state(a)).works[task.id].feedback,'correct');
      assert.equal(await a.locator('#corridor-model').innerHTML(),await b.locator('#corridor-model').innerHTML());
    }
    assert.equal((await state(a)).works[task.id].complete,true);
  }
  assert.equal((await state(a)).works[first].complete,true);
  const beforeReload=await state(a);await student.reload();b=await frame(student);await same(a,b);
  assert.deepEqual(await state(b),beforeReload);assert.deepEqual(await strokes(teacher),await strokes(student));
  assert.deepEqual(await privateStorage(a),beforeTeacher);assert.deepEqual(await privateStorage(b),beforeStudent);
  await teacher.reload();a=await frame(teacher);await same(b,a);
  assert.deepEqual(await state(a),beforeReload);assert.deepEqual(await strokes(teacher),await strokes(student));
  // Exercise canonical section routes and standalone layouts separately from room.
  const mobile=await tc.newPage();mobile.on('pageerror',e=>errors.push(e.message));
  for(const [i,width] of [320,390,768,1280].entries()){
    await mobile.setViewportSize({width,height:900});await mobile.goto(origin+FILE+'?unit='+units[i].id);
    await mobile.locator('#workspace').waitFor({state:'visible'});
    assert.equal((await state(mobile)).taskId,units[i].tasks[0].id);
    assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no outer horizontal overflow at '+width);
    const condition=await mobile.locator('#condition').boundingBox();assert(condition&&condition.y+condition.height<900);
    if(process.env.PROPORTION_SCREENSHOT_DIR){fs.mkdirSync(process.env.PROPORTION_SCREENSHOT_DIR,{recursive:true});await mobile.screenshot({path:path.join(process.env.PROPORTION_SCREENSHOT_DIR,'unit-'+units[i].id+'-'+width+'.png')});}
  }
  assert.deepEqual(errors,[]);
  console.log('VILENKIN6_PROPORTION_BOARD_OK: four sections, 10 guided steps, independent pupil answer, hints, notes, rules, real control, five workshop cards, ink, both reloads, no personal progress writes and four viewport widths');
}finally{if(browser)await browser.close();if(child)child.kill();await new Promise(r=>site.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});
