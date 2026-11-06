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
const newTasks=JSON.parse(fs.readFileSync(path.join(__dirname,'exercises-75-109.json'),'utf8'));
const counts=[8,4,2,6,4,4,4,8,4,6,4,6,4,4,2,2,2,6,2,2,4,4,2,4,4,2,2,5,1,2,3,2,6,2,1];
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
  // All 126 added prompts, at each viewport. Task navigation opens on demand.
  for(let i=0;i<newTasks.length;i++){
   const t=newTasks[i];await nav('#lesson/p04/'+(i+6));
   const box=await page.locator('.prompt').boundingBox();assert(box&&box.y+box.height<=900,t.id+' condition below first screen at '+width);
   assert(box.x>=0&&box.x+box.width<=width+1,t.id+' prompt outside screen');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),t.id+' horizontal page overflow at '+width);
   assert.equal(await page.locator('.task-menu').evaluate(el=>el.open),width>900,'menu default at '+width);
   assert.equal(await page.locator('.source-note').innerText(),'Из учебника: '+t.source.reference+', с. '+t.source.page);
   if(t.graph){const fig=await page.locator('#task-graph').boundingBox();if(!fig||fig.y+fig.height>900)await page.screenshot({path:path.join(shots,'layout-failure-'+t.id+'-'+width+'.png'),fullPage:true});assert(fig&&fig.y+fig.height<=900,t.id+' complete graph below first screen: '+JSON.stringify(fig));}
   if(['p04-ex078-в','p04-ex089-а','p04-ex097-б','p04-ex101-а','p04-ex102-а','p04-ex103-','p04-ex104-сумма','p04-ex105-формула','p04-ex108-графики','p04-ex108-пересечение','p04-ex109-'].includes(t.id))await page.screenshot({path:path.join(shots,t.id+'-'+width+'.png'),fullPage:true});
   views++;
  }
  await page.locator('.task-menu summary').click();assert(await page.locator('.task-menu').evaluate(el=>el.open)===!(width>900));
  if(width===320){
   // Every source number produces exactly its individual solution links.
   for(let n=75;n<=109;n++){
    await nav('#home');await page.locator('#exercise-number').fill(String(n));await page.locator('#number-form button').click();
    const links=page.locator('#number-result a.button:not(.quiet)');assert.equal(await links.count(),counts[n-75],'search №'+n);
    for(const href of await links.evaluateAll(els=>els.map(e=>e.getAttribute('href')))){
     const i=Number(href.split('/').at(-1));const ref=await page.evaluate(i=>window.MakarychevCourse.lessons[3].tasks[i].source.reference,i);
     assert.equal(Number(/№\s*(\d+)/.exec(ref)[1]),n,'search target №'+n);
    }
   }
   // The old p04 entry point and notebook retain their identity.
   await nav('#lesson/p04/0');await page.getByText('Мои записи к задаче',{exact:true}).click();await page.locator('#notebook').fill('Старая задача: запись сохранена');
   await page.locator('#final-answer').fill('(3x+2y)/6');await page.locator('#answer-form button[type=submit]').click();
   assert(await page.evaluate(()=>window.MakarychevApp.getState().tasks['p04-t01'].independent));
   // Work through every authored new step using actual browser input events.
   for(let i=0;i<newTasks.length;i++){
    const t=newTasks[i];await nav('#lesson/p04/'+(i+6));await page.locator('[data-action=guided]').click();
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
   assert(await page.evaluate(()=>window.MakarychevApp.getState().tasks['p04-ex109-'].correct));
   await nav('#lesson/p04/0');assert.equal(await page.locator('#notebook').inputValue(),'Старая задача: запись сохранена');
  }
  await context.close();
 }
 // Fresh session checks errors that are mathematically plausible but incomplete.
 const context=await browser.newContext({viewport:{width:390,height:900}}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(String(e)));await page.goto(url);await page.waitForFunction(()=>window.MakarychevApp);
 const nav=async id=>{const i=newTasks.findIndex(t=>t.id===id);assert(i>=0);await page.evaluate(i=>{history.replaceState(null,'','#lesson/p04/'+(i+6));window.MakarychevApp.route();},i);};
 const submit=async (id,value,expected)=>{await page.locator('#final-answer').fill(value);await page.locator('#answer-form button[type=submit]').click();assert.equal(Boolean(await page.evaluate(id=>window.MakarychevApp.getState().tasks[id].correct,id)),expected,id+' answer '+value);};
 await nav('p04-ex075-ж');await submit('p04-ex075-ж','3/(25a)',false);await submit('p04-ex075-ж','-3/(25a)',true);
 await nav('p04-ex075-б');await submit('p04-ex075-б','c/4-d/12',false);await submit('p04-ex075-б','(3c-d)/12',true);
 await nav('p04-ex102-ОДЗ-а');await submit('p04-ex102-ОДЗ-а','2',false);await submit('p04-ex102-ОДЗ-а','-2;0;2',false);await submit('p04-ex102-ОДЗ-а','2;-2',true);
 await nav('p04-ex104-сумма');await submit('p04-ex104-сумма','1/((x+1)(x+2))+1/((x+2)(x+3))+1/((x+3)(x+4))',false);await submit('p04-ex104-сумма','3/(x^2+5x+4)',true);
 assert.match(await page.locator('.feedback').last().innerText(),/−2.*−3/,'cancelled values remain excluded');
 await nav('p04-ex108-графики');assert.equal(await page.locator('#task-graph [data-k]').count(),0,'no prefilled student lines');
 await page.locator('#final-answer').fill('-4;1;2;3');assert.equal(await page.locator('#task-graph [data-k]').count(),2,'input constructs both lines');await submit('p04-ex108-графики','-4;1;2;3',false);
 await page.locator('#final-answer').fill('-4;1;2;-3');await page.getByText('Мои записи к задаче',{exact:true}).click();await page.locator('#notebook').fill('Проверяю две прямые на общей сетке.');
 await page.reload();await page.waitForSelector('#final-answer');assert.equal(await page.locator('#final-answer').inputValue(),'-4;1;2;-3');assert.equal(await page.locator('#notebook').inputValue(),'Проверяю две прямые на общей сетке.');
 const lines=await page.locator('#task-graph [data-k]').evaluateAll(nodes=>nodes.map(n=>Object.fromEntries(['data-k','data-b','x1','x2','y1','y2'].map(k=>[k,Number(n.getAttribute(k))]))));
 assert.equal(lines.length,2);for(const [i,line]of lines.entries())for(const end of ['1','2']){const x=(line['x'+end]-150)/31.5,y=(150-line['y'+end])/31.5;assert(Math.abs(y-([-4,2][i]*x+[1,-3][i]))<1e-9,'SVG endpoint lies on original source function');}
 await page.screenshot({path:path.join(shots,'pair-108-draft.png'),fullPage:true});await submit('p04-ex108-графики','-8/2;2/2;4/2;-6/2',true);
 await nav('p04-ex108-пересечение');await submit('p04-ex108-пересечение','(0,67;-1,67)',false);await submit('p04-ex108-пересечение','(2/3;-5/3)',true);
 await nav('p04-ex109-');await submit('p04-ex109-','21',false);await submit('p04-ex109-','63',true);
 await context.close();assert.deepEqual(errors,[]);
 console.log(JSON.stringify({status:'PASS',views,walkedSteps:walked,searchNumbers:35,viewports:[320,390,768,1280],flows:['all source prompts','all new steps','number search','old deep links','draft reload','wrong signs','single fraction required','original domain preserved','learner-built line pair','exact intersection','word-problem requested mass','assisted credit']}));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
