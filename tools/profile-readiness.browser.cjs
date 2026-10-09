'use strict';
// UI regression robot. Mathematical validity is checked separately by
// profile-readiness-math.test.cjs; this suite exercises the actual learner flow.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const lessons = require('../ege-profil/start/readiness-data.js');
const readiness = require('../ege-profil/start/readiness.js');
const root = path.resolve(__dirname,'..');
const KEY = 'mathexam.profileStart2027.v1';
const shotDir = process.env.PROFILE_READINESS_SHOTS || '/tmp/profile-readiness-shots';
const server = http.createServer((req,res) => {
  try {
    let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
    if(!file.startsWith(root+path.sep)) return res.writeHead(403).end();
    if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
    res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/html');
    res.end(fs.readFileSync(file));
  } catch(_) { res.writeHead(404).end(); }
});

(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port+'/ege-profil/start/index.html';
  let browser;const errors=[];let taskCount=0,answerCount=0;
  try {
    browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,headless:true,args:['--no-sandbox']});
    fs.mkdirSync(shotDir,{recursive:true});
    const context=await browser.newContext({viewport:{width:1280,height:900}});
    const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
    const noOverflow=async label=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow: '+label);
    const snapshot=async()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
    async function enterAnswer(value) {
      await page.locator('#answer').fill(String(value));await page.locator('#submit-answer').click();
      assert.equal(await page.locator('#feedback.good').count(),1,await page.locator('#feedback').innerText());
    }

    await page.goto(base+'#readiness');await page.locator('#diagnostic-start').waitFor();
    assert.match(await page.locator('h1').innerText(),/Закроем пробелы/);
    for(const width of [360,1280]) { await page.setViewportSize({width,height:900});await noOverflow('readiness '+width); }
    await page.setViewportSize({width:360,height:900});await page.screenshot({path:path.join(shotDir,'readiness-mobile.png'),fullPage:true});
    await page.locator('#diagnostic-start').click();await page.locator('#diagnostic-form').waitFor();
    // Missing/invalid data must leave the current question unscored and retryable.
    await page.locator('#diagnostic-check').click();assert.equal(await page.locator('#diagnostic-next').isVisible(),false);
    await page.locator('#answer').fill('не число');await page.locator('#diagnostic-check').click();
    assert.match(await page.locator('#diagnostic-feedback').innerText(),/не считается ошибкой/);
    assert.equal(await page.locator('#diagnostic-next').isVisible(),false);
    for(let i=0;i<readiness.checks.length;i++) {
      const q=readiness.checks[i];
      assert.equal(await page.locator('h1').innerText(),q.title);
      await page.locator('#answer').fill(String(q.answer));await page.locator('#diagnostic-check').click();
      assert.equal(await page.locator('#diagnostic-feedback.good').count(),1);
      await noOverflow('diagnostic '+q.id);
      await page.locator('#diagnostic-next').click();
    }
    await page.locator('#diagnostic-result').waitFor();assert.match(await page.locator('#diagnostic-result').innerText(),/12 из 12/);
    assert.match(await page.locator('#diagnostic-result').innerText(),/пробелов не обнаружено/);
    // Simulated OGE-4 pupil: remembers algebra, needs a trig route.
    await page.locator('#diagnostic-start').click();
    for(let i=0;i<readiness.checks.length;i++) {
      const q=readiness.checks[i];
      if(i<8) {await page.locator('#answer').fill(String(q.answer));await page.locator('#diagnostic-check').click();}
      else await page.locator('#diagnostic-skip').click();
      await page.locator('#diagnostic-next').click();
    }
    await page.locator('#diagnostic-result').waitFor();
    assert.match(await page.locator('#diagnostic-result').innerText(),/8 из 12/);
    assert.deepEqual(await page.locator('#diagnostic-result .readiness-card a').evaluateAll(es=>es.map(e=>e.getAttribute('href'))),readiness.checks.slice(8).map(q=>'#lesson/'+q.lesson));
    // Every skip remains actionable, and a learner is never trapped by a score.
    await page.locator('#diagnostic-start').click();
    for(const q of readiness.checks) {await page.locator('#diagnostic-skip').click();await page.locator('#diagnostic-next').click();}
    await page.locator('#diagnostic-result').waitFor();assert.match(await page.locator('#diagnostic-result').innerText(),/0 из 12/);
    assert.deepEqual(await page.locator('#diagnostic-result .readiness-card a').evaluateAll(es=>es.map(e=>e.getAttribute('href'))),[...new Set(readiness.checks.map(q=>'#lesson/'+q.lesson))]);
    await page.screenshot({path:path.join(shotDir,'diagnostic-result-mobile.png'),fullPage:true});
    await page.setViewportSize({width:1280,height:900});

    for(const lesson of lessons) {
      for(const mode of ['guided','independent']) {
        await page.goto(base+'#lesson/'+lesson.id);await page.locator('#'+mode).click();await page.locator('#answer-form').waitFor();
        const seen=[];
        for(let index=0;index<3;index++) {
          let data=await snapshot();const session=data.sessions[lesson.id+':'+mode];
          const task=lesson.tasks.find(t=>t.id===session.taskId);assert.ok(task);seen.push(task.id);
          assert.ok((mode==='guided'?lesson.tasks.slice(0,3):lesson.tasks.slice(3)).includes(task),'separate task pool');
          assert.equal(await page.locator('#next').isVisible(),false,'cannot skip current answer');
          for(const width of [360,1280]) {await page.setViewportSize({width,height:900});await noOverflow(task.id+' '+width);}
          if(lesson.id==='bridge-triangle') {
            assert.equal(await page.locator('.task-condition svg[role=img]').count(),1);
            const diagram=await page.locator('.task-condition svg').boundingBox();assert.ok(diagram.width>100 && diagram.height>100);
            if(index===2) {await page.setViewportSize({width:360,height:900});await page.screenshot({path:path.join(shotDir,task.id+'-mobile.png'),fullPage:true});}
          }
          const questions=mode==='guided'?task.steps:[{answer:task.answer}];
          for(let step=0;step<questions.length;step++) {
            const q=questions[step];await enterAnswer(q.answer);answerCount++;
            if(mode==='guided')assert.equal(await page.locator('#solution-history li').count(),step+1,'all earned steps remain visible');
            // Reload an accepted step before advancing, once per topic and mode.
            if(index===0 && step===0) {
              await page.reload();await page.locator('#next').waitFor();
              assert.equal(await page.locator('#answer').isDisabled(),true);
              assert.equal(await page.locator('#next').isEnabled(),true);
              if(mode==='guided')assert.equal(await page.locator('#solution-history li').count(),1);
            }
            await page.locator('#next').click();
          }
          await page.locator('.result-panel').waitFor();taskCount++;
          assert.match(await page.locator('.solution').innerText(),/Ответ:/);
          data=await snapshot();assert.equal(data.sessions[lesson.id+':'+mode].done,true);
          if(index===0) {await page.reload();await page.locator('.result-panel').waitFor();}
          if(index<2) {await page.locator('#another').click();await page.locator('#answer-form').waitFor();}
        }
        assert.equal(new Set(seen).size,3,'three distinct tasks '+lesson.id+' '+mode);
      }
      const record=(await snapshot()).records[lesson.id];assert.equal(record.guided.length,3);assert.equal(record.independent.length,3);
      console.log('Completed bridge',lesson.id);
    }
    assert.equal(taskCount,36);assert.equal(answerCount,lessons.reduce((sum,l)=>sum+l.tasks.slice(0,3).reduce((n,t)=>n+t.steps.length,0)+3,0));

    // A different learner makes a real misconception, asks for help, and resumes.
    const noviceContext=await browser.newContext({viewport:{width:360,height:900}});
    const novice=await noviceContext.newPage();novice.on('pageerror',e=>errors.push(e.message));novice.setDefaultTimeout(10000);
    const signs=lessons.find(l=>l.id==='bridge-signs'),task=signs.tasks[3];
    await novice.goto(base+'#practice/'+signs.id+'/independent');await novice.locator('#answer-form').waitFor();
    await novice.locator('#answer').fill(String(task.meta.a**2+task.meta.b**2));await novice.locator('#submit-answer').click();
    assert.equal(await novice.locator('#feedback.bad').count(),1);assert.equal(await novice.locator('#next').isVisible(),false);
    await novice.locator('#hint').click();assert.equal(await novice.locator('#hint-box').isVisible(),true);
    await novice.locator('#answer').fill('7/9');await novice.locator('.support-details summary').click();await novice.locator('#repair').click();
    await novice.getByRole('link',{name:'Вернуться на сохранённый шаг'}).click();assert.equal(await novice.locator('#answer').inputValue(),'7/9');
    await novice.reload();assert.equal(await novice.locator('#answer').inputValue(),'7/9');
    await novice.locator('#answer').fill(String(task.answer));await novice.locator('#submit-answer').click();await novice.locator('#next').click();
    const learnerRecord=await novice.evaluate(({key,id})=>JSON.parse(localStorage.getItem(key)).records[id],{key:KEY,id:signs.id});
    assert.equal(learnerRecord.independent.length,0,'corrected/helped solution is practice, not first-attempt mastery');
    await novice.reload();await novice.locator('.result-panel').waitFor();
    // Open a different prerequisite lesson, then return to the original task.
    await novice.goto(base+'#practice/trig-tangent/guided');await novice.locator('#answer-form').waitFor();
    await novice.locator('#answer').fill('3/17');
    await novice.locator('.support-details summary').click();await novice.locator('#repair').click();
    await novice.locator('.prerequisite-link[href="#lesson/bridge-fractions"]').click();
    await novice.locator('.return-to-task a[href="#practice/trig-tangent/guided"]').waitFor();
    assert.match(await novice.locator('h1').innerText(),/Дроби/);
    await novice.locator('.return-to-task a').click();await novice.locator('#answer-form').waitFor();
    assert.equal(await novice.locator('#answer').inputValue(),'3/17');
    assert.equal(await novice.locator('.return-to-task').count(),0);
    await noviceContext.close();
    await page.goto(base+'#progress');await page.locator('#export').waitFor();
    const downloaded=page.waitForEvent('download');await page.locator('#export').click();
    const report=JSON.parse(fs.readFileSync(await(await downloaded).path(),'utf8'));
    for(const l of lessons)assert.equal(report.records[l.id].independent.length,3);
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({gate:'PROFILE_READINESS_BROWSER_OK',tasks:taskCount,checkedAnswers:answerCount,diagnosticProfiles:3,responsive:[360,1280],acceptedStepReload:true,completedTaskReload:true,wrongAnswerRecovery:true,export:true,errors}));
    await context.close();
  } finally { if(browser)await browser.close();await new Promise(resolve=>server.close(resolve)); }
})().catch(error=>{console.error(error);process.exitCode=1;});
