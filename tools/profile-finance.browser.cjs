'use strict';
// Each mathematical family is exercised through actual inputs at both widths.
// Arithmetic is independently verified by profile-finance.test.cjs; this gate
// verifies accepted work, units, disclosure, persistence and independent credit.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require('playwright');
const lessons = require('../ege-profil/start/finance-data.js');
const oldLessons = require('../ege-profil/start/applied-data.js').filter(l=>l.position===13);
const KEY = 'mathexam.profileStart2027.v1';
const root = path.resolve(__dirname,'..');
const shots = process.env.PROFILE_FINANCE_SHOTS || '/tmp/profile-finance-shots';
const mime = {'.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'};
const server = http.createServer((req,res)=>{
  try{
    let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://fixture').pathname));
    if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
    if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
    res.setHeader('Content-Type',mime[path.extname(file)]||'text/html');res.end(fs.readFileSync(file));
  }catch(_){res.writeHead(404).end();}
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port,base=origin+'/ege-profil/start/index.html';
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,headless:true,args:['--no-sandbox']});
  const errors=[],failedRequests=[];let guided=0,independent=0,accepted=0,reloaded=0,checkedCells=0;
  fs.mkdirSync(shots,{recursive:true});
  try{
    for(const width of [320,1280]){
      const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();page.setDefaultTimeout(12000);
      page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)failedRequests.push(r.status()+' '+r.url());});
      await page.goto(base+'#part-one');
      async function saved(){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);}
      async function session(lesson,mode){return (await saved()).sessions[lesson.id+':'+mode];}
      async function seed(lesson,task,mode,extra={}){
        await page.evaluate(({key,id,taskId,mode,extra})=>{
          localStorage.setItem(key,JSON.stringify({version:1,records:{},seen:{[taskId]:1},sessions:{[id+':'+mode]:{taskId,step:0,wrong:false,assisted:mode==='guided',familiar:false,done:false,draft:'',answers:[],started:'2026-10-29T12:00:00.000Z',registered:false,...extra}}}));
        },{key:KEY,id:lesson.id,taskId:task.id,mode,extra});
        await page.goto(base+'?finance='+encodeURIComponent(task.id+'-'+mode+'-'+width)+'#practice/'+lesson.id+'/'+mode);
        await page.locator('#answer-form').waitFor();
      }
      async function fill(question,value=question.answerExact??String(question.answer)){
        if(question.choices){const values=await page.locator('input[name="answer"]').evaluateAll(es=>es.map(e=>e.value));const index=values.indexOf(String(value));assert(index>=0);await page.locator('input[name="answer"]').nth(index).check();}
        else await page.locator('#answer').fill(String(value));
      }
      async function accept(question){
        if(question.unit)assert.equal((await page.locator('#answer-unit[data-answer-unit]').innerText()).trim(),question.unit,'Explicit input unit');else assert.equal(await page.locator('#answer-unit').count(),0,'Dimensionless intermediate has no inherited monetary unit');
        await fill(question);await page.locator('#submit-answer').click();await page.locator('#feedback.good').waitFor();assert(await page.locator('#next').isEnabled());assert(await page.locator('#submit-answer').isDisabled());accepted++;
      }
      async function layout(label){
        const result=await page.evaluate(()=>{
          const model=document.querySelector('.finance-model');
          const bad=[...model.querySelectorAll('.finance-cell,.finance-cell-value,.finance-cell-label,.finance-button,.finance-row-heading')].filter(e=>e.getClientRects().length&&e.clientWidth>0&&e.scrollWidth>e.clientWidth+2).map(e=>e.className);
          return {overflow:document.documentElement.scrollWidth>innerWidth+1,bad};
        });assert.equal(result.overflow,false,width+'px page overflow '+label);assert.deepEqual(result.bad,[],width+'px clipped cell/control '+label);
      }
      async function cells(task,completed,mode,help=false){
        const observed=await page.locator('.finance-cell').evaluateAll(es=>es.map(e=>{const value=e.querySelector('.finance-cell-value').cloneNode(true);for(const fraction of value.querySelectorAll('.profile-solution-fraction'))fraction.replaceWith(fraction.querySelector('.profile-solution-numerator').textContent+'/'+fraction.querySelector('.profile-solution-denominator').textContent);return {row:e.dataset.row,column:e.dataset.column,state:e.dataset.state,value:value.textContent,markup:e.outerHTML};}));
        assert(observed.length>=4,task.id+': actual financial ledger');
        const unlocked=Number.isInteger(task.finance.revealScheduleAfter)&&task.finance.revealScheduleAfter<=completed;
        const source=(unlocked?task.finance.rows:task.finance.previewRows)||task.finance.rows;
        for(const cell of observed){
          const row=source.find(r=>String(r.id)===cell.row);assert(row,task.id+': displayed row is from allowed schedule '+cell.row);
          const authored=row.cells[cell.column]||{};
          const given=authored.given===true&&authored.revealAfter===0;
          const earned=!given&&Number.isInteger(authored.revealAfter)&&authored.revealAfter>0&&authored.revealAfter<=completed;
          const expected=given?'given':earned?'earned':'locked';assert.equal(cell.state,expected,task.id+': '+cell.row+'/'+cell.column);
          assert.equal(cell.value,expected==='locked'?'…':String(authored.display),task.id+': no future number in a cell');
          if(expected==='locked')assert.doesNotMatch(cell.markup,/data-(?:value|answer)|valueExact|title=/u,task.id+': no hidden answer attribute');checkedCells++;
        }
        if(!unlocked){assert.equal(await page.locator('.finance-model').getAttribute('data-schedule'),'symbolic');assert.equal(await page.locator('.finance-pager').isVisible(),false);assert.equal((await page.locator('.finance-range').innerText()).trim(),'');}
        if(mode==='independent'&&completed===0&&!help)assert.equal(await page.locator('.finance-current').isVisible(),false,'Independent task does not show a worked step');
      }
      async function resultLedger(task){
        const model=page.locator('#result-model .finance-model');await model.waitFor();
        assert.equal(await model.locator('[data-state="locked"]').count(),0,task.id+': completed ledger keeps the values already found');
        assert(await model.locator('[data-state="earned"]').count()>0,task.id+': computed values survive completion');
        assert(await model.locator('.finance-model-result').isVisible(),task.id+': completed ledger identifies the target and its unit');
        assert((await model.locator('.finance-model-result').innerText()).endsWith(' '+task.unit),task.id+': final table unit');
      }
      for(const lesson of lessons){
        for(const [i,task] of lesson.tasks.slice(0,3).entries()){
          await seed(lesson,task,'guided');await cells(task,0,'guided');await layout(task.id);
          for(let step=0;step<task.steps.length;step++){
            if(i===0&&step===1&&!task.steps[step].choices){
              await page.locator('#answer').fill('7/11');const before=await session(lesson,'guided');await page.reload();await page.locator('#answer-form').waitFor();
              assert.equal(await page.locator('#answer').inputValue(),'7/11');assert.deepEqual(await session(lesson,'guided'),before);assert.equal(await page.locator('#solution-history [data-step]').count(),step);await cells(task,step,'guided');reloaded++;
            }
            if(task.steps[step].choices){
              await fill(task.steps[step]);await page.reload();await page.locator('#answer-form').waitFor();assert.equal(await page.locator('input[name="answer"]:checked').inputValue(),String(task.steps[step].answer));reloaded++;
            }
            await accept(task.steps[step]);await cells(task,step+1,'guided');
            if(step===0&&i===0){await layout(task.id+' accepted');if(lesson===lessons[0])await page.screenshot({path:path.join(shots,'finance-'+width+'.png'),fullPage:true});}
            await page.locator('#next').click();
          }
          await page.locator('.result-panel').waitFor();await resultLedger(task);assert.equal(await page.locator('#solution-history [data-step]').count(),task.steps.length);assert((await saved()).records[lesson.id].guided.includes(task.id));guided++;
        }
        for(const task of lesson.tasks.slice(3)){
          await seed(lesson,task,'independent');await cells(task,0,'independent');await layout(task.id);
          await accept(task);await cells(task,task.steps.length,'independent');await page.locator('#next').click();await page.locator('.result-panel').waitFor();await resultLedger(task);
          const record=(await saved()).records[lesson.id];assert(record.independent.includes(task.id),task.id+': fresh unassisted result earns credit');independent++;
        }
        // Help is tracked before the walkthrough, and an assisted attempt stays
        // assisted after reload. One representative per lesson avoids redundant
        // full replay while covering each lesson's persistence integration.
        const task=lesson.tasks[3];await seed(lesson,task,'independent');await page.locator('#answer').fill('3/7');
        await page.locator('[data-model-action="finance-help"]').click();assert.equal((await session(lesson,'independent')).assisted,true);await cells(task,0,'independent',true);
        await page.reload();await page.locator('#answer-form').waitFor();assert.equal(await page.locator('#answer').inputValue(),'3/7');assert.equal((await session(lesson,'independent')).assisted,true);await cells(task,0,'independent');
        await page.locator('#hint').click();await page.locator('[data-solution-open]').click();await page.locator('[data-solution-step]').first().waitFor();assert.equal(await page.locator('[data-solution-step]').count(),1,'Only requested first walkthrough step appears');
        await accept(task);await page.locator('#next').click();await page.locator('.result-panel').waitFor();await resultLedger(task);assert.equal((await saved()).records[lesson.id].independent.length,0,'Helped answer cannot earn independent credit');
      }
      // Wrong unit and a near-integer must fail in the real form, with a hint
      // about the kind of mistake and without exposing the correct answer.
      const moneyLesson=lessons.find(l=>l.tasks.slice(3).some(t=>/руб/.test(t.unit)&&t.answer>1000000));
      const money=moneyLesson.tasks.slice(3).find(t=>/руб/.test(t.unit)&&t.answer>1000000);await seed(moneyLesson,money,'independent');
      await fill(money,String(money.answer+0.01));await page.locator('#submit-answer').click();await page.locator('#feedback.bad').waitFor();assert(await page.locator('#next').isDisabled());
      await fill(money,String(money.answer/1000));await page.locator('#submit-answer').click();await page.locator('#feedback.bad').waitFor();assert.match(await page.locator('#feedback').innerText(),/единиц|тысяч|миллион/iu);
      const integerLesson=lessons.find(l=>l.tasks.slice(3).some(t=>t.domain==='integer'));const integer=integerLesson.tasks.slice(3).find(t=>t.domain==='integer');await seed(integerLesson,integer,'independent');
      await fill(integer,String(integer.answer+1e-8));await page.locator('#submit-answer').click();await page.locator('#feedback.bad').waitFor();assert.match(await page.locator('#feedback').innerText(),/целое/iu);assert(await page.locator('#next').isDisabled());
      // Upgrade compatibility is exercised with an actual saved original task.
      const old=oldLessons.find(l=>l.tasks[0].steps.length>=3),oldTask=old.tasks[0];const answers=oldTask.steps.slice(0,2).map(q=>String(q.answer));
      await seed(old,oldTask,'guided',{step:2,answers,draft:'1/7'});assert.equal(await page.locator('#answer').inputValue(),'1/7');assert.equal(await page.locator('#solution-history [data-step]').count(),2);assert.equal((await session(old,'guided')).step,2);
      await page.reload();assert.equal(await page.locator('#answer').inputValue(),'1/7');assert.deepEqual((await session(old,'guided')).answers,answers);
      const restored=await page.locator('.current-question .question').innerText();const plain=oldTask.steps[2].prompt.replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();assert.equal(restored.replace(/\s+/g,' ').trim(),plain,'Previously saved step keeps its original question');
      await context.close();console.log('Finance journeys verified at '+width+'px');
    }
    assert.equal(guided,78);assert.equal(independent,78);assert.equal(errors.length,0,errors.join('\n'));assert.equal(failedRequests.length,0,failedRequests.join('\n'));
    console.log(JSON.stringify({gate:'PROFILE_FINANCE_BROWSER_OK',guided,independent,accepted,reloaded,checkedCells,widths:[320,1280],sourceFamilies:39}));
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;server.close();});
