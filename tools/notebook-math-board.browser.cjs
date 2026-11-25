'use strict';
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {createServer}=require('node:http');
const {createServer:netServer}=require('node:net');
const {readFileSync,statSync}=require('node:fs');
const {resolve,join,extname,sep}=require('node:path');
const {chromium}=require('playwright');
const ROOT=resolve(__dirname,'..'),KEY='mathexam.notebook-math.v1',sentinel=JSON.stringify({'fractions:0':true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const listen=s=>new Promise((r,j)=>{s.once('error',j);s.listen(0,'127.0.0.1',r);});
const close=s=>new Promise(r=>s.close(r));
const staticServer=createServer((req,res)=>{try{const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(p==='/favicon.ico'){res.writeHead(204).end();return;}let file=resolve(ROOT,'.'+p);if(!file.startsWith(ROOT+sep))throw Error('bad path');if(statSync(file).isDirectory())file=join(file,'index.html');const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};res.setHeader('Content-Type',(mime[extname(file)]||'application/octet-stream')+'; charset=utf-8');res.end(readFileSync(file));}catch(_){res.writeHead(404).end();}});
async function connected(p){await p.waitForFunction(()=>typeof shared!=='undefined'&&shared.connected&&roomStateReceived&&document.querySelector('#mirrorStatus')?.dataset.mirrorStatus==='connected',null,{timeout:20000,polling:50});}
async function waitText(locator,expected){await locator.evaluate((e,t)=>{if(!e.textContent.includes(t))throw Error('Expected '+t+' in '+e.textContent);},expected);}
(async()=>{let browser,child;const errors=[];try{
 await listen(staticServer);const site='http://127.0.0.1:'+staticServer.address().port;const temp=netServer();await listen(temp);const port=temp.address().port;await close(temp);const server='http://127.0.0.1:'+port;
 const env={...process.env,HOST:'127.0.0.1',PORT:String(port),NODE_ENV:'test',CORS_ALLOWED_ORIGINS:site};
 for(const k of Object.keys(env))if(/^(LEARNING_|PROGRESS_|GROUP_LESSON_|TRAINER_REGISTRY_PATH$)/.test(k))delete env[k];
 child=spawn(process.execPath,['index.js'],{cwd:join(ROOT,'board-server'),env,stdio:['ignore','ignore','pipe']});let stderr='';child.stderr.on('data',c=>stderr+=String(c));
 let healthy=false;for(let i=0;i<150;i++){try{healthy=(await fetch(server+'/health')).ok;if(healthy)break;}catch(_){}await sleep(100);}assert(healthy,stderr);
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const standalone=await browser.newPage({viewport:{width:390,height:844}});standalone.on('pageerror',e=>errors.push(e.message));
 await standalone.goto(site+'/trainers/notebook-math.html');
 const count=await standalone.locator('#map button[data-lesson]').count();assert.equal(count,50);
 const ids=await standalone.locator('#map button[data-lesson]').evaluateAll(es=>es.map(e=>e.dataset.lesson));
 for(const id of ids){await standalone.locator('button[data-lesson="'+id+'"]').evaluate(e=>e.click());await standalone.locator('#revealStep').click();assert.equal(await standalone.locator('#steps .step').count(),1);assert(await standalone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'overflow '+id);}
 await standalone.locator('button[data-lesson="fractions"]').evaluate(e=>e.click());await standalone.locator('#answer').fill('2/3');await standalone.locator('#check').click();await waitText(standalone.locator('#feedback'),'Верно');assert(await standalone.evaluate(k=>JSON.parse(localStorage.getItem(k))['fractions:0'],KEY));await standalone.close();
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
 for(const p of [teacher,student])assert.equal(await p.evaluate(k=>localStorage.getItem(k),KEY),sentinel);
 assert.deepEqual(errors,[]);console.log('NOTEBOOK_MATH_BOARD_BROWSER_OK');
 }finally{await browser?.close();if(child&&child.exitCode===null)child.kill('SIGTERM');if(staticServer.listening)await close(staticServer);}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
