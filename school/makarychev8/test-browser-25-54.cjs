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
const newTasks=JSON.parse(fs.readFileSync(path.join(__dirname,'exercises-25-54.json'),'utf8'));
const counts=[6,6,6,4,2,4,6,6,4,4,4,4,4,2,2,8,1,8,2,4,2,4,1,2,4,4,5,6,9,2];
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
  // All 124 added prompts, at each viewport. Task navigation opens on demand.
  for(let i=0;i<newTasks.length;i++){
   const t=newTasks[i];await nav('#lesson/p02/'+(i+6));
   const box=await page.locator('.prompt').boundingBox();assert(box&&box.y<900,t.id+' condition below first screen at '+width);
   assert(box.x>=0&&box.x+box.width<=width+1,t.id+' prompt outside screen');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),t.id+' horizontal page overflow at '+width);
   assert.equal(await page.locator('.task-menu').evaluate(el=>el.open),width>900,'menu default at '+width);
   assert.equal(await page.locator('.source-note').innerText(),'Из учебника: '+t.source.reference+', с. '+t.source.page);
   if(t.graph){const fig=await page.locator('#task-graph').boundingBox();if(!fig||fig.y+fig.height>900)await page.screenshot({path:path.join(shots,'layout-failure-'+t.id+'-'+width+'.png'),fullPage:true});assert(fig&&fig.y+fig.height<=900,t.id+' complete graph below first screen: '+JSON.stringify(fig));}
   if(['p02-ex029-а','p02-ex038-а','p02-ex038-б','p02-ex041-','p02-ex047-','p02-ex048-б','p02-ex051-д'].includes(t.id))await page.screenshot({path:path.join(shots,t.id+'-'+width+'.png'),fullPage:true});
   views++;
  }
  await page.locator('.task-menu summary').click();assert(await page.locator('.task-menu').evaluate(el=>el.open)===!(width>900));
  if(width===320){
   // Every source number produces exactly its individual solution links.
   for(let n=25;n<=54;n++){
    await nav('#home');await page.locator('#exercise-number').fill(String(n));await page.locator('#number-form button').click();
    const links=page.locator('#number-result a.button:not(.quiet)');assert.equal(await links.count(),counts[n-25],'search №'+n);
    for(const href of await links.evaluateAll(els=>els.map(e=>e.getAttribute('href')))){
     const i=Number(href.split('/').at(-1));const ref=await page.evaluate(i=>window.MakarychevCourse.lessons[1].tasks[i].source.reference,i);
     assert.equal(Number(/№\s*(\d+)/.exec(ref)[1]),n,'search target №'+n);
    }
   }
   // The old p02 entry point and notebook retain their identity.
   await nav('#lesson/p02/0');await page.getByText('Мои записи к задаче',{exact:true}).click();await page.locator('#notebook').fill('Старая задача: запись сохранена');
   await page.locator('#final-answer').fill('2/3');await page.locator('#answer-form button[type=submit]').click();
   assert(await page.evaluate(()=>window.MakarychevApp.getState().tasks['p02-t01'].independent));
   // Work through every authored new step using actual browser input events.
   for(let i=0;i<newTasks.length;i++){
    const t=newTasks[i];await nav('#lesson/p02/'+(i+6));await page.locator('[data-action=guided]').click();
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
   await page.reload();await page.waitForSelector('#answer-form');
   assert(await page.evaluate(()=>window.MakarychevApp.getState().tasks['p02-ex054-б'].correct));
   await nav('#lesson/p02/0');assert.equal(await page.locator('#notebook').inputValue(),'Старая задача: запись сохранена');
  }
  await context.close();
 }
 // Separate fresh session: graph construction is actual answer input, not a decorative model.
 const gc=await browser.newContext({viewport:{width:390,height:900}}),gp=await gc.newPage();
 gp.on('pageerror',e=>errors.push(String(e)));await gp.goto(url);await gp.waitForFunction(()=>window.MakarychevApp);
 const graphNav=async id=>{const i=newTasks.findIndex(t=>t.id===id);await gp.evaluate(i=>{history.replaceState(null,'','#lesson/p02/'+(i+6));window.MakarychevApp.route();},i);};
 await graphNav('p02-ex038-а');assert.equal(await gp.locator('#task-graph [data-k]').count(),0,'no prefilled solution');
 await gp.locator('#final-answer').fill('0,5;-2,5;нет');assert.equal(await gp.locator('#task-graph [data-k]').getAttribute('data-k'),'0.5');
 await gp.locator('#answer-form button[type=submit]').click();assert(!await gp.evaluate(()=>window.MakarychevApp.getState().tasks['p02-ex038-а'].correct),'missing hole must fail');
 await gp.locator('#final-answer').fill('0,5;-2,5;-5');assert.equal(await gp.locator('#task-graph [data-hole-x]').getAttribute('data-hole-x'),'-5');assert.equal(await gp.locator('#task-graph [data-hole-y]').getAttribute('data-hole-y'),'-5');
 await gp.getByText('Мои записи к задаче',{exact:true}).click();await gp.locator('#notebook').fill('Вычеркнутая точка (−5;−5)');await gp.reload();await gp.waitForSelector('#final-answer');
 assert.equal(await gp.locator('#final-answer').inputValue(),'0,5;-2,5;-5');assert.equal(await gp.locator('#task-graph circle').count(),1);assert.equal(await gp.locator('#notebook').inputValue(),'Вычеркнутая точка (−5;−5)');
 await gp.screenshot({path:path.join(shots,'constructed-38a.png'),fullPage:true});await gp.locator('#answer-form button[type=submit]').click();assert(await gp.evaluate(()=>window.MakarychevApp.getState().tasks['p02-ex038-а'].correct));
 await graphNav('p02-ex038-б');await gp.locator('#final-answer').fill('1;0;3;-3');assert.equal(await gp.locator('#task-graph circle').count(),2);await gp.locator('#answer-form button[type=submit]').click();assert(await gp.evaluate(()=>window.MakarychevApp.getState().tasks['p02-ex038-б'].independent));await gp.screenshot({path:path.join(shots,'constructed-38b.png'),fullPage:true});
 await graphNav('p02-ex041-');assert.equal(await gp.locator('#task-graph figure').count(),4);assert.equal(await gp.locator('#task-graph figure:nth-child(2) circle').count(),0);assert.equal(await gp.locator('#task-graph figure:nth-child(4) circle').getAttribute('data-hole-x'),'1');
 await gp.getByRole('button',{name:'Увеличить график 4',exact:true}).click();assert(await gp.locator('dialog').evaluate(d=>d.open));assert.equal(await gp.locator('dialog circle').getAttribute('data-hole-x'),'1');await gp.screenshot({path:path.join(shots,'source-figure2-zoom.png'),fullPage:true});await gp.getByRole('button',{name:'Вернуться к выбору',exact:true}).click();await gp.locator('dialog').waitFor({state:'detached'});assert.equal(await gp.locator('dialog').count(),0);
 await gp.locator('[data-choice="1"]').click();await gp.locator('#answer-form button[type=submit]').click();assert(!await gp.evaluate(()=>window.MakarychevApp.getState().tasks['p02-ex041-'].correct),'unpunctured line rejected');await gp.locator('[data-choice="3"]').click();await gp.locator('#answer-form button[type=submit]').click();assert(await gp.evaluate(()=>window.MakarychevApp.getState().tasks['p02-ex041-'].correct));
 await gc.close();
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({status:'PASS',views,walkedSteps:walked,searchNumbers:30,viewports:[320,390,768,1280],flows:['all source prompts','all new steps','number search','old deep links','draft reload','graph line/holes/rejected omission','assisted credit','mobile task menu']}));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
