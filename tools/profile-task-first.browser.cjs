'use strict';
// Simulated pupils verify disclosure and retained work; this is not a pupil trial.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),KEY='mathexam.profileStart2027.v1';
const lessons=['geometry','algebra','stereo','probability','equations','functions','applied', 'finance','readiness'].flatMap(n=>require('../ege-profil/start/'+n+'-data.js'));
const server=http.createServer((req,res)=>{try{let file=path.resolve(ROOT,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!file.startsWith(ROOT+path.sep))return res.writeHead(403).end();if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));}catch(_){res.writeHead(404).end();}});
const saved=(page,id,mode='independent')=>page.evaluate(({KEY,id,mode})=>JSON.parse(localStorage.getItem(KEY)).sessions[id+':'+mode],{KEY,id,mode});
const retained=s=>({taskId:s.taskId,started:s.started,step:s.step,draft:s.draft,answers:s.answers,done:s.done,wrong:s.wrong});
(async()=>{let browser;await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,base=origin+'/ege-profil/start/';try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,headless:true,args:['--no-sandbox']});
  const errors=[],bad=[];const context=await browser.newContext({viewport:{width:1280,height:900}});const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))bad.push(r.url());});
  await page.goto(base);await page.locator('[data-calm-exam="13"]').waitFor();
  let count=0;
  for(const lesson of lessons){
    await page.goto(base+'#practice/'+lesson.id+'/independent');await page.locator('#answer-form').waitFor();
    const session=await saved(page,lesson.id),task=lesson.tasks.find(t=>t.id===session.taskId);assert(task);
    const main=page.locator('.condition-panel .task-condition'),hint=page.locator('#hint'),box=page.locator('#hint-box');
    assert.equal(await box.isVisible(),false,lesson.id+': help initially closed');
    assert.equal(await hint.textContent(),'Хочешь подсказку?');
    assert.notEqual((await page.locator('.current-question>.question').innerText()).trim(),'Найдите ответ.');
    assert.match(await page.locator('#answer-form').innerText(),/вопрос выше/);
    const condition=await main.innerText();
    if(await page.locator('#task-model').count())assert(await page.locator('#task-model').isVisible(),lesson.id+': drawing immediately visible');
    await page.locator('#answer').fill('1/7');const before=retained(await saved(page,lesson.id));
    // Identity witnesses would be lost by rebuilding either the answer or drawing.
    await page.evaluate(()=>{window.answerWitness=document.getElementById('answer');window.modelWitness=document.getElementById('task-model');});
    await hint.focus();await page.keyboard.press('Enter');assert(await box.isVisible());assert.equal(await hint.getAttribute('aria-expanded'),'true');
    assert.equal((await saved(page,lesson.id)).assisted,true,lesson.id+': help remains recorded');
    const detailed=page.locator('#task-solution [data-solution-open]');let steps=0;
    if(await detailed.count()){await detailed.click();await page.locator('#task-solution [data-solution-next]').click();steps=await page.locator('#task-solution [data-solution-step]').count();assert.equal(steps,2);}
    await box.locator('.task-foundation>summary').click();
    const range=page.locator('#task-model input[type=range]').first();let rangeValue=null;
    if(await range.count()){rangeValue=await range.evaluate(n=>{n.value=n.max||'1';n.dispatchEvent(new Event('input',{bubbles:true}));return n.value;});}
    await hint.click();assert.equal(await box.isVisible(),false);assert.equal(await hint.textContent(),'Хочешь подсказку?');
    assert.equal(await main.innerText(),condition);assert.deepEqual(retained(await saved(page,lesson.id)),before,lesson.id+': no task/answer mutation');
    assert.equal(await page.locator('#answer').inputValue(),'1/7');
    assert(await page.evaluate(()=>answerWitness===document.getElementById('answer')&&modelWitness===document.getElementById('task-model')),lesson.id+': controls stay mounted');
    assert.equal((await saved(page,lesson.id)).assisted,true);
    await hint.click();assert.equal(await box.locator('.task-foundation').getAttribute('open'),'');
    if(steps)assert.equal(await page.locator('#task-solution [data-solution-step]').count(),steps);
    if(rangeValue!==null)assert.equal(await range.inputValue(),rangeValue);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),lesson.id+': desktop fits');
    count++;
  }
  // The guided route also keeps its accepted history when the next step asks for help.
  await page.goto(base+'#practice/geo-right/guided');await page.locator('#answer-form').waitFor();
  let guided=await saved(page,'geo-right','guided');let task=lessons.find(l=>l.id==='geo-right').tasks.find(t=>t.id===guided.taskId);
  await page.locator('#answer').fill(String(task.steps[0].answer));await page.locator('#submit-answer').click();await page.locator('#next').click();await page.locator('#answer-form').waitFor();
  const history=await page.locator('#solution-history').innerText();await page.locator('#answer').fill('9/7');const guidedBefore=retained(await saved(page,'geo-right','guided'));
  await page.locator('#hint').click();await page.locator('#hint').click();assert.equal(await page.locator('#solution-history').innerText(),history);assert.deepEqual(retained(await saved(page,'geo-right','guided')),guidedBefore);
  // A helped result is not credited as independent; a fresh unassisted task is.
  await page.goto(base+'#practice/prob-count/independent');await page.locator('#answer-form').waitFor();
  let current=await saved(page,'prob-count');task=lessons.find(l=>l.id==='prob-count').tasks.find(t=>t.id===current.taskId);
  await page.locator('#answer').fill(String(task.answer));await page.locator('#submit-answer').click();await page.locator('#next').click();await page.locator('.result-panel').waitFor();
  assert.equal(await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)).records['prob-count'].independent.length,KEY),0);
  await page.locator('#another').click();await page.locator('#answer-form').waitFor();current=await saved(page,'prob-count');assert.equal(current.assisted,false);task=lessons.find(l=>l.id==='prob-count').tasks.find(t=>t.id===current.taskId);
  await page.locator('#answer').fill(String(task.answer));await page.locator('#submit-answer').click();await page.locator('#next').click();await page.locator('.result-panel').waitFor();
  assert.equal(await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)).records['prob-count'].independent.length,KEY),1);
  await page.setViewportSize({width:320,height:900});
  for(const id of ['geo-right','eq-quadratic','applied-motion','expr-fractions']){
    await page.goto(base+'#practice/'+id+'/independent');await page.locator('#answer-form').waitFor();await page.locator('#hint').click();
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),id+': mobile fits');
    const shots=process.env.PROFILE_TASK_FIRST_SHOTS;if(shots){fs.mkdirSync(shots,{recursive:true});await page.screenshot({path:path.join(shots,id+'-320.png'),fullPage:true});}
  }
  assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);console.log('PROFILE_TASK_FIRST_BROWSER_OK: '+count+' lesson families; same-page help, draft/model identity, nested state, guided history, independent credit, 320px');
}finally{await browser?.close();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
