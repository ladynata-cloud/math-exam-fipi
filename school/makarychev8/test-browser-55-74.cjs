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
const newTasks=JSON.parse(fs.readFileSync(path.join(__dirname,'exercises-55-74.json'),'utf8'));
const counts=[4,4,4,6,6,2,2,2,6,6,2,2,2,4,4,2,1,4,8,4];
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
  // All 73 added prompts, at each viewport. Task navigation opens on demand.
  for(let i=0;i<newTasks.length;i++){
   const t=newTasks[i];await nav('#lesson/p03/'+(i+6));
   const box=await page.locator('.prompt').boundingBox();assert(box&&box.y+box.height<=900,t.id+' condition below first screen at '+width);
   assert(box.x>=0&&box.x+box.width<=width+1,t.id+' prompt outside screen');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),t.id+' horizontal page overflow at '+width);
   assert.equal(await page.locator('.task-menu').evaluate(el=>el.open),width>900,'menu default at '+width);
   assert.equal(await page.locator('.source-note').innerText(),'Из учебника: '+t.source.reference+', с. '+t.source.page);
   if(t.graph){const fig=await page.locator('#task-graph').boundingBox();if(!fig||fig.y+fig.height>900)await page.screenshot({path:path.join(shots,'layout-failure-'+t.id+'-'+width+'.png'),fullPage:true});assert(fig&&fig.y+fig.height<=900,t.id+' complete graph below first screen: '+JSON.stringify(fig));}
   if(['p03-ex055-б','p03-ex060-а','p03-ex062-данные','p03-ex066-б','p03-ex068-в','p03-ex070-натуральные','p03-ex071-','p03-ex072-в','p03-ex073-б','p03-ex074-в'].includes(t.id))await page.screenshot({path:path.join(shots,t.id+'-'+width+'.png'),fullPage:true});
   views++;
  }
  await page.locator('.task-menu summary').click();assert(await page.locator('.task-menu').evaluate(el=>el.open)===!(width>900));
  if(width===320){
   // Every source number produces exactly its individual solution links.
   for(let n=55;n<=74;n++){
    await nav('#home');await page.locator('#exercise-number').fill(String(n));await page.locator('#number-form button').click();
    const links=page.locator('#number-result a.button:not(.quiet)');assert.equal(await links.count(),counts[n-55],'search №'+n);
    for(const href of await links.evaluateAll(els=>els.map(e=>e.getAttribute('href')))){
     const i=Number(href.split('/').at(-1));const ref=await page.evaluate(i=>window.MakarychevCourse.lessons[2].tasks[i].source.reference,i);
     assert.equal(Number(/№\s*(\d+)/.exec(ref)[1]),n,'search target №'+n);
    }
   }
   // The old p03 entry point and notebook retain their identity.
   await nav('#lesson/p03/0');await page.getByText('Мои записи к задаче',{exact:true}).click();await page.locator('#notebook').fill('Старая задача: запись сохранена');
   await page.locator('#final-answer').fill('(x+y)/3');await page.locator('#answer-form button[type=submit]').click();
   assert(await page.evaluate(()=>window.MakarychevApp.getState().tasks['p03-t01'].independent));
   // Work through every authored new step using actual browser input events.
   for(let i=0;i<newTasks.length;i++){
    const t=newTasks[i];await nav('#lesson/p03/'+(i+6));await page.locator('[data-action=guided]').click();
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
   assert(await page.evaluate(()=>window.MakarychevApp.getState().tasks['p03-ex074-г'].correct));
   await nav('#lesson/p03/0');assert.equal(await page.locator('#notebook').inputValue(),'Старая задача: запись сохранена');
  }
  await context.close();
 }
 // Fresh session checks errors that are mathematically plausible but incomplete.
 const context=await browser.newContext({viewport:{width:390,height:900}}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(String(e)));await page.goto(url);await page.waitForFunction(()=>window.MakarychevApp);
 const nav=async id=>{const i=newTasks.findIndex(t=>t.id===id);assert(i>=0);await page.evaluate(i=>{history.replaceState(null,'','#lesson/p03/'+(i+6));window.MakarychevApp.route();},i);};
 const submit=async (id,value,expected)=>{await page.locator('#final-answer').fill(value);await page.locator('#answer-form button[type=submit]').click();assert.equal(Boolean(await page.evaluate(id=>window.MakarychevApp.getState().tasks[id].correct,id)),expected,id+' answer '+value);};
 await nav('p03-ex063-б');await submit('p03-ex063-б','(a-6)/(c-3)',false);await submit('p03-ex063-б','(a+6)/(c-3)',true);
 await nav('p03-ex066-б');await submit('p03-ex066-б','(x+5)/(x-5)^2',false);await submit('p03-ex066-б','1/(x-5)',true);
 await nav('p03-ex068-в');await submit('p03-ex068-в','(x^2+6y^2)/(2xy)',false);await submit('p03-ex068-в','x^2/(2xy)+6y^2/(2xy)',true);
 await nav('p03-ex070-натуральные');await submit('p03-ex070-натуральные','1;2;3',false);await submit('p03-ex070-натуральные','-6;-3;-2;-1;1;2;3;6',false);await submit('p03-ex070-натуральные','6;3;2;1',true);
 await nav('p03-ex071-');await submit('p03-ex071-','1;11',false);await submit('p03-ex071-','-11;-1;0;1;11',false);
 await page.locator('#final-answer').fill('11;-11;1;-1');await page.getByText('Мои записи к задаче',{exact:true}).click();await page.locator('#notebook').fill('Проверяю отрицательные делители. Ноль исключён.');
 await page.reload();await page.waitForSelector('#final-answer');assert.equal(await page.locator('#final-answer').inputValue(),'11;-11;1;-1');assert.equal(await page.locator('#notebook').inputValue(),'Проверяю отрицательные делители. Ноль исключён.');
 await page.screenshot({path:path.join(shots,'integer-71-draft.png'),fullPage:true});await submit('p03-ex071-','11;-11;1;-1',true);
 await nav('p03-ex074-в');await submit('p03-ex074-в','-12',false);await submit('p03-ex074-в','-12;0',true);
 await context.close();assert.deepEqual(errors,[]);
 console.log(JSON.stringify({status:'PASS',views,walkedSteps:walked,searchNumbers:20,viewports:[320,390,768,1280],flows:['all source prompts','all new steps','number search','old deep links','draft reload','wrong signs','split form required','complete integer sets','original domain preserved','assisted credit']}));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
