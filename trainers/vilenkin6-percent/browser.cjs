'use strict';
// Full production board host and SDK, two isolated Chromium contexts, real local
// Socket.IO service. Native UI events; no state injection or production pupils.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),net=require('node:net'),{spawn}=require('node:child_process'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'../..'),D=require('../../courses/vilenkin-6-part-1/textbook-data/units-A.json').find(u=>u.id===2);
let browser,child;const errors=[];
const site=http.createServer((req,res)=>{try{const u=new URL(req.url,'http://localhost');let file=path.resolve(ROOT,'.'+decodeURIComponent(u.pathname));if(!file.startsWith(ROOT+path.sep))throw Error();if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch(_){res.writeHead(404).end();}});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function frame(page){await page.waitForFunction(()=>document.querySelector('#mirrorStatus')?.dataset.mirrorStatus==='connected');const f=page.frames().find(x=>x.url().includes('/vilenkin6-percent/'));assert(f);await f.waitForFunction(()=>typeof getBoardTrainerState==='function');return f;}
const state=f=>f.evaluate(()=>getBoardTrainerState());
async function same(a,b){const expected=await state(a);await b.waitForFunction(v=>JSON.stringify(getBoardTrainerState())===JSON.stringify(v),expected);const visible=f=>f.evaluate(()=>({condition:document.querySelector('#condition').textContent,history:document.querySelector('#history').innerHTML,answer:document.querySelector('#answer').value,notes:document.querySelector('#notes').value,hint:document.querySelector('#hint-text').hidden?'':document.querySelector('#hint-text').textContent,feedback:document.querySelector('#feedback').textContent,rules:document.querySelector('#rules').open}));assert.deepEqual(await visible(a),await visible(b));}
async function action(a,b,run){const before=JSON.stringify(await state(a));await run();await a.waitForFunction(v=>JSON.stringify(getBoardTrainerState())!==v,before);await same(a,b);}
(async()=>{try{
 await new Promise(r=>site.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+site.address().port;
 const probe=net.createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
 const env={...process.env,HOST:'127.0.0.1',PORT:String(port)};delete env.TRAINER_REGISTRY_PATH;delete env.PROGRESS_STORE_PATH;delete env.PROGRESS_PERSISTENCE_CONFIRMED;
 child=spawn(process.execPath,['index.js'],{cwd:path.join(ROOT,'board-server'),env,stdio:['ignore','ignore','pipe']});child.stderr.on('data',()=>{});const backend='http://127.0.0.1:'+port;
 let ready=false;for(let i=0;i<150;i++){try{if((await fetch(backend+'/health')).ok){ready=true;break;}}catch(_){}await pause(50);}assert(ready,'backend starts');
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 const teacherContext=await browser.newContext({viewport:{width:1280,height:900}}),studentContext=await browser.newContext({viewport:{width:1280,height:900}});
 const teacher=await teacherContext.newPage(),student=await studentContext.newPage();for(const p of [teacher,student]){p.setDefaultTimeout(20000);p.on('pageerror',e=>errors.push(e.message));}
 await teacher.goto(origin+'/trainers/trainer-board.html?server='+encodeURIComponent(backend)+'&trainer='+encodeURIComponent('/trainers/vilenkin6-percent/index.html?task='+D.tasks[3].id));
 await teacher.locator('#openShare').click();await teacher.locator('#createRoom').click();await teacher.waitForFunction(()=>document.querySelector('#studentLink').value.includes('room='));const studentURL=await teacher.locator('#studentLink').inputValue();await teacher.keyboard.press('Escape');await student.goto(studentURL);
 let a=await frame(teacher),b=await frame(student);await same(a,b);assert.equal((await state(a)).taskId,D.tasks[3].id);
 const storage=f=>f.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([key])=>/vilenkin|learning|cabinet/.test(key))));const beforeStorage=await storage(a);
 await action(a,b,()=>a.locator('#task').selectOption(D.tasks[0].id));
 await action(a,b,()=>a.locator('#answer').fill('1'));await action(a,b,()=>a.locator('#check').click());assert(await a.locator('#hint').isHidden());
 await action(a,b,()=>a.locator('#check').click());assert(await b.locator('#hint').isVisible());await action(a,b,()=>a.locator('#hint').click());
 await action(a,b,()=>a.locator('#notes').fill('37 % = 37/100'));await action(a,b,()=>a.locator('#rules > summary').click());
 const expected=[['37/100','0,37'],['3,4','85'],['0,75','75'],['4','400'],['0,2','20'],['40','4,5','180'],['5','500'],['6','0,02','2']];
 for(let i=0;i<D.tasks.length;i++){
  if(i)await action(a,b,()=>a.locator('#task').selectOption(D.tasks[i].id));assert.equal(await b.locator('#condition').innerHTML(),await b.evaluate(prompt=>TextbookMath.fmt(prompt),D.tasks[i].prompt));
  if(D.tasks[i].role!=='learn')await action(a,b,()=>a.locator('#guided').click());
  for(const answer of expected[i]){await action(a,b,()=>a.locator('#answer').fill(answer));await action(a,b,()=>a.locator('#check').click());}
  assert.equal((await state(b)).works[D.tasks[i].id].complete,true);assert.equal(await b.locator('#history li').count(),expected[i].length);
 }
 await teacher.locator('#boardControlToggle').click();await student.waitForFunction(()=>canWrite());
 await action(b,a,()=>b.locator('#task').selectOption(D.tasks[3].id));await action(b,a,()=>b.locator('#repeat').click());
 await action(b,a,()=>b.locator('#answer').fill('400'));await action(b,a,()=>b.locator('#check').click());await action(b,a,()=>b.locator('#notes').fill('2 % — 8 человек; 100 % — 400 человек'));
 const canvas=student.locator('#canvas');await canvas.scrollIntoViewIfNeeded();const box=await canvas.boundingBox();await student.mouse.move(box.x+70,box.y+80);await student.mouse.down();await student.mouse.move(box.x+190,box.y+120,{steps:8});await student.mouse.up();await teacher.waitForFunction(()=>publicSnapshot().pages[0].strokes.length>0);
 const strokes=p=>p.evaluate(()=>publicSnapshot().pages[0].strokes.map(({createdAt,...v})=>v));assert.deepEqual(await strokes(teacher),await strokes(student));
 await student.reload();b=await frame(student);await same(a,b);assert.deepEqual(await strokes(teacher),await strokes(student));assert.deepEqual(await storage(a),beforeStorage);
 const mobile=await teacherContext.newPage();mobile.on('pageerror',e=>errors.push(e.message));
 for(const width of [320,390,1280]){
  await mobile.setViewportSize({width,height:900});await mobile.goto(origin+'/trainers/vilenkin6-percent/index.html?task='+D.tasks[4].id);await mobile.locator('#workspace').waitFor({state:'visible'});
  assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const condition=await mobile.locator('#condition').boundingBox();assert(condition.y+condition.height<900);
  if(process.env.PERCENT_SCREENSHOT_DIR){fs.mkdirSync(process.env.PERCENT_SCREENSHOT_DIR,{recursive:true});await mobile.screenshot({path:path.join(process.env.PERCENT_SCREENSHOT_DIR,'percent-'+width+'.png')});}
 }
 assert.deepEqual(errors,[]);console.log('VILENKIN6_PERCENT_BOARD_OK: 8 exact source tasks, 18 steps, real paired Socket.IO boards, hints, notes, rules, reverse control, ink, reload, no personal progress writes, 320/390/1280 layout');
}finally{if(browser)await browser.close();if(child)child.kill();await new Promise(r=>site.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});
