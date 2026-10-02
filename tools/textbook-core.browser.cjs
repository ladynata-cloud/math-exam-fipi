// Real Chromium interactions; this is automated simulation, not learner research.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');fs.readFile(file,(e,data)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(data);});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/school/index.html';
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,headless:true,args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[],bad=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)bad.push(r.url());});
 const go=async hash=>{await page.goto(base+'#'+hash);await page.locator('h1').waitFor();};
 const answer=()=>page.evaluate(()=>{const s=JSON.parse(localStorage.getItem(WorkshopState.KEY)),t=WorkshopMath.generate(s.last.skill,s.last.seed),fmt=a=>Array.isArray(a)?a.map(fmt).join(';'):typeof a==='object'?WorkshopMath.fmt(a):String(a);return fmt(t.answer);});
 await go('courses');assert.equal(await page.locator('a[href^="#course/"]').count(),12);
 await page.evaluate(()=>{localStorage.setItem('legacy-sentinel','untouched');const s=WorkshopState.blank();WorkshopState.result(s,{skill:'fraction',mode:'check',correct:true,assisted:false,exposed:false,attempt:1,time:100,fingerprint:'old'});WorkshopState.save(localStorage,s);});
 await page.reload();
 const ids=await page.evaluate(()=>WorkshopCoreContent.rows.map(r=>'core-'+r[0]));assert.equal(ids.length,48);
 for(const id of ids){
  await go('lesson/'+id);assert.equal(await page.locator('.alg-theory h2').count(),3,id);await page.locator('#model svg').waitFor();
  const slider=page.locator('#model input[type=range]'),before=await slider.inputValue();await slider.focus();await slider.press('ArrowRight');assert.notEqual(await slider.inputValue(),before,id+' keyboard');
  await page.locator('#model [data-shift="-1"]').click();assert.equal(await slider.inputValue(),before);
  const modelAnswer=await page.evaluate(id=>{const r=WorkshopCoreContent.rows.find(r=>'core-'+r[0]===id),p=Number(document.querySelector('#model input[type=range]').value);return {family:r[4],p};},id);
  // Deliberately incorrect prediction must not grant progress.
  await page.locator('#model .core-prediction input').fill('не знаю');await page.locator('#model .core-prediction button').click();assert((await page.locator('#model [role=status]').innerText()).includes('Проверь'));
  const steps=await page.evaluate(id=>{const t=WorkshopMath.generate(id,0),fmt=a=>Array.isArray(a)?a.map(fmt).join(';'):typeof a==='object'?WorkshopMath.fmt(a):String(a);return [...t.steps,{answer:t.answer}].map(s=>fmt(s.answer));},id);
  for(let i=0;i<steps.length;i++){await page.locator('#answer').fill(steps[i]);await page.locator('#answer-form button').click();assert.equal(await page.locator('.feedback.error').count(),0,id+' step '+i);if(i<steps.length-1)await page.locator('[data-cmd=next]').click();}
 }
 await go('course/8');await page.locator('[data-cmd=learn]').first().click();assert((await page.locator('.lesson-head a').first().innerText()).includes('8 класс'));await page.reload();assert((await page.locator('.lesson-head a').first().innerText()).includes('8 класс'));
 await go('lesson/core-fraction-divide');await page.locator('#answer').fill('черновик');await page.locator('[data-cmd=prerequisite]').first().click();await page.locator('[data-cmd=return]').click();assert.equal(await page.locator('#answer').inputValue(),'черновик');
 await go('course/7');await page.locator('[data-cmd=course-diagnostic]').click();for(let i=0;i<8;i++)await page.locator('[data-cmd=skip]').click();assert((await page.locator('h1').innerText()).includes('Отправная'));assert.equal(await page.locator('.skill-row').count(),8);
 await go('course/7');await page.locator('[data-cmd=learn][data-value="core-work"]').click();await page.locator('[data-cmd=mode][data-value=check]').click();
 for(let i=0;i<3;i++){await page.locator('#answer').fill(await answer());await page.locator('#answer-form button').click();await page.locator('[data-cmd=next]').click();}
 await page.waitForFunction(()=>document.querySelector('h1')?.textContent.includes('Мой прогресс'));assert((await page.locator('h1').innerText()).includes('Мой прогресс'));assert.equal(await page.locator('a[href="#course/7"]').count(),1);
 const count=await page.evaluate(()=>JSON.parse(localStorage.getItem(WorkshopState.KEY)).skills['core-work'].checks.length);assert(count>=2);
 await go('lesson/core-work');await page.locator('[data-cmd=mode][data-value=check]').click();await page.locator('[data-cmd=hint]').click();await page.locator('#answer').fill(await answer());await page.locator('#answer-form button').click();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(WorkshopState.KEY)).skills['core-work'].checks.length),count);
 await go('teacher');await page.locator('#group-name').fill('Пробная группа');await page.locator('[data-cmd=new-group]').click();await page.locator('input[name=skills][value="core-rational-inequality"]').check();await page.locator('input[name=skills][value="core-work"]').check();await page.locator('[data-cmd=assignment]').click();const code=await page.locator('#generated-code').inputValue();assert(code.length>20);
 await go('home');await page.locator('#assignment-code').fill(code);await page.locator('[data-cmd=load-code]').click();assert((await page.locator('.featured').first().innerText()).includes('Совместная работа'));await page.locator('[data-cmd=leave-assignment]').click();
 for(const width of [360,768,1280]){await page.setViewportSize({width,height:900});for(const hash of ['courses','course/8','lesson/core-work','lesson/core-trig-identity','lesson/core-log-inequality','progress','teacher']){await go(hash);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),width+' '+hash);}}
 await page.emulateMedia({reducedMotion:'reduce'});await go('lesson/core-derivative-rule');await page.locator('#model input[type=range]').press('ArrowRight');
 await page.evaluate(()=>document.body.style.zoom='2');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'200% zoom');await page.evaluate(()=>document.body.style.zoom='1');
 assert.equal(await page.evaluate(()=>localStorage.getItem('legacy-sentinel')),'untouched');assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(WorkshopState.KEY)).skills.fraction.checks.length),1);
 fs.mkdirSync('/tmp/school-core-checks',{recursive:true});await page.setViewportSize({width:1280,height:900});await go('courses');await page.screenshot({path:'/tmp/school-core-checks/courses.png',fullPage:true});await page.setViewportSize({width:360,height:900});await go('lesson/core-work');await page.screenshot({path:'/tmp/school-core-checks/mobile-work.png',fullPage:true});await go('lesson/core-trig-identity');await page.screenshot({path:'/tmp/school-core-checks/mobile-circle.png',fullPage:true});
 await page.evaluate(()=>localStorage.setItem(WorkshopState.KEY,'{"broken":'));await page.reload();assert((await page.locator('#notice').innerText()).length>0);await page.locator('[data-cmd=mode][data-value=check]').click();await page.locator('#answer').fill('0');await page.locator('#answer-form button').click();assert.equal(await page.evaluate(()=>localStorage.getItem(WorkshopState.KEY)),'{"broken":');
 assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);console.log('PASS Chromium: 48 lesson/model/step flows; 12 routes; diagnosis; course resume; prerequisite return; independent/help evidence; teacher assignment; 360/768/1280px, 200% zoom, keyboard, reduced motion, legacy/corrupt storage.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
