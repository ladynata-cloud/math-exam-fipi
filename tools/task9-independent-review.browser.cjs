'use strict';
// Browser integration for every exam card. Step values are reused from the
// trainer only to exercise real UI fields. Independent mathematics is checked
// separately in task9-independent-review.test.cjs.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const artifacts=path.resolve(process.env.TASK9_REVIEW_ARTIFACTS||path.join(root,'artifacts/task9-independent-review'));
fs.mkdirSync(artifacts,{recursive:true});
const server=http.createServer((req,res)=>{
 let pathname;
 try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch(_){res.writeHead(400).end();return;}
 if(pathname==='/favicon.ico'){res.writeHead(204).end();return;}
 const file=path.resolve(root,'.'+pathname);
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'application/octet-stream');res.end(data);});
});
const result={evidence:[],errors:[],overflow:[]};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url='http://127.0.0.1:'+server.address().port+'/trainers/oge-task9-equations.html';
 let browser;
 try{
 browser=await chromium.launch({headless:true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{}),
  args:['--disable-dev-shm-usage']});
 for(const width of [320,1280]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>result.errors.push({width,error:e.message}));
  await page.goto(url);
  const tasks=await page.evaluate(()=>EXAM_BANK.map((t,index)=>{
   const state={},steps=taskSteps(t).map(factory=>{const d=factory(state);d.check(d.reveal.vals,state);return{q:d.q,vals:d.reveal.vals,type:d.ui.type};});
   const roots=taskSolve(t).roots.map(valStr);
   return{id:t.id,index,answer:t.exp,ask:t.ask,roots,steps};
  }));
  for(const t of tasks){
   const picker=page.locator('#pane-mara .minimal-task-nav > details');if(await picker.getAttribute('open')===null)await picker.locator(':scope > summary').click();await picker.locator('select').selectOption(String(t.index));
   const card=page.locator('#mara-list > .task-card:not([hidden])'),q=card.locator(':scope > .task-q'),answer=card.locator(':scope > .field input');
   assert.equal(await card.getAttribute('data-task-id'),t.id);
   const question=await q.innerText();assert(question.length>15);await card.getByText('Об этом задании',{exact:true}).click();assert((await card.locator('.task-source').innerText()).length>15);
   if(t.ask)assert(question.includes(t.ask==='min'?'меньший':'больший'));
   const check=card.locator(':scope > .btn-row').getByRole('button',{name:'Проверить',exact:true});
   await check.click();assert.match(await card.locator(':scope > .fb').innerText(),/Заполни|Не разобрала/);
   const wrong=t.ask?t.roots[t.ask==='min'?1:0]:'12345';await answer.fill(wrong);await check.click();assert.equal(await answer.getAttribute('readonly'),null);assert(!await card.evaluate(el=>el.classList.contains('solved')));
   await card.getByRole('button',{name:'Хочешь подсказку?',exact:true}).click();
   for(let i=0;i<t.steps.length;i++){
    const plan=t.steps[i],step=card.locator('.minimal-hint-panel .step.active');assert.equal(await step.count(),1,t.id+' active '+i);
    const hint=step.getByRole('button',{name:'Подсказка',exact:true});if(await hint.count()){await hint.click();assert((await step.locator(':scope > .fb').innerText()).length>5);}
    const fields=step.locator(':scope > .ui-block input,:scope > .ui-block textarea');
    assert.equal(await fields.count(),plan.vals.length,t.id+' fields '+i);
    for(let j=0;j<plan.vals.length;j++)await fields.nth(j).fill(String(plan.vals[j]));
    await step.getByRole('button',{name:'Проверить',exact:true}).click();
    assert.equal(await card.locator('.minimal-hint-panel .step.done').count(),i+1,t.id+' accepted step '+i);
   }
   assert(await card.evaluate(el=>el.classList.contains('solved')),t.id+' solved after all steps');
   const over=await page.evaluate(()=>{const bad=[];for(const el of document.querySelectorAll('#mara-list > .task-card:not([hidden]) input,#mara-list > .task-card:not([hidden]) .task-source,#mara-list > .task-card:not([hidden]) .q,#mara-list > .task-card:not([hidden]) .task-q,#mara-list > .task-card:not([hidden]) button')){if(!el.getClientRects().length)continue;const r=el.getBoundingClientRect();if(r.left<-1||r.right>innerWidth+1)bad.push({text:el.textContent.slice(0,100),left:r.left,right:r.right});}return{page:document.documentElement.scrollWidth,viewport:innerWidth,bad};});
   if(over.bad.length||over.page>width+1)result.overflow.push({width,id:t.id,...over});
   await card.getByRole('button',{name:'Вернуться к задаче',exact:true}).click();
   await answer.fill(t.answer);await check.click();assert.equal(await answer.getAttribute('readonly'),'');assert.match(await card.locator(':scope > .fb').innerText(),/верно/);
   result.evidence.push({width,id:t.id,question,steps:t.steps.length,accepted:t.answer,wrongRejected:wrong});
   console.log('PASS',width,t.id,t.steps.length);
  }
  await page.screenshot({path:path.join(artifacts,width+'-last-card.png')});await context.close();
 }
 assert.deepEqual(result.errors,[]);assert.deepEqual(result.overflow,[]);
 console.log('FULL_BANK_UI_OK',result.evidence.length);
 }finally{fs.writeFileSync(path.join(artifacts,'full-bank-results.json'),JSON.stringify(result,null,2));if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
