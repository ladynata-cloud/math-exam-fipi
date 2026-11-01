'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const shots=process.env.PROFILE_PROGRESS_REPAIR_SHOTS||'/tmp/profile-progress-repair-shots';
const root=path.resolve(__dirname,'..'),STATE='mathexam.profileStart2027.v1',DIAG='mathexam.profileReadinessDiagnostic.v1';
const server=http.createServer((req,res)=>{try{let file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(root+path.sep))return res.writeHead(403).end();if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));}catch(_){res.writeHead(404).end();}});
(async()=>{let browser;const errors=[];try{
 fs.mkdirSync(shots,{recursive:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:360,height:800}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const start=base+'/ege-profil/start/index.html',noOverflow=async label=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' mobile overflow');
 await page.goto(start+'#home');await page.locator('.hero').waitFor();
 await page.evaluate(key=>{const first=ProfileLessons[0],second=ProfileLessons[1];localStorage.setItem(key,JSON.stringify({version:1,records:{[first.id]:{guided:[],independent:first.tasks.slice(-3,-1).map(t=>t.id),attempts:2},[second.id]:{guided:[second.tasks[0].id],independent:[],attempts:1}},seen:{},sessions:{}}));},STATE);
 await page.reload();await page.locator('.hero').waitFor();assert.match(await page.locator('.hero .actions a').first().innerText(),/Мой следующий урок/);
 assert.equal(await page.locator('.hero .actions a').first().getAttribute('href'),await page.evaluate(()=>'#lesson/'+ProfileLessons[1].id),'guided practice alone does not skip an unfinished topic');
 await page.goto(start+'#readiness');await page.locator('#diagnostic-start').click();await page.locator('#answer').fill('0,75');await page.reload();assert.equal(await page.locator('#answer').inputValue(),'0,75');
 for(let i=0;i<12;i++){
   const answer=await page.evaluate(i=>ProfileReadiness.checks[i].answer,i);await page.locator('#answer').fill(String(answer));await page.locator('#diagnostic-check').click();
   if(i===0){await page.reload();assert(await page.locator('#answer').isDisabled());assert(await page.locator('#diagnostic-next').isVisible());}
   await page.locator('#diagnostic-next').click();
 }
 await page.locator('#diagnostic-result').waitFor();await page.reload();assert.match(await page.locator('#diagnostic-result').innerText(),/12 из 12/);await noOverflow('diagnostic result');await page.screenshot({path:path.join(shots,'diagnostic-mobile.png'),fullPage:true});
 // A pupil who needed help on every fresh condition can finish honest repeats.
 await page.evaluate(key=>{const l=ProfileLessons.find(l=>l.id==='prob-count'),old=JSON.parse(localStorage.getItem(key));old.records[l.id]={guided:[],independent:[],attempts:3,mistakes:l.tasks.slice(-3).map(t=>t.id)};for(const t of l.tasks.slice(-3))old.seen[t.id]=1;localStorage.setItem(key,JSON.stringify(old));localStorage.setItem('mathExamCourseProgress.v1','{"student":{"name":"Existing learner"},"mistakes":{"kept":true}}');},STATE);
 await page.goto(start+'#practice/prob-count/independent');await page.reload();
 for(let i=0;i<2;i++){
   await page.locator('#answer-form').waitFor();assert.match(await page.locator('.task-kind').innerText(),/Повтор знакомой/);
   const answer=await page.evaluate(key=>{const id=JSON.parse(localStorage.getItem(key)).sessions['prob-count:independent'].taskId;return ProfileLessons.find(l=>l.id==='prob-count').tasks.find(t=>t.id===id).answer;},STATE);
   await page.locator('#answer').fill(String(answer));await page.locator('#submit-answer').click();await page.locator('#next').click();await page.locator('.result-panel').waitFor();
   if(!i)await page.locator('#another').click();
 }
 assert.match(await page.locator('.result-panel').innerText(),/Закреплено на знакомых задачах/);
 const record=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).records['prob-count'],STATE);assert.equal(record.independent.length,0);assert.equal(record.recovered.length,2);
 await page.goto(start+'#progress');await noOverflow('progress');
 const downloadEvent=page.waitForEvent('download');await page.locator('#export').click();const download=await downloadEvent,reportText=fs.readFileSync(await download.path(),'utf8'),report=JSON.parse(reportText);
 assert.equal(report.kind,'mathexam-profile-full-report');assert.equal(report.course.records['prob-count'].recovered.length,2);assert.equal(report.legacy.student.name,'Existing learner');assert.equal(Object.keys(report.diagnostic.results).length,12);
 const before=await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)]))));
 await page.goto(base+'/ege-profil/teacher.html');await page.locator('#fullReportFile').setInputFiles({name:'report.json',mimeType:'application/json',buffer:Buffer.from(reportText)});await page.waitForFunction(()=>document.getElementById('inStatus').textContent.includes('Полный отчёт открыт'));
 assert.match(await page.locator('#profileCourseReport').innerText(),/Закреплено на знакомых задачах/);assert.equal(await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])))),before);await noOverflow('teacher report');await page.screenshot({path:path.join(shots,'teacher-report-mobile.png'),fullPage:true});
 await page.goto(base+'/ege-profil/review.html');assert.match(await page.locator('#profileCourseMistakes').innerText(),/Закреплено на знакомых задачах/);assert.equal(await page.evaluate(()=>localStorage.getItem('mathExamCourseProgress.v1')),'{"student":{"name":"Existing learner"},"mistakes":{"kept":true}}');await noOverflow('review');await page.screenshot({path:path.join(shots,'review-mobile.png'),fullPage:true});
 const invalid=await browser.newContext({viewport:{width:360,height:800}}),p=await invalid.newPage();await p.addInitScript(key=>localStorage.setItem(key,'{broken'),DIAG);await p.goto(start+'#readiness');assert.match(await p.locator('#storage-warning').innerText(),/Сохранение проверки основы/);await p.locator('#diagnostic-start').click();await p.locator('#answer').fill('12');assert.equal(await p.evaluate(key=>localStorage.getItem(key),DIAG),'{broken');
 assert.deepEqual(errors,[]);console.log(JSON.stringify({gate:'PROFILE_PROGRESS_REPAIR_BROWSER_OK',mobile:360,diagnosticReload:true,recovery:true,teacherReadOnlyRoundtrip:true,legacyPreserved:true,errors}));
}finally{await browser?.close();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});
