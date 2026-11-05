const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),output=path.join(root,'artifacts/oge12-source-audit');
fs.mkdirSync(output,{recursive:true});
const initial={'oge-t12-formuly':{solvedByType:{'1':7,'6':3},best:9,total:10,runs:2,passed:true,ext:{byType:{'1':{a:9,c:7}},lastDate:'2026-11-04'}},'other-trainer':{solvedByType:{a:17},ext:{draft:'keep'}}};
(async()=>{
 const browser=await chromium.launch({headless:true});let cases=0,guided=0,modeCases=0;
 try{
 for(const width of [320,390,1280]){
  const context=await browser.newContext({viewport:{width,height:900}});
  // Route only the local test origin to actual checked-out bytes; no live data or TLS overrides.
  await context.route('https://mathexam.test/**',async route=>{const u=new URL(route.request().url()),p=path.join(root,decodeURIComponent(u.pathname));if(!p.startsWith(root+path.sep)||!fs.existsSync(p)||!fs.statSync(p).isFile())return route.fulfill({status:404,body:'Not found'});const ext=path.extname(p),types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'};return route.fulfill({status:200,contentType:types[ext]||'application/octet-stream',body:fs.readFileSync(p)});});
  await context.addInitScript(initial=>{if(!localStorage.getItem('audit-seeded')){localStorage.setItem('mathExamCourseProgress.v1',JSON.stringify(initial));localStorage.setItem('unrelated-draft','do not change');localStorage.setItem('audit-seeded','1');}},initial);
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const url='https://mathexam.test/trainers/oge-task12-formulas-trainer.html';
  await page.goto(url);await page.locator('#ansIn').waitFor();
  const snapshot=()=>page.evaluate(()=>localStorage.getItem('mathExamCourseProgress.v1'));
  assert.deepEqual(JSON.parse(await snapshot()),initial,'opening preserves existing results');
  for(let i=0;i<40;i++){
   await page.evaluate(i=>{mode='exam';reviewOn=false;cur=GENS[i].make();A=newState();renderTask();},i);
   const task=await page.evaluate(()=>JSON.parse(JSON.stringify(cur)));
   await page.locator('#ansIn').fill('17,5');
   const help=page.locator('#taskArea .minimal-hint');await help.click();await help.click();assert.equal(await page.locator('#ansIn').inputValue(),'17,5');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,`overflow ${width}/${i}`);
   await page.locator('#source12 summary').click();assert.equal(await page.locator('#source12Link').getAttribute('href'),'oge-task12-sources.html#'+task.generatorId);assert.match(await page.locator('#source12Text').innerText(),task.sourceId?/не дословное/:/учебное упражнение/);await page.locator('#source12 summary').click();
   if(i===4){await page.locator('#ansIn').fill('');await page.screenshot({path:path.join(output,`taxi-${width}.png`),fullPage:true});}
   await page.locator('#ansIn').fill(String(task.answer+123456));await page.locator('#checkBtn').click();assert.equal(await page.evaluate(()=>A.done),false);
   await page.locator('#ansIn').fill(String(task.answer).replace('.',','));await page.locator('#ansIn').press('Enter');assert.equal(await page.evaluate(()=>A.done),true);
   const saved=await snapshot();await page.evaluate(()=>document.querySelector('#checkBtn').onclick());assert.equal(await snapshot(),saved,'no duplicate credit');cases++;
  }
  const saved=await snapshot();await page.reload();await page.locator('#ansIn').waitFor();assert.equal(await snapshot(),saved,'reload preserves progress');
  assert.deepEqual(JSON.parse(saved)['other-trainer'],initial['other-trainer']);assert.equal(await page.evaluate(()=>localStorage.getItem('unrelated-draft')),'do not change');
  if(width===390){
   // Every generator can still be learned through the retained visible step controls.
   for(let i=0;i<40;i++){
    await page.evaluate(i=>{mode='steps';cur=GENS[i].make();A=newState();renderTask();},i);
    while(!await page.evaluate(()=>A.done)){
     const step=await page.evaluate(()=>JSON.parse(JSON.stringify(stepList[A.stepIdx])));
     if(step.kind==='mc'){const k=step._opts.findIndex(o=>o.ok);await page.locator('#stepMc button').nth(k).click();}
     else{await page.locator('#stepIn').fill(String(step.answer).replace('.',','));await page.locator('#stepCheck').click();}
    }
    assert.equal(await page.locator('#taskArea .step-done').count(),await page.evaluate(()=>stepList.length));guided++;
   }
   // Substitution, identifying the requested quantity, and error diagnoses for every eligible generator.
   for(let i=0;i<40;i++)for(const m of ['find','subst','errors']){
    const eligible=await page.evaluate(({i,m})=>m==='find'||!!GENS[i].make()[m==='subst'?'subst':'mistake'],{i,m});if(!eligible)continue;
    await page.evaluate(({i,m})=>{mode=m;cur=GENS[i].make();A=newState();renderTask();},{i,m});
    if(m==='find'){const k=await page.evaluate(()=>cur.letters.findIndex(l=>l.n===cur.target));await page.locator('#mc1 button').nth(k).click();const r=await page.evaluate(()=>cur.rearr?1:0);await page.locator('#mc2 button').nth(r).click();assert.match(await page.locator('#fb').innerText(),/Верно/);}
    if(m==='subst'){const vals=await page.evaluate(()=>cur.subst.vals);for(const v of vals)await page.locator(`#chips button[data-v="${v}"]:not([disabled])`).first().click();await page.locator('#checkBtn').click();assert.match(await page.locator('#fb').innerText(),/Верно|верно/);}
    if(m==='errors'){const label=await page.evaluate(()=>cur.mistake.label);await page.locator('#mcErr button').filter({hasText:label}).click();assert.match(await page.locator('#fb').innerText(),/Точно/);}
    modeCases++;
   }
   await page.evaluate(()=>setMode('exam'));
   for(let type=1;type<=10;type++){await page.evaluate(type=>{typeFilter=type;newTask()},type);assert.ok(await page.evaluate(()=>!!cur.sourceId));}
   await page.locator('.minimal-settings summary').first().click();await page.locator('#modes button[data-id="diag"]').click();
   for(let k=0;k<10;k++){assert.ok(await page.evaluate(()=>!!cur.sourceId));assert.equal(await page.locator('#taskArea .badge').count(),0);const a=await page.evaluate(()=>String(cur.answer));await page.locator('#ansIn').fill(a);await page.locator('#checkBtn').click();await page.locator('#qNext').click();}
   assert.match(await page.locator('#taskArea').innerText(),/Зачёт сдан: 10 из 10/);
  }
  await page.goto('https://mathexam.test/trainers/oge-task12-sources.html');assert.equal(await page.locator('article').count(),40);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);await page.screenshot({path:path.join(output,`registry-${width}.png`),fullPage:false});
  assert.deepEqual(errors,[]);await context.close();
 }
 const result={status:'PASS',browser:browser.version(),viewports:[320,390,1280],answerJourneys:cases,guidedJourneys:guided,additionalModeJourneys:modeCases,quizQuestions:10,progressReloads:3};fs.writeFileSync(path.join(output,'browser.json'),JSON.stringify(result,null,2)+'\n');console.log('OGE12_SOURCE_BROWSER_OK '+JSON.stringify(result));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
