'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const C=require('../board-server/learning-remediation-contracts');
const serverContracts=require('../board-server/learning-contracts');
const root=path.resolve(__dirname,'..');
const harness=`<!doctype html><meta charset="utf-8"><title>Semantic remediation test</title><style>body{margin:0}iframe{width:49vw;height:95vh;border:0}</style><script>
window.framesById={};window.events=[];
window.addEventListener('message',e=>{let m=e.data;if(m?.protocol!=='mathexam-learning')return;const f=Object.values(framesById).find(x=>x.frame.contentWindow===e.source&&x.channel===m.channel);if(!f)return;f.instance=m.instance;if(m.type==='ready')f.ready=true;if(m.type==='applied')f.applied=m.payload;if(m.type==='change'){f.state=m.payload.state;events.push(m.payload);}});
window.openTrainer=(id,url)=>{let frame=document.createElement('iframe');frame.sandbox='allow-scripts';let channel=id+'ABCDEFGHIJKLMNOPQRSTUV';frame.src=url+'?learning=1&parentOrigin='+encodeURIComponent(location.origin)+'&channel='+channel;framesById[id]={frame,channel};document.body.append(frame);};
window.hydrate=(id,taskSpec,state,readOnly)=>{const f=framesById[id];f.applied=null;f.frame.contentWindow.postMessage({protocol:'mathexam-learning',version:1,channel:f.channel,instance:f.instance,type:'hydrate',payload:{taskSpec,state,readOnly}},'*');};
</script>`;
const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;if(pathname==='/harness'){res.setHeader('Content-Type','text/html');return res.end(harness);}const file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(data);});});
function expected(q){return q.answer&&typeof q.answer==='object'?q.answer.n+'/'+q.answer.d:String(q.answer);}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:1440,height:950}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 let completed=0,actions=0;
 for(const item of process.argv.includes('--visual-only')?[]:C.list()){
  await page.goto(origin+'/harness');const {taskSpec,state}=serverContracts.create('oge-basics',item.contentId,12345);
  for(const id of ['student','teacher'])await page.evaluate(({id,url})=>openTrainer(id,url),{id,url:item.url});
  await page.waitForFunction(()=>framesById.student?.ready&&framesById.teacher?.ready);
  await page.evaluate(({taskSpec,state})=>{hydrate('student',taskSpec,state,false);hydrate('teacher',taskSpec,state,true);},{taskSpec,state});
  await page.waitForFunction(()=>framesById.student.applied&&framesById.teacher.applied);
  assert.equal(await page.evaluate(()=>framesById.student.applied.error),undefined,item.id);
  let frame=page.frames().find(f=>f.url().includes('channel=student'));const teacher=page.frames().find(f=>f.url().includes('channel=teacher'));
  assert.equal(await frame.locator('#learning-remediation-root h1').textContent(),taskSpec.title);
  assert.equal(await teacher.locator('#lm-note').getAttribute('readonly'),'');
  assert.equal(await frame.evaluate(()=>{try{localStorage.setItem('unexpected-write','1');return 'accessible';}catch{return 'isolated';}}),'isolated');
  const first=taskSpec.steps[0]||taskSpec.items[0]||taskSpec.task;
  if(first.kind==='choice')await frame.locator('[data-choice]').evaluateAll((nodes,answer)=>nodes.find(x=>x.dataset.choice!==answer).click(),String(first.answer));else await frame.locator('#lm-answer').fill('99999999');
  await frame.locator('#lm-note').fill('Мой черновик: '+item.contentId);
  await frame.locator('#lm-check').click();await frame.locator('#lm-hint').click();
  await page.waitForFunction(()=>events.at(-1)?.kind==='hint');
  const saved=await page.evaluate(()=>framesById.student.state);C.normalize(taskSpec,saved);
  await page.evaluate(({taskSpec,saved})=>hydrate('teacher',taskSpec,saved,true),{taskSpec,saved});
  await page.waitForFunction(()=>framesById.teacher.applied);
  assert.equal(await teacher.locator('#lm-note').inputValue(),saved.note);
  assert.equal(await teacher.locator('.lm-feedback.hint').count(),1);
  if(taskSpec.lessons.length){await frame.locator('#lm-learn').click();assert.equal(await frame.locator('.lm-lesson').count(),1);await frame.locator('#lm-practice').click();}
  // Restore into a fresh instance, including raw draft, hint and selected view.
  await page.evaluate(({taskSpec,saved})=>hydrate('student',taskSpec,saved,false),{taskSpec,saved});
  await page.waitForFunction(()=>framesById.student.applied);
  let current=saved;
  while(!current.completed){const q=taskSpec.steps[current.step]||taskSpec.items[current.step]||taskSpec.task,answer=expected(q);
   if(q.kind==='choice')await frame.locator('[data-choice]').filter({hasText:''}).evaluateAll((nodes,answer)=>nodes.find(x=>x.dataset.choice===answer).click(),answer);
   else await frame.locator('#lm-answer').fill(answer);
   const n=await page.evaluate(()=>events.length);await frame.locator('#lm-check').click();
   try{await page.waitForFunction(n=>events.length>n&&events.at(-1).kind==='check',n,{timeout:5000});}catch(error){console.error(item.contentId,current.step,JSON.stringify(await page.evaluate(()=>({events:events.slice(-3),applied:framesById.student.applied}))),errors,await frame.locator('#learning-remediation-root').innerText());throw error;}
   const event=await page.evaluate(()=>events.at(-1));const verified=C.evaluate(taskSpec,event.details);assert(verified.correct,item.id+' step '+current.step);current=C.normalize(taskSpec,event.state);actions++;
   const restoreAt=taskSpec.items.length?5:taskSpec.divisionTasks.length?taskSpec.divisionTasks[1].startIndex+2:-1;
   if(current.step===restoreAt){
    await frame.locator('#lm-answer').fill('99999999');await frame.locator('#lm-check').click();await page.waitForFunction(()=>events.at(-1)?.kind==='check'&&events.at(-1).details.answer==='99999999');
    const wrong=await page.evaluate(()=>events.at(-1));assert.deepEqual(C.evaluate(taskSpec,wrong.details),{correct:false,complete:false});current=C.normalize(taskSpec,wrong.state);assert.equal(current.step,restoreAt);
    await page.evaluate(({taskSpec,current})=>hydrate('teacher',taskSpec,current,true),{taskSpec,current});await page.waitForFunction(()=>framesById.teacher.applied);
    assert.equal(await teacher.locator('#lm-answer').inputValue(),'99999999');assert.equal(await teacher.locator('.lm-feedback.incorrect').count(),1);
    await page.evaluate(url=>{framesById.student.frame.remove();delete framesById.student;openTrainer('student',url);},item.url);await page.waitForFunction(()=>framesById.student?.ready);
    await page.evaluate(({taskSpec,current})=>hydrate('student',taskSpec,current,false),{taskSpec,current});await page.waitForFunction(()=>framesById.student.applied);
    frame=page.frames().find(f=>f.url().includes('channel=student'));assert.equal(await frame.locator('#lm-answer').inputValue(),'99999999');assert.equal(await frame.locator('.lm-feedback.incorrect').count(),1);assert.match(await frame.locator('.lm-card .lm-label').first().textContent(),taskSpec.items.length?/6 из 12/:/Пример 2 из 3/);
   }
  }
  assert.equal(await frame.locator('#lm-new').textContent(),'Новое условие →');
  await frame.locator('#lm-new').click();await page.waitForFunction(()=>events.at(-1).kind==='new-task');
  assert.equal((await page.evaluate(()=>events.at(-1))).details.contentId,item.contentId);
  completed++;
  console.log('Managed '+completed+'/36 '+item.contentId);
 }
 // Standalone mode still initializes all original family interfaces and storage.
 for(const item of process.argv.includes('--visual-only')?[]:C.list()){
  await page.goto(origin+item.url);await page.locator('h1').first().waitFor();
  assert.equal(await page.evaluate(()=>window.MathExamRemediationManaged),false);
  const button=page.locator('[data-route="practice"],[data-nav="practice"],#practice').first();await button.click();
  if(item.contentId.endsWith('/division-lab'))assert.equal(await page.locator('#answer').isVisible(),true);
  else if(item.contentId.startsWith('percentages/'))assert.equal(await page.locator('#p-q').isVisible(),true);
  else assert.equal(await page.locator('#view-practice').isVisible(),true);
 }
 for(const width of [360,1280])for(const id of ['multiplication-division/multiplication-pythagoras-table','multiplication-division/long-division-zero-in-quotient']){
  await page.setViewportSize({width,height:900});await page.goto(origin+'/harness');await page.addStyleTag({content:'iframe{width:100vw}'});
  const {taskSpec,state}=serverContracts.create('oge-basics',id,12345);if(taskSpec.lessons.length&&id.includes('pythagoras'))state.view='learn';else {state.answers=taskSpec.steps.slice(0,6).map(q=>String(q.answer));state.step=state.answers.length;}
  await page.evaluate(url=>openTrainer('student',url),'/trainers/oge-basics/'+id+'.html');await page.waitForFunction(()=>framesById.student?.ready);
  await page.evaluate(({taskSpec,state})=>hydrate('student',taskSpec,state,false),{taskSpec,state});await page.waitForFunction(()=>framesById.student.applied);
  const frame=page.frames().find(f=>f.url().includes('channel=student'));assert.equal(await frame.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Mobile overflow '+id+' at '+width);
  if(process.env.LEARNING_REMEDIATION_SHOTS){fs.mkdirSync(process.env.LEARNING_REMEDIATION_SHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.LEARNING_REMEDIATION_SHOTS,width+'-'+id.split('/').at(-1)+'.png'),fullPage:true});}
 }
 assert.deepEqual(errors,[]);await browser.close();await new Promise(r=>server.close(r));console.log(JSON.stringify({result:'LEARNING_REMEDIATION_BROWSER_OK',managedTrainers:completed,verifiedActions:actions,standaloneTrainers:completed?36:0,checks:completed?['opaque sandbox','read-only mirror','raw input and hints','restored exact task','all division actions','new task request','no managed localStorage','360/1280 layouts']:['360/1280 layouts']}));
})().catch(e=>{console.error(e);server.close();process.exit(1);});
