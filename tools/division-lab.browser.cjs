const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const D=require('../trainers/oge-basics/multiplication-division/division-lab-core.js');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(data);});});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port+'/trainers/oge-basics/multiplication-division/division-lab.html';
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const errors=[],legacy={'mathExamCourseProgress.v1':'{"legacy":"preserve","topics":{"longDivisionStepwise":{"total":7}}}','mathExamBasics.decimal-divisor-shift.v1':'{"independent":11}'};
 async function pageIn(context){const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('dialog',dialog=>dialog.accept());await page.addInitScript(legacy=>{for(const [key,value] of Object.entries(legacy))if(localStorage.getItem(key)===null)localStorage.setItem(key,value);},legacy);await page.goto(url);await page.locator('h1').waitFor();return page;}
 const state=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),D.KEY);
 async function start(page,level,mode='learn'){await page.locator('#level').selectOption(level);await page.locator('#'+mode).click();return state(page);}
 async function step(page){const s=await state(page),p=D.plan(s.session.task),action=p.actions[s.session.step];assert(action);await page.locator('#answer').fill(action.answer);await page.locator('#answer').press('Enter');assert.equal((await state(page)).session.step,s.session.step+1);assert.equal(await page.locator('#feedback.error').count(),0);}
 async function finish(page){for(let i=0;i<150;i++){const s=await state(page);if(s.session.step===D.plan(s.session.task).actions.length)return s;await step(page);}throw Error('Did not finish');}
 async function preserved(page){assert.deepEqual(await page.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),Object.keys(legacy)),legacy);}
 const shots=process.env.DIVISION_SHOTS;if(shots)fs.mkdirSync(shots,{recursive:true});
 for(const width of [360,768,1280]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await pageIn(context);
  for(const level of width===1280?Object.keys(D.levels):['zero','decimalDivisor']){
   await start(page,level);
   if(level==='decimalDivisor'){assert.equal(await page.locator('.division').count(),0);for(let i=0;i<4;i++)await step(page);assert.equal(await page.locator('.division').count(),1);}
   const result=await finish(page);assert.equal(result.records.at(-1).independent,false);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,width+' '+level);
   if(shots&&['zero','decimalDivisor'].includes(level))await page.screenshot({path:path.join(shots,width+'-'+level+'.png'),fullPage:true});
  }
  await preserved(page);await context.close();
 }
 console.log('All seven levels completed by typing each stage; decimal normalization waits for both operands; 360/768/1280 layouts and legacy storage: PASS');

 const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await pageIn(context);
 await start(page,'zero','check-mode');let s=await finish(page);assert.equal(s.records.at(-1).independent,true);
 await start(page,'zero','check-mode');const beforeHelp=(await state(page)).session.step;await page.locator('#reveal').click();assert.equal((await state(page)).session.step,beforeHelp);s=await finish(page);assert.equal(s.records.at(-1).independent,false);assert.equal(s.records.at(-1).reveals,1);
 await start(page,'zero','check-mode');await page.locator('#answer').fill('999999');await page.locator('#answer').press('Enter');assert.equal((await state(page)).session.step,0);assert.equal(await page.locator('#feedback.error').count(),1);s=await finish(page);assert.equal(s.records.at(-1).independent,false);assert.equal(s.records.at(-1).errors,1);
 assert.equal(s.records.filter(r=>r.independent).length,1);
 console.log('A reveal does not advance the stage; errors and help never become a first independent success: PASS');

 await start(page,'decimalDivisor');await step(page);await page.locator('#answer').fill('10');const beforeReload=await state(page);await page.reload();assert.equal(await page.locator('#answer').inputValue(),'10');assert.deepEqual(await state(page),beforeReload);
 const [backup]=await Promise.all([page.waitForEvent('download'),page.locator('#backup').click()]);const backupText=fs.readFileSync(await backup.path(),'utf8');assert.deepEqual(JSON.parse(backupText),beforeReload);
 await step(page);assert.notDeepEqual(await state(page),beforeReload);
 await page.locator('#import').click();await page.locator('#file').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(backupText)});await page.locator('#notice').filter({hasText:'Копия восстановлена'}).waitFor();assert.deepEqual(await state(page),beforeReload);assert.equal(await page.locator('#answer').inputValue(),'10');
 const beforeBad=await page.evaluate(key=>localStorage.getItem(key),D.KEY);await page.locator('#import').click();await page.locator('#file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"schema":"other"}')});await page.locator('#notice').filter({hasText:'Файл не загружен'}).waitFor();assert.equal(await page.evaluate(key=>localStorage.getItem(key),D.KEY),beforeBad);
 await page.locator('#alias').fill('Ученик <example>');const [report]=await Promise.all([page.waitForEvent('download'),page.locator('#report').click()]);const data=JSON.parse(fs.readFileSync(await report.path(),'utf8'));assert.equal(data.alias,'Ученик <example>');assert.equal(data.independent,1);
 await preserved(page);
 console.log('Typed input and exact stage survive reload, backup and restore; malformed imports preserve data; report exports honest evidence: PASS');

 const other=await context.newPage();await other.goto(url);await other.locator('#practice').click();await page.locator('#notice').filter({hasText:'другой вкладке'}).waitFor();const external=await other.evaluate(key=>localStorage.getItem(key),D.KEY);await page.locator('#answer').fill('123');await page.locator('#answer').press('Enter');assert.equal(await other.evaluate(key=>localStorage.getItem(key),D.KEY),external);await preserved(page);
 await context.close();
 const brokenContext=await browser.newContext(),broken=await pageIn(brokenContext);await broken.evaluate(key=>localStorage.setItem(key,'{broken-original'),D.KEY);await broken.reload();await broken.locator('#notice').filter({hasText:'не удалось прочитать'}).waitFor();await broken.locator('#learn').click();assert.equal(await broken.evaluate(key=>localStorage.getItem(key),D.KEY),'{broken-original');
 const [raw]=await Promise.all([broken.waitForEvent('download'),broken.locator('#raw').click()]);assert.equal(fs.readFileSync(await raw.path(),'utf8'),'{broken-original');await broken.locator('#reset').click();assert.deepEqual(await state(broken),D.blank());await preserved(broken);await brokenContext.close();
 console.log('Cross-tab conflict blocks stale writes; corrupt source exports byte-for-byte; explicit new record touches no legacy data: PASS');
 const offlineContext=await browser.newContext({offline:true}),offline=await offlineContext.newPage();const offlineRequests=[];offline.on('request',r=>{if(/^https?:/.test(r.url()))offlineRequests.push(r.url());});offline.on('pageerror',e=>errors.push(e.message));await offline.goto('file://'+path.join(root,'trainers/oge-basics/multiplication-division/division-lab.html'));await start(offline,'appendZeros');await finish(offline);assert.deepEqual(offlineRequests,[]);await offlineContext.close();
 console.log('Offline file:// completion with no external requests: PASS');
 assert.deepEqual(errors,[]);await browser.close();await new Promise(resolve=>server.close(resolve));
})().catch(e=>{console.error(e);process.exit(1);});
