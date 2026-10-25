// Real Chromium layout and learner-flow checks; screenshots are review evidence.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'artifacts/vilenkin6-textbook');
const units=['A','B','C','D'].flatMap(x=>JSON.parse(fs.readFileSync(path.join(root,`courses/vilenkin-6-part-1/textbook-data/units-${x}.json`))));
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.pdf':'application/pdf'};
const server=http.createServer((req,res)=>{let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch(_){res.writeHead(400).end();return}let file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}if(name.endsWith('/'))file=path.join(file,'index.html');fs.readFile(file,(err,body)=>{if(err){res.writeHead(404).end();return}res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'}).end(body)});});
let browser;
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}/courses/vilenkin-6-part-1/`;
 fs.mkdirSync(out,{recursive:true});browser=await chromium.launch({headless:true,...(process.env.VILENKIN_CHROMIUM_PATH?{executablePath:process.env.VILENKIN_CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--single-process']}: {})});
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.waitForFunction(()=>window.VilenkinTextbook?.ready);
 assert(page.url().includes('/textbook.html'),'public entry must load revised edition');
 assert.equal(await page.locator('.topic-card').count(),24);
 await page.screenshot({path:path.join(out,'desktop-topics.png'),fullPage:true});
 const nav=async(u,t)=>{
   const hash=`#unit/${u.id}${t?'/task/'+encodeURIComponent(t.id):''}`;
   await page.evaluate(h=>{location.hash=h;window.dispatchEvent(new HashChangeEvent('hashchange'));},hash);
   await page.locator(t?'.condition':'.task-groups').waitFor();
 };
 let views=0;
 for(const width of [1280,390]){
   await page.setViewportSize({width,height:900});
   for(const u of units){
     await nav(u);assert.equal(await page.locator('.task-groups').count(),1);
     for(const t of u.tasks){
       await nav(u,t);views++;
       assert.equal(await page.locator('.condition .prompt').count(),1,t.id);
       assert.equal(await page.locator('.condition a[href^="textbook.pdf#page="]').count(),1,t.id);
       if(t.visual?.type==='image'){
         await page.waitForFunction(()=>[...document.querySelectorAll('.task-image')].every(i=>i.complete&&i.naturalWidth>0));
       }
       const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
       assert(!overflow,`${t.id} horizontal page overflow at ${width}`);
       const label=page.locator('label[for="answer"]');
       if(await label.count())assert((await label.innerText()).length>12,t.id+': generic answer label');
     }
   }
 }
 const u=units.find(x=>x.id===11),t=u.tasks[1];await nav(u,t);
 const taskLocation=page.url();await page.locator('.skip-link').focus();await page.keyboard.press('Enter');
 assert.equal(page.url(),taskLocation,'keyboard skip link must preserve the current task');
 assert(await page.evaluate(()=>document.activeElement===document.getElementById('main')));
 const first=t.steps[0],firstAnswer=Array.isArray(first.answer)?first.answer[0]:first.answer;
 await page.locator('#answer').fill(firstAnswer);await page.locator('#answer-form').evaluate(f=>f.requestSubmit());
 assert.equal(await page.locator('.step-history li').count(),1);
 await page.locator('#answer').fill('17');await page.locator('[data-action="hint"]').click();
 assert.equal(await page.locator('#answer').inputValue(),'17');
 await page.reload();await page.waitForFunction(()=>window.VilenkinTextbook?.ready);
 assert.equal(await page.locator('.step-history li').count(),1);assert.equal(await page.locator('#answer').inputValue(),'17');
 await page.screenshot({path:path.join(out,'mobile-retained-steps.png'),fullPage:true});
 for(const [id,name] of [[17,'complex-fraction'],[22,'symmetry']]){
   const unit=units.find(u=>u.id===id),task=unit.tasks.find(t=>t.visual?.type==='image');
   await page.setViewportSize({width:1280,height:900});await nav(unit,task);
   await page.locator('.task-image').waitFor();await page.screenshot({path:path.join(out,name+'.png'),fullPage:true});
 }
 await page.goto(base+'?learning=1');await page.waitForLoadState('domcontentloaded');
 assert(!page.url().includes('textbook.html'),'managed entry must retain legacy contract');
 assert.deepEqual(errors,[]);
 const result={status:'PASS',gate:'VILENKIN6_TEXTBOOK_BROWSER_OK',viewports:[1280,390],taskViews:views,flows:['public default','all source figures load','no page overflow','keyboard skip preserves task','step/hint/draft reload','managed entry preserved'],screenshots:4};
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close();server.close()});
