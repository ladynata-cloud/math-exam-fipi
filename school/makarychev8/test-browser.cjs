'use strict';
// Real Chromium: number search, all new worked solutions, responsive task-first
// layout and saved work. Uses a local static server, never a learner account.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const server=http.createServer((req,res)=>{
 const name=decodeURIComponent(new URL(req.url,'http://local.test').pathname);
 if(name==='/favicon.ico'){res.writeHead(204).end();return;}
 let file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 if(name.endsWith('/'))file=path.join(file,'index.html');
 if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
 res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'})[path.extname(file)]||'application/octet-stream');
 res.end(fs.readFileSync(file));
});
const shots=process.env.M8_SCREENSHOTS||path.join(process.cwd(),'artifacts/makarychev8');
const newTasks=JSON.parse(fs.readFileSync(path.join(__dirname,'exercises-1-24.json'),'utf8'));
const counts=[6,2,6,2,2,8,3,3,3,4,6,6,3,4,4,4,4,4,2,2,3,6,6,2];
const errors=[];let browser,views=0,walked=0;
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port+'/school/makarychev8/';
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 fs.mkdirSync(shots,{recursive:true});
 for(const width of [320,390,768,1280]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon.ico'))errors.push(m.text());});
  await page.goto(url);await page.waitForFunction(()=>window.MakarychevApp);
  const nav=async hash=>{await page.evaluate(h=>{history.replaceState(null,'',h);window.MakarychevApp.route();},hash);await page.evaluate(()=>scrollTo(0,0));};
  // All 93 added prompts, at each viewport. Task navigation opens on demand.
  for(let i=0;i<newTasks.length;i++){
   const t=newTasks[i];await nav('#lesson/p01/'+(i+6));
   const box=await page.locator('.prompt').boundingBox();assert(box&&box.y<900,t.id+' condition below first screen at '+width);
   assert(box.x>=0&&box.x+box.width<=width+1,t.id+' prompt outside screen');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),t.id+' horizontal page overflow at '+width);
   assert.equal(await page.locator('.task-menu').evaluate(el=>el.open),width>900,'menu default at '+width);
   assert.equal(await page.locator('.source-note').innerText(),'Из учебника: '+t.source.reference+', с. '+t.source.page);
   if(['p01-ex002-а','p01-ex010-в','p01-ex018-г','p01-ex024-store'].includes(t.id))await page.screenshot({path:path.join(shots,t.id+'-'+width+'.png'),fullPage:true});
   views++;
  }
  await page.locator('.task-menu summary').click();assert(await page.locator('.task-menu').evaluate(el=>el.open)===!(width>900));
  if(width===320){
   // Every source number produces exactly its individual solution links.
   for(let n=1;n<=24;n++){
    await nav('#home');await page.locator('#exercise-number').fill(String(n));await page.locator('#number-form button').click();
    const links=page.locator('#number-result a.button:not(.quiet)');assert.equal(await links.count(),counts[n-1],'search №'+n);
    for(const href of await links.evaluateAll(els=>els.map(e=>e.getAttribute('href')))){
     const i=Number(href.split('/').at(-1));const ref=await page.evaluate(i=>window.MakarychevCourse.lessons[0].tasks[i].source.reference,i);
     assert.equal(Number(/№\s*(\d+)/.exec(ref)[1]),n,'search target №'+n);
    }
   }
   // Old deep-link/answer and notebook survive the content expansion.
   await nav('#lesson/p01/0');await page.getByText('Мои записи к задаче',{exact:true}).click();await page.locator('#notebook').fill('Старая задача: запись сохранена');
   await page.locator('#final-answer').fill('0,5');await page.locator('#answer-form button[type=submit]').click();
   assert(await page.evaluate(()=>window.MakarychevApp.getState().tasks['p01-t01'].independent));
   // New content: rejected denominator root, then reload the unfinished work.
   const rejected=newTasks.findIndex(t=>t.id==='p01-ex015-г');await nav('#lesson/p01/'+(rejected+6));
   await page.locator('#final-answer').fill('0;-3');await page.locator('#answer-form button[type=submit]').click();
   assert(!await page.evaluate(()=>window.MakarychevApp.getState().tasks['p01-ex015-г'].correct));
   await page.getByText('Мои записи к задаче',{exact:true}).click();await page.locator('#notebook').fill('−3 исключаю: знаменатель равен нулю');await page.reload();await page.waitForSelector('#notebook');
   assert.equal(await page.locator('#notebook').inputValue(),'−3 исключаю: знаменатель равен нулю');
   assert.equal(await page.locator('#final-answer').inputValue(),'0;-3');
   // Work through every authored new step using actual browser input events.
   for(let i=0;i<newTasks.length;i++){
    const t=newTasks[i];await nav('#lesson/p01/'+(i+6));await page.locator('[data-action=guided]').click();
    for(let k=0;k<t.steps.length;k++){
     await page.locator('[data-step-input="'+k+'"]').fill(t.steps[k].answer);
     await page.locator('[data-step-form="'+k+'"] button').click();
     assert.equal(await page.locator('.step.completed').count(),k+1,t.id+' sticky step');walked++;
    }
    if(t.kind==='choice')await page.locator('[data-choice="'+t.choices.indexOf(t.answer)+'"]').click();
    else await page.locator('#final-answer').fill(t.answer);
    await page.locator('#answer-form button[type=submit]').click();
    const state=await page.evaluate(id=>window.MakarychevApp.getState().tasks[id],t.id);assert(state.correct&&!state.independent,t.id+' assisted completion');
   }
   await page.reload();await page.waitForSelector('#notebook');
   assert(await page.evaluate(()=>window.MakarychevApp.getState().tasks['p01-ex024-saving'].correct));
   await nav('#lesson/p01/0');assert.equal(await page.locator('#notebook').inputValue(),'Старая задача: запись сохранена');
  }
  await context.close();
 }
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({status:'PASS',views,walkedSteps:walked,searchNumbers:24,viewports:[320,390,768,1280],flows:['all source prompts','all new steps','number search','old deep links','draft reload','excluded-root rejection','assisted credit','mobile task menu']}));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
