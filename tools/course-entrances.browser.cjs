'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),data=JSON.parse(fs.readFileSync(path.join(root,'content/course-entrances/topics.json')));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.gif':'image/gif','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');let f=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!f.startsWith(root+path.sep)&&f!==root)return res.writeHead(403).end();try{if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream'});res.end(fs.readFileSync(f));}catch{res.writeHead(404).end();}});
const topicURL=t=>(t.course==='ege-baza'?'/ege-baza/':'/school/'+t.course+'/')+'topics/'+t.slug+'/';
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
 const errors=[];let count=0;const shots=process.env.COURSE_ENTRANCES_SHOTS;
 try{
  const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const missing=[];page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)missing.push(r.url());});
  for(const t of data){
   await page.goto(base+topicURL(t));assert.equal(await page.locator('h1').count(),1);
   assert.equal(await page.locator('[data-course-example] img').getAttribute('src'),'/assets/course-examples/'+t.id+'-0.png');
   const first=page.locator('[data-ce-quiz="first"]');await first.locator('button').click();assert.match(await first.innerText(),/Пустое поле/);
   await first.locator('input').fill('1/0');await first.locator('button').click();assert.match(await first.innerText(),/Формат не считается/);
   await first.locator('input').fill('123456');await first.locator('button').click();assert.match(await first.innerText(),/Попробуй исправить/);
   await page.locator('[data-ce-explanation]>summary').click();assert.equal(await first.locator('input').inputValue(),'123456');
   await page.locator('[data-ce-action="next"]').click();assert.match(await page.locator('[data-ce-caption]').innerText(),/Шаг 2/);
   await page.locator('[data-ce-action="play"]').click();assert.equal(await page.locator('[data-ce-action="play"]').getAttribute('aria-pressed'),'true');assert.match(await page.locator('[data-course-example] img').getAttribute('src'),/\.gif$/);
   await page.locator('[data-ce-action="play"]').click();assert.match(await page.locator('[data-course-example] img').getAttribute('src'),/-1\.png$/);
   await first.locator('input').fill(t.answer);await first.locator('button').click();assert.match(await first.innerText(),/Верно/);
   const fresh=page.locator('[data-ce-quiz="fresh"]');await fresh.locator('input').fill(t.freshAnswer.replace('.',','));await fresh.locator('button').click();assert.match(await fresh.innerText(),/Верный ответ/);
   const equal=await page.evaluate(()=>[MathExamCourseExamples.equal('6/20','0.3'),MathExamCourseExamples.equal('1/0','0'),MathExamCourseExamples.equal('Infinity','1'),MathExamCourseExamples.equal('-5','5')]);assert.deepEqual(equal,[true,null,null,false]);
   await page.setViewportSize({width:320,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,t.id+' overflow');
   if(shots&&['p6-river','m8-cancel','baza-percent'].includes(t.id)){fs.mkdirSync(shots,{recursive:true});await page.screenshot({path:path.join(shots,t.id+'-320.png'),fullPage:true});}
   await page.setViewportSize({width:1280,height:900});count++;
  }
  // Native curricula: help and return leave the exact draft in place and do not award independent credit.
  for(const [course,id,global,key] of [['peterson6','p08','PetersonApp','mathexam.peterson6.part1.v1'],['makarychev8','p02','MakarychevApp','mathexam.makarychev8.2024.v1']]){
   await page.goto(base+'/school/'+course+'/#lesson/'+id+'/0');await page.locator('#final-answer').fill('123');
   const help=page.locator('[data-ce-native]');await help.locator('summary').click();await help.locator('[data-ce-action="play"]').click();
   assert.equal(await page.locator('#final-answer').inputValue(),'123');
   const state=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);assert.ok(Object.values(state.tasks).some(s=>s.assisted&&s.value==='123'));assert.ok(!Object.values(state.tasks).some(s=>s.independent));
   await help.locator('[data-ce-return]').click();assert.equal(await page.locator('#final-answer').inputValue(),'123');
   await page.reload();assert.equal(await page.locator('#final-answer').inputValue(),'123');
   assert.ok(Object.values(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).tasks,key)).some(s=>s.assisted));
   const expected=course==='peterson6'?'43/50':'2/3';await page.locator('#final-answer').fill(expected);await page.locator('#answer-form button[type=submit],#answer-form button:not([type])').first().click();
   const completed=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).tasks,key);assert.ok(Object.values(completed).some(s=>s.correct&&s.assisted&&!s.independent));
   await page.setViewportSize({width:320,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,course+' overflow');
   await page.reload();if(course==='peterson6')assert.equal(await page.locator('.side details').getAttribute('open'),null);
   if(shots)await page.screenshot({path:path.join(shots,course+'-native-320.png'),fullPage:true});
   await page.goto(base+'/school/'+course+'/');assert.equal(await page.locator('.ce-native-link .ce-links a').count(),3);
   await page.setViewportSize({width:1280,height:900});count++;
  }
  await page.goto(base+'/ege-baza/path/index.html#lesson=percent');await page.locator('#answer').fill('123');await page.locator('[data-ce-native]>summary').click();
  assert.equal(await page.locator('#answer').inputValue(),'123');let ege=await page.evaluate(()=>PathCourse.state());assert.equal(ege.lessons.percent.help,true);assert.equal(ege.lessons.percent.independent,0);
  await page.locator('[data-ce-return]').click();await page.reload();assert.equal(await page.locator('#answer').inputValue(),'123');assert.equal((await page.evaluate(()=>PathCourse.state())).lessons.percent.help,true);
  await page.setViewportSize({width:320,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'EGE overflow');if(shots)await page.screenshot({path:path.join(shots,'ege-native-320.png'),fullPage:true});
  await page.goto(base+'/ege-baza/path/index.html#diagnostic');assert.equal(await page.locator('[data-ce-native]').count(),0);count++;
  const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:900}});const plain=await nojs.newPage();
  for(const [url,total] of [['/school/peterson6/',14],['/school/makarychev8/',51],['/ege-baza/',113]]){await plain.goto(base+url);assert.equal(await plain.locator('h1').count(),1);assert.equal(await plain.locator('main .ce-catalog .ce-links').last().locator('a').count(),total);assert.equal(await plain.locator('meta[name="robots"]').count(),0);}
  await plain.goto(base+topicURL(data[0]));await plain.locator('[data-ce-explanation]>summary').click();assert.match(await plain.locator('.ce-steps').innerText(),/11/);assert.equal(await plain.locator('.ce-controls').isVisible(),false);
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);console.log('COURSE_ENTRANCES_BROWSER_OK:',count,'interactive routes, no-JS catalogues, exact rational answers, help retention, GIF controls and 320px layout');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
