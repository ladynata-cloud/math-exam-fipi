'use strict';
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {createServer}=require('node:http');
const {createServer:netServer}=require('node:net');
const {readFileSync,statSync}=require('node:fs');
const {resolve,join,extname,sep}=require('node:path');
const {chromium}=require('playwright');
const solutions=require('./notebook-math-answers.cjs');
const ROOT=resolve(__dirname,'..'),KEY='mathexam.notebook-math.v1',sentinel=JSON.stringify({'fractions:0':true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const listen=s=>new Promise((r,j)=>{s.once('error',j);s.listen(0,'127.0.0.1',r);});
const close=s=>new Promise(r=>s.close(r));
const staticServer=createServer((req,res)=>{try{const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(p==='/favicon.ico'){res.writeHead(204).end();return;}let file=resolve(ROOT,'.'+p);if(file!==ROOT&&!file.startsWith(ROOT+sep))throw Error('bad path');if(statSync(file).isDirectory())file=join(file,'index.html');const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};res.setHeader('Content-Type',(mime[extname(file)]||'application/octet-stream')+'; charset=utf-8');res.end(readFileSync(file));}catch(_){res.writeHead(404).end();}});
async function connected(p){await p.waitForFunction(()=>typeof shared!=='undefined'&&shared.connected&&roomStateReceived&&document.querySelector('#mirrorStatus')?.dataset.mirrorStatus==='connected',null,{timeout:20000,polling:50});}
async function waitText(locator,expected){await locator.evaluate((e,t)=>{if(!e.textContent.includes(t))throw Error('Expected '+t+' in '+e.textContent);},expected);}
(async()=>{let browser,child;const errors=[];try{
 await listen(staticServer);const site='http://127.0.0.1:'+staticServer.address().port;const temp=netServer();await listen(temp);const port=temp.address().port;await close(temp);const server='http://127.0.0.1:'+port;
 const env={...process.env,HOST:'127.0.0.1',PORT:String(port),NODE_ENV:'test',CORS_ALLOWED_ORIGINS:site};
 for(const k of Object.keys(env))if(/^(LEARNING_|PROGRESS_|GROUP_LESSON_|TRAINER_REGISTRY_PATH$)/.test(k))delete env[k];
 child=spawn(process.execPath,['index.js'],{cwd:join(ROOT,'board-server'),env,stdio:['ignore','ignore','pipe']});let stderr='';child.stderr.on('data',c=>stderr+=String(c));
 let healthy=false;for(let i=0;i<150;i++){try{healthy=(await fetch(server+'/health')).ok;if(healthy)break;}catch(_){}await sleep(100);}assert(healthy,stderr);
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const standalone=await browser.newPage({viewport:{width:320,height:740},isMobile:true,hasTouch:true});
 standalone.on('pageerror',e=>errors.push(e.message));
 await standalone.goto(site+'/trainers/notebook-math.html');
 const home=standalone.getByRole('link',{name:'На главную MathExam'});
 assert.equal(await home.getAttribute('href'),'/');
 const cards=standalone.locator('#map button[data-lesson]');
 assert.equal(await cards.count(),50);
 const ids=await cards.evaluateAll(es=>es.map(e=>e.dataset.lesson));
 await standalone.locator('#mapToggle').tap();
 await standalone.locator('button[data-lesson="fractions"]').tap();
 assert.equal(await standalone.locator('#mapToggle').getAttribute('aria-expanded'),'false');
 const modelCases={
  intervals:['button','Интервал 1: ?',null,'Интервал 1: +'],
  'rational-ineq':['button','Интервал 2: ?',null,'Интервал 2: +'],
  setops:['button','Общая часть',null,'Верная область'],
  'set-intervals':['combobox','Операция','2','A∖B = [4;5]'],
  'prob-count':['combobox','Сумма очков','12','1/36'],
  gauss:['button','Следующий шаг',null,'R₂←R₂−2R₁'],
  det2:['spinbutton','Элемент a','3','= 27'],
  det3:['button','Следующий шаг',null,'+4'],
  functions:['combobox','Функция','5','y = |x|'],
  parabola:['slider','m','ArrowRight','Вершина (3; -3)'],
  hyperbola:['slider','m','ArrowLeft','Центр (1; 3)'],
  'trig-circle':['slider','Угол, °','ArrowRight','75°'],
  triangles:['slider','Угол B, °','ArrowRight','23°'],
  similarity:['slider','BK/BA (десятые)','ArrowRight','KM=10'],
  positions:['slider','Поворот куба','ArrowRight','-30'],
  sections:['combobox','Плоскость','2','6 сторон'],
  projection:['slider','AO — перпендикуляр','ArrowRight','250']
 };
 let solved=0;
 for(const [index,id] of ids.entries()){
  assert.equal(await standalone.locator('[aria-current="step"]').getAttribute('data-lesson'),id);
  await standalone.locator('#revealStep').tap();
  assert.equal(await standalone.locator('#steps .step').count(),1);
  const model=standalone.locator('#model');
  if(modelCases[id]){
   const [role,name,input,result]=modelCases[id],ctrl=model.getByRole(role,{name,exact:true});
   if(role==='button')await ctrl.tap();
   if(role==='combobox')await ctrl.selectOption(input);
   if(role==='slider')await ctrl.press(input);
   if(role==='spinbutton'){await ctrl.fill(input);await ctrl.press('Tab');}
   if(id==='setops')await model.getByRole('button',{name:'Проверить закраску'}).tap();
   if(id==='prob-count'){
    await model.getByRole('button',{name:'Первый кубик 6, второй 6'}).tap();
    await model.getByRole('button',{name:'Проверить исходы'}).tap();
   }
   if(id==='functions'){
    assert.equal(await ctrl.inputValue(),'5');
    assert((await model.locator('path').last().getAttribute('d')).includes('230.00 145.00'));
   }
   await waitText(model,result);
  }
  if(id==='sections'){
   const zoom=standalone.locator('#modelZoom'),view=model.locator('.model-view');
   await zoom.tap();
   assert(await view.evaluate(e=>e.scrollWidth>=580&&e.clientWidth<320&&e.scrollLeft>0));
   assert(await view.evaluate(e=>e===document.activeElement));
   await view.evaluate(e=>e.scrollTo(e.scrollWidth,0));
   await zoom.tap();
   assert.equal(await view.evaluate(e=>e.scrollLeft),0);
  }
  const clipped=await standalone.evaluate(()=>[...document.querySelectorAll('#model input,#model select,#model button')].some(e=>{
   const box=e.getBoundingClientRect();return box.width>0&&(box.left<0||box.right>innerWidth+1);
  })||document.documentElement.scrollWidth>innerWidth+1);
  assert(!clipped,'mobile overflow '+id);
  await standalone.locator('#practice').tap();
  for(const [i,answer] of solutions[id].entries()){
   if(i)await standalone.locator('#newTask').tap();
   if(await standalone.locator('#answer').isVisible())await standalone.locator('#answer').fill(answer);
   else await standalone.locator('#choices').getByRole('button',{name:answer,exact:true}).tap();
   await standalone.locator('#check').tap();
   await waitText(standalone.locator('#feedback'),'Верно!');
   solved++;
  }
  if(index<ids.length-1)await standalone.locator('#next').tap();
 }
 assert.equal(solved,142);
 await standalone.reload();
 assert.equal(await standalone.evaluate(k=>Object.values(JSON.parse(localStorage.getItem(k))).filter(v=>v===true).length,KEY),142);
 await standalone.setViewportSize({width:740,height:320});
 await standalone.locator('#mapOpen').tap();
 await standalone.locator('#map summary').last().tap();
 await standalone.locator('button[data-lesson="three-perp"]').tap();
 assert.equal(await standalone.locator('[aria-current="step"]').getAttribute('data-lesson'),'three-perp');
 await Promise.all([standalone.waitForURL(site+'/',{waitUntil:'commit'}),home.tap()]);
 await standalone.close();
 async function context(){const c=await browser.newContext({viewport:{width:1440,height:1000}});await c.addInitScript(({key,value,site})=>{if(location.origin===site&&!localStorage.getItem(key))localStorage.setItem(key,value);},{key:KEY,value:sentinel,site});const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));return p;}
 const teacher=await context(),student=await context();
 const url=site+'/trainers/trainer-board.html?server='+encodeURIComponent(server)+'&trainer='+encodeURIComponent('/trainers/notebook-math.html');
 await teacher.goto(url);await teacher.locator('#openShare').click();await teacher.locator('#createRoom').click();
 await teacher.waitForFunction(()=>document.querySelector('#studentLink')?.value.includes('role=student')&&document.querySelector('#shareStatus')?.textContent==='подключено',null,{timeout:20000});
 const invite=await teacher.locator('#studentLink').inputValue();await teacher.locator('#sharePanel [data-close-panel]').click();await student.goto(invite);
 await Promise.all([connected(teacher),connected(student)]);
 assert(await teacher.locator('#trainerQuick option').evaluateAll(es=>es.some(e=>e.value.includes('notebook-math.html'))));
 const t=teacher.frameLocator('#trainerFrame'),s=student.frameLocator('#trainerFrame');
 const text=async(frame,selector,expected)=>{await frame.locator(selector).waitFor();for(let i=0;i<100;i++){if((await frame.locator(selector).textContent()).includes(expected))return;await sleep(50);}throw Error('Missing '+expected+' at '+selector);};
 await text(s,'#lessonTitle','Дроби');
 await t.locator('button[data-lesson="parabola"]').evaluate(e=>e.click());await text(s,'#lessonTitle','Преобразования параболы');
 await t.locator('#revealStep').click();await text(s,'#steps','Шаг 1');
 await t.locator('#model input[type=range]').first().evaluate(e=>{e.value='4';e.dispatchEvent(new Event('input',{bubbles:true}));});
 await text(s,'#model','Вершина (4; -3)');
 await t.locator('#answer').fill('3;1');await t.locator('#check').click();await text(s,'#feedback','Верно');
 assert.equal(await s.locator('#answer').inputValue(),'3;1');
 await student.reload();await connected(student);await text(s,'#feedback','Верно');await text(s,'#model','Вершина (4; -3)');
 await t.locator('button[data-lesson="sections"]').evaluate(e=>e.click());await text(s,'#lessonTitle','Построение сечений');
 await t.locator('#model select').first().selectOption('2');await text(s,'#model','6 сторон');
 assert.equal(await s.getByRole('link',{name:'На главную MathExam'}).count(),0);
 async function writer(page,writable){
  await page.waitForFunction(w=>document.querySelector('#trainerFrame').inert===!w,writable);
 }
 await teacher.locator('#boardControlToggle').click();
 await Promise.all([writer(teacher,false),writer(student,true)]);
 await s.locator('#model select').first().selectOption('0');
 await text(t,'#model','3 стороны');
 await s.locator('#newTask').click();
 await text(t,'#question','Максимальное число сторон');
 await s.locator('#answer').fill('5');await s.locator('#check').click();
 await text(t,'#feedback','Пока неверно');
 await s.locator('#answer').fill('6');await s.locator('#check').click();
 await text(t,'#feedback','Верно!');
 assert.equal(await t.locator('#answer').inputValue(),'6');
 await student.locator('#releaseControl').click();
 await Promise.all([writer(teacher,true),writer(student,false)]);
 await t.locator('#model select').first().selectOption('1');await text(s,'#model','4 стороны');
 await student.reload();await connected(student);
 await text(s,'#feedback','Верно!');await text(s,'#model','4 стороны');
 for(const p of [teacher,student])assert.equal(await p.evaluate(k=>localStorage.getItem(k),KEY),sentinel);
 assert.deepEqual(errors,[]);console.log('NOTEBOOK_MATH_BOARD_BROWSER_OK');
 }finally{await browser?.close();if(child&&child.exitCode===null)child.kill('SIGTERM');if(staticServer.listening)await close(staticServer);}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
