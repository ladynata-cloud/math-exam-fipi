'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const p=path.join(root,decodeURIComponent(req.url.split('?')[0]));try{res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(p));}catch{res.statusCode=404;res.end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/ege-baza/path/index.html';let browser;
 try{browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});const p=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'#lesson=equations');await p.locator('[data-stage="2"]').click();assert.match(await p.locator('.task').innerText(),/5x \+ 8 = 2x \+ 17/);await p.locator('#moreGuided').click();await p.waitForURL('**#lesson=equations-linear');assert(await p.locator('#answer').isVisible());
 const ids=await p.evaluate(()=>PathData.equationPractice.families.map(m=>m.id));
 for(const id of ids){
  await p.goto(base+'#lesson='+id);await p.locator('[data-stage="2"]').click();
  for(let attempt=0;attempt<2;attempt++){
   while(await p.locator('#answer').count()){const answer=await p.evaluate(id=>{const l=PathCourse.state().lessons[id];return PathData.task(id,l.seed).steps[l.step].a;},id);await p.locator('#answer').fill(String(answer));await p.locator('#answer').press('Enter');}
   assert.match(await p.locator('#lesson').innerText(),/Разбор завершён/);
   if(attempt===0){const before=await p.locator('.task').innerText();await p.locator('#moreGuided').click();assert.notEqual(await p.locator('.task').innerText(),before);}
  }
  await p.locator('#new').click();let q=await p.locator('.task').innerText();const answer=await p.evaluate(id=>{const l=PathCourse.state().lessons[id];return PathData.task(id,l.seed).answer;},id);
  await p.locator('#answer').fill(String(answer));await p.locator('#answer').press('Enter');assert.match(await p.locator('#feedback').innerText(),/Верно с первой попытки/);assert.equal(await p.evaluate(id=>PathCourse.state().lessons[id].independent,id),1);
  await p.locator('#new').click();assert.notEqual(await p.locator('.task').innerText(),q);await p.locator('#answer').fill('7/3');q=await p.locator('.task').innerText();await p.reload();assert.equal(await p.locator('#answer').inputValue(),'7/3');assert.equal(await p.locator('.task').innerText(),q);
  await p.locator('[data-stage="1"]').click();assert(await p.locator('.equation-work').isVisible());if(id==='equations-brackets')assert.match(await p.locator('#lesson').innerText(),/После раскрытия скобок/);
  await p.locator('#reduceMotion').check();await p.locator('.term[data-s="1"]').first().click();await p.locator('[data-sign="-1"]').click();await p.locator('#moveTerm').click();assert.match(await p.locator('#eqFeedback').innerText(),/Равенство сохранено/);
 }
 await p.goto(base+'#lesson=equations-linear');await p.locator('[data-stage="2"]').click();
 for(const width of [390,1280]){await p.setViewportSize({width,height:900});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if(process.env.EQUATION_SCREENSHOTS)await p.screenshot({path:process.env.EQUATION_SCREENSHOTS+'/equations-'+width+'.png',fullPage:true});}
 await p.locator('[data-stage="3"]').click();const beforeRepeat=await p.evaluate(()=>{const state=PathCourse.state();for(let seed=0;seed<240;seed++)state.seen[PathData.task('equations-linear',seed).q]=true;return state.lessons['equations-linear'].independent;});await p.locator('#new').click();const repeatedAnswer=await p.evaluate(()=>{const l=PathCourse.state().lessons['equations-linear'];return PathData.task('equations-linear',l.seed).answer;});await p.locator('#answer').fill(String(repeatedAnswer));await p.locator('#answer').press('Enter');assert.equal(await p.evaluate(()=>PathCourse.state().lessons['equations-linear'].independent),beforeRepeat);assert.match(await p.locator('#feedback').innerText(),/повторного показа/);
 assert.deepEqual(errors,[]);console.log('EGE_BAZA_EQUATION_BROWSER_OK: screenshot lesson entry; four families, eight guided completions, four fresh independent successes, same-type renewal, fraction drafts/reload, interactive transfer, brackets explanation, mobile/desktop, no errors');
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
