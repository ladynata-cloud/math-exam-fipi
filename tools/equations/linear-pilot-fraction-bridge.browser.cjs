'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'artifacts/linear-pilot'),pilot='/equations/linear-pilot/',anchor=pilot+'#fraction-bridge';
async function serve(){
 const server=http.createServer(async(req,res)=>{
  try{const u=new URL(req.url,'http://localhost');let file=path.resolve(root,'.'+decodeURIComponent(u.pathname));
   if(file!==root&&!file.startsWith(root+path.sep))throw Error('outside');
   if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');
   const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'};
   res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'}).end(await fs.readFile(file));
  }catch(_){res.writeHead(404).end();}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});return server;
}
const click=(page,text)=>page.locator('#fraction-bridge-app').getByRole('button',{name:text,exact:true}).click();
async function exercise(browser,base,width){
 const context=await browser.newContext({viewport:{width,height:900}});
 await context.route('**/*',r=>r.request().url().startsWith(base+'/')?r.continue():r.abort());
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+anchor);const app=page.locator('#fraction-bridge-app');await app.waitFor({state:'visible'});
  assert.equal(await app.getAttribute('data-phase'),'original');
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('mathExam.linearFractionBridge.session.v1')),null,'do not write an empty snapshot for a visit');const original=await app.locator('[data-fb-original]').innerText();
  assert.equal(original,'x/4 + 3 = 8');
  assert.equal(await app.getByText('Что хочется проверить?').count(),0);
  assert.equal(await app.getByRole('button',{name:'Новая текстовая задача на перенос'}).count(),0);
  await page.evaluate(()=>localStorage.setItem('unrelated-existing-test','keep'));
  await page.locator('#fb-answer').fill('abc');await click(page,'Проверить ответ');assert.match(await app.innerText(),/Введи целое число/);
  await page.locator('#fb-answer').fill('7');await click(page,'Проверить ответ');
  assert.match(await app.innerText(),/Причина пока неизвестна/);
  await page.locator('#fb-answer').fill('19');await click(page,'Восстановить целое по одной доле');
  assert.equal(await app.getAttribute('data-phase'),'probe');
  await page.locator('#fb-answer').fill('5');await click(page,'Проверить ответ');
  assert.match(await app.innerText(),/Ответ в этой пробе не совпал/);
  await click(page,'Добавить такую же часть');assert.match(await app.innerText(),/Собрали целое: 2 × 11 = 22/);
  await page.screenshot({path:path.join(out,'fraction-bridge-probe-'+width+'.png')});
  const popupPromise=context.waitForEvent('page');await app.locator('[data-fb-resource="oge-basics:fraction-meaning"]').click();const popup=await popupPromise;
  await popup.waitForLoadState('domcontentloaded');assert.equal(new URL(popup.url()).pathname,'/trainers/oge-basics/fraction-meaning.html');await popup.close();
  await click(page,'Вернуться к исходной задаче');assert.equal(await app.locator('[data-fb-original]').innerText(),original);assert.equal(await page.locator('#fb-answer').inputValue(),'19');
  await page.reload();await app.waitFor({state:'visible'});assert.equal(await page.locator('#fb-answer').inputValue(),'19');
  await page.locator('#fb-answer').fill('20');await click(page,'Проверить ответ');assert.match(await app.innerText(),/верен после исправления с отмеченной помощью/);
  await click(page,'Новая текстовая задача на перенос');assert.equal(await app.getAttribute('data-phase'),'transfer');assert.match(await app.innerText(),/9 м — это 2 м и треть длины ленты/);
  assert.equal(await app.locator('[data-fb-resource]').count(),0);assert(!((await app.innerText()).includes('x/3 + 2 = 9')));
  await page.screenshot({path:path.join(out,'fraction-bridge-transfer-'+width+'.png')});
  await page.locator('#fb-answer').fill('21');await click(page,'Проверить ответ');assert.equal(await app.getAttribute('data-phase'),'result');assert.match(await app.innerText(),/с первой попытки, помощь не отмечена/);assert.match(await app.innerText(),/не доказывает освоение/);
  assert.equal(await app.locator('form').count(),0);
  await page.reload();await app.waitFor({state:'visible'});assert.equal(await app.getAttribute('data-phase'),'result');assert.equal(await app.locator('form').count(),0);
  await click(page,'Перейти к другой паре');assert.equal(await app.getAttribute('data-pair'),'bridge-02');
  await page.locator('#fb-answer').fill('18');await page.locator('#fb-external').check();await click(page,'Проверить ответ');assert.match(await app.innerText(),/помощь или знакомый разбор отмечены/);
  assert.equal(await page.evaluate(()=>localStorage.getItem('unrelated-existing-test')),'keep');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'horizontal overflow '+width);
  assert.deepEqual(errors,[]);
 }finally{await context.close();}
}
async function draftHelpRegression(browser,base,width){
 const context=await browser.newContext({viewport:{width,height:900}});
 await context.route('**/*',r=>r.request().url().startsWith(base+'/')?r.continue():r.abort());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const app=page.locator('#fraction-bridge-app'),answer=page.locator('#fb-answer'),external=page.locator('#fb-external');
 const read=()=>page.evaluate(()=>JSON.parse(sessionStorage.getItem('mathExam.linearFractionBridge.session.v1')));
 try{
  await page.goto(base+anchor);await app.waitFor({state:'visible'});
  for(const [phase,valid,invalid,key] of [['original','20','x=20','bridge-01:original'],['transfer','21','x=21','bridge-01:transfer']]){
   assert.equal(await app.getAttribute('data-phase'),phase);
   await answer.fill('19');const before=await read();
   await answer.fill(invalid);await external.check();
   assert.match(await app.locator('[data-fb-message]').innerText(),/отметка помощи сохранится/);
   const after=await read();assert.deepEqual(after.drafts[key],{value:'',external:true});
   assert.deepEqual(after.events,before.events);assert(!JSON.stringify(after).includes(invalid));
   await external.uncheck();assert.deepEqual((await read()).drafts[key],{value:'',external:false});
   await external.check();await page.reload();await app.waitFor({state:'visible'});
   assert.equal(await answer.inputValue(),'');assert(await external.isChecked());
   await answer.fill(valid);assert.deepEqual((await read()).drafts[key],{value:valid,external:true});
   await click(page,'Проверить ответ');assert.match(await app.innerText(),/помощь или знакомый разбор отмечены/);
   if(phase==='original')await click(page,'Новая текстовая задача на перенос');
  }
  await click(page,'Перейти к другой паре');await click(page,'Пока не знаю');
  await click(page,'Восстановить целое по одной доле');
  assert.equal(await app.getAttribute('data-phase'),'probe');assert.equal(await external.count(),0);
  await answer.fill('12');const before=await read();
  await answer.fill('x=12');const after=await read();
  assert.match(await app.locator('[data-fb-message]').innerText(),/поле будет пустым/);
  assert(!((await app.locator('[data-fb-message]').innerText()).includes('отметка помощи')));
  assert.deepEqual(after.drafts['bridge-02:probe:whole'],{value:'',external:false});
  assert.deepEqual(after.events,before.events);assert(!JSON.stringify(after).includes('x=12'));
  await page.reload();await app.waitFor({state:'visible'});
  assert.equal(await app.getAttribute('data-phase'),'probe');assert.equal(await answer.inputValue(),'');
  assert.equal(await external.count(),0);assert.deepEqual(errors,[]);
 }finally{await context.close();}
}
async function edgeCases(browser,base){
 const context=await browser.newContext({viewport:{width:320,height:900},javaScriptEnabled:false});await context.route('**/*',r=>r.request().url().startsWith(base+'/')?r.continue():r.abort());
 const page=await context.newPage();await page.goto(base+anchor);await page.locator('#fraction-bridge>summary').click().catch(()=>{});
 if(!(await page.locator('#fraction-bridge-fallback').isVisible()))await page.locator('#fraction-bridge>summary').click();
 assert(await page.locator('#fraction-bridge-fallback a[href="/trainers/oge-basics/fraction-meaning.html"]').isVisible());assert(await page.locator('#fraction-bridge-app').isHidden());await context.close();
 const denied=await browser.newContext();await denied.route('**/*',r=>r.request().url().startsWith(base+'/')?r.continue():r.abort());
 await denied.addInitScript(()=>Object.defineProperty(window,'sessionStorage',{get(){throw Error('denied')}}));
 const d=await denied.newPage();await d.goto(base+anchor);await d.locator('#fraction-bridge-app').waitFor({state:'visible'});
 assert.match(await d.locator('#fraction-bridge-storage').innerText(),/недоступно/);
 await d.locator('#fb-answer').fill('x=20');await d.locator('#fb-external').check();
 assert.match(await d.locator('#fraction-bridge-app [data-fb-message]').innerText(),/сохранение в этой вкладке недоступно/);
 await click(d,'Пока не знаю');assert(await d.locator('#fraction-bridge-app').getByText('Что хочется проверить?').isVisible());await denied.close();
 const corrupt=await browser.newContext();await corrupt.route('**/*',r=>r.request().url().startsWith(base+'/')?r.continue():r.abort());
 await corrupt.addInitScript(()=>sessionStorage.setItem('mathExam.linearFractionBridge.session.v1','{"version":999}'));
 const c=await corrupt.newPage();await c.goto(base+anchor);await c.locator('#fraction-bridge-app').waitFor({state:'visible'});
 await c.locator('#fb-answer').fill('x=20');await c.locator('#fb-external').check();await click(c,'Пока не знаю');
 assert.equal(await c.evaluate(()=>sessionStorage.getItem('mathExam.linearFractionBridge.session.v1')),'{"version":999}');await corrupt.close();
}
(async()=>{await fs.mkdir(out,{recursive:true});const server=await serve();const base=process.env.PILOT_BASE_URL||'http://127.0.0.1:'+server.address().port;let browser;
 try{browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH});for(const width of [320,390,1280]){await exercise(browser,base,width);await draftHelpRegression(browser,base,width);}await edgeCases(browser,base);console.log('FRACTION_BRIDGE_BROWSER_OK: exact return, draft, linked existing lesson, transfer, no-JS and storage denial');}
 finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
