/* A real Chromium check; no claims about real student effectiveness. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(data);});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/school/index.html';
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,headless:true,args:['--no-sandbox']});
 try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('BROWSER:',e.message);});
 const go=async hash=>{await page.goto(base+'#'+hash);await page.locator('h1').waitFor();};
 await go('books');assert.equal(await page.evaluate(()=>WorkshopCurriculum.sources.length),77);
 await page.locator('#book-search').fill('Рубин');assert(await page.locator('.card').count()>=5);
 await go('book/source-64');await page.locator('[data-cmd=learn]').first().waitFor();
 const ids=await page.evaluate(()=>WorkshopCurriculum.lessons.filter(l=>/^(sec-|alg-)/.test(l.id)).map(l=>l.id));assert.equal(ids.length,30);
 await page.evaluate(()=>localStorage.setItem('older-trainer-sentinel','preserve'));
 for(const id of ids){
  await go('lesson/'+id);assert.equal(await page.locator('.alg-theory h2').count(),3,id);await page.locator('#model svg').waitFor();
  const range=page.locator('#model input[type=range]').first();if(await range.count()){await range.focus();const before=await range.inputValue();await range.press('ArrowRight');assert.notEqual(await range.inputValue(),before,id+' keyboard');}
  const answers=await page.evaluate(id=>{const t=WorkshopMath.generate(id,0),fmt=a=>Array.isArray(a)?a.map(fmt).join(';'):typeof a==='object'?WorkshopMath.fmt(a):String(a);return [...t.steps,{answer:t.answer}].map(s=>fmt(s.answer));},id);
  for(let i=0;i<answers.length;i++){await page.locator('#answer').fill(answers[i]);await page.locator('#answer-form button').click();assert.equal(await page.locator('.feedback.error').count(),0,id+' step '+i);if(i<answers.length-1)await page.locator('[data-cmd=next]').click();}
 }
 await go('lesson/sec-logarithm');await page.locator('#answer').fill('черновик');await page.locator('[data-cmd=prerequisite]').first().click();await page.locator('[data-cmd=return]').click();assert.equal(await page.locator('#answer').inputValue(),'черновик');
 await go('lesson/sec-inequality');await page.locator('[data-cmd=mode][data-value=check]').click();
 const answer=async()=>page.evaluate(()=>{const s=JSON.parse(localStorage.getItem(WorkshopState.KEY)),t=WorkshopMath.generate(s.last.skill,s.last.seed),fmt=a=>Array.isArray(a)?a.map(fmt).join(';'):typeof a==='object'?WorkshopMath.fmt(a):String(a);return fmt(t.answer);});
 await page.locator('#answer').fill(await answer());await page.locator('#answer-form button').click();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(WorkshopState.KEY)).skills['sec-inequality'].checks.length),1);
 await page.locator('[data-cmd=next]').click();await page.locator('[data-cmd=hint]').click();await page.locator('#answer').fill(await answer());await page.locator('#answer-form button').click();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(WorkshopState.KEY)).skills['sec-inequality'].checks.length),1);
 await page.reload();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(WorkshopState.KEY)).skills['sec-inequality'].checks.length),1);assert.equal(await page.evaluate(()=>localStorage.getItem('older-trainer-sentinel')),'preserve');
 for(const width of [360,768,1280]){
  await page.setViewportSize({width,height:900});
  for(const route of ['books','book/source-64','lesson/sec-conditional','lesson/sec-parabola','lesson/sec-polynomial','teacher']){await go(route);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),width+' '+route);}
 }
 await page.emulateMedia({reducedMotion:'reduce'});await go('lesson/sec-outcomes');const before=await page.locator('.secondary-caption').innerText();await page.locator('#model input[type=range]').press('ArrowRight');assert.notEqual(await page.locator('.secondary-caption').innerText(),before);
 await page.setViewportSize({width:360,height:900});await go('lesson/sec-circle');fs.mkdirSync('/tmp/textbook-checks',{recursive:true});await page.screenshot({path:'/tmp/textbook-checks/mobile-circle.png',fullPage:true});
 await page.setViewportSize({width:1280,height:900});await go('lesson/sec-statistics');await page.screenshot({path:'/tmp/textbook-checks/statistics.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('PASS: Chromium; 30 guided paths and models; 77-book search; gap return; evidence preservation; 360/768/1280px; keyboard and reduced motion.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
