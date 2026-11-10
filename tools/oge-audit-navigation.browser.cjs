'use strict';
// Disposable browsers, synthetic evidence, local HTTP only. No pupil records.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/oge-audit-navigation');
const MIME={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const KEY='mathExamCourseProgress.v1';
fs.mkdirSync(OUT,{recursive:true});
const report={checks:[],failures:[]};
const server=http.createServer((req,res)=>{
 try{let f=path.resolve(ROOT,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));assert(f.startsWith(ROOT+path.sep));if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');res.setHeader('Content-Type',MIME[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}
 catch{res.writeHead(404).end();}
});
(async()=>{
 let browser;
 try {
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({headless:true});
  const routes=['oge-task11-graphs-trainer.html','oge-task22-functions-graphs.html','oge-task24-proofs.html'];
  for(const width of [320,390,1280])for(const name of routes) {
   const c=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
   await c.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
   const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
   await p.goto(origin+'/trainers/'+name,{waitUntil:'load'});
   const host=p.locator('#maxexam-public-assistant'),launcher=host.locator('.launcher');
   await launcher.waitFor({state:'visible'});
   assert.equal(await launcher.evaluate(e=>getComputedStyle(e).position),width<=600?'static':'fixed');
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow: '+name+' '+width);
   if(width<=600) {
    const task=p.locator(name.includes('task11')?'#m4':name.includes('task22')?'.panel:not(.hidden) .mode-host[data-mode="marathon"]':'.app').first();
    const box=await launcher.boundingBox();assert(box&&box.height>=44);
    const below=await task.boundingBox();assert(below&&below.y>=box.y+box.height-1,'Navigation occupies a separate line before the task');
    // At different scroll positions no closed launcher can sit on a work control.
    for(const scroll of [0,360,720]) {
     await p.evaluate(y=>scrollTo(0,y),scroll);
     const overlaps=await p.evaluate(()=>{
      const host=document.getElementById('maxexam-public-assistant'),button=host.shadowRoot.querySelector('.launcher'),r=button.getBoundingClientRect();
      if(r.bottom<=0||r.top>=innerHeight)return [];
      return [...document.querySelectorAll('main button,main input,.app button,.app input,.wrap button,.wrap input')].filter(e=>{const b=e.getBoundingClientRect();return b.width&&b.height&&b.left<r.right&&b.right>r.left&&b.top<r.bottom&&b.bottom>r.top;}).map(e=>e.id||e.textContent.slice(0,60));
     });assert.deepEqual(overlaps,[],'Closed navigation never covers an answer control');
    }
    await p.evaluate(()=>scrollTo(0,0));
   }
   await p.screenshot({path:path.join(OUT,name.replace('.html','')+'-'+width+'.png')});
   await launcher.click();assert(await host.locator('.panel').isVisible());
   await host.locator('textarea').fill('Графики ОГЭ');await host.locator('.send').click();
   assert((await host.locator('.route-link').count())>0);
   await host.locator('textarea').press('Escape');assert.equal(await host.locator('.panel').isVisible(),false);
   assert(await launcher.evaluate(e=>e===e.getRootNode().activeElement));
   assert.deepEqual(errors,[]);report.checks.push({name,width,kind:'navigation',status:'PASS'});await c.close();
  }
  for(const width of [320,390,1280]) {
   const c=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
   await c.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
   const p=await c.newPage(),now=Date.now();
   const attempt=(id,outcome,at)=>({id,skill:'graphs',taskKey:id,at,outcome,fresh:true,helpUsed:outcome==='helped'});
   const seed={'foreign-course':{v:1,solvedByType:{other:4}},'oge-t11-grafiki':{v:1,ext:{auditLearning:{v:1,attempts:[attempt('own','independent',now-1000)]}}},'oge-t22-grafiki':{v:1,ext:{auditLearning:{v:1,attempts:[attempt('help','helped',now-5000)]}}}};
   await c.addInitScript(({key,seed})=>{localStorage.setItem(key,JSON.stringify(seed));},{key:KEY,seed});
   await p.goto(origin+'/trainers/oge-course/',{waitUntil:'load'});
   assert.equal(await p.locator('#course-continue').getAttribute('data-course-step'),'task-11');
   assert.equal(await p.locator('#course-practice-link').getAttribute('data-course-step'),'task-22');
   assert(await p.locator('#course-practice').isVisible());
   await p.locator('[data-track-id="graphs"] > summary').click();
   assert.match(await p.locator('#course-track-list [data-course-step="task-22"] .course-step-evidence').innerText(),/С помощью: 1/);
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   assert.equal(await p.evaluate(key=>localStorage.getItem(key),KEY),JSON.stringify(seed));
   await p.locator('#course-practice').scrollIntoViewIfNeeded();
   await p.screenshot({path:path.join(OUT,'learning-recommendation-'+width+'.png')});
   report.checks.push({width,kind:'separate continuation and recommendation',status:'PASS'});await c.close();
  }
  // The integration also consumes facts made by the actual native controls.
  // No synthetic result or answer key is injected into this learner journey.
  for(const width of [320,390,1280]) {
   const c=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
   await c.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
   const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
   await p.goto(origin+'/trainers/oge-task22-functions-graphs.html',{waitUntil:'load'});
   const task22=p.locator('.panel:not(.hidden) .mode-host[data-mode="marathon"]');
   const condition=await task22.locator('.statement').innerText();
   await task22.getByRole('button',{name:'+ отдельное значение',exact:true}).click();
   await task22.locator('.ab-row .v-dec').fill('7');
   await task22.locator('.minimal-hint > button').click();
   await p.goto(origin+'/trainers/oge-task11-graphs-trainer.html',{waitUntil:'load'});
   await p.locator('#m4-answer').fill('2');
   await p.locator('nav.oge-wayfinding a[href="/trainers/oge-course/"]').click();
   await p.waitForURL('**/trainers/oge-course/');
   assert.equal(await p.locator('#course-continue').getAttribute('data-course-step'),'task-11');
   assert.equal(await p.locator('#course-practice-link').getAttribute('data-course-step'),'task-22');
   assert.match(await p.locator('#course-practice-link').getAttribute('href'),/\?resume=1$/);
   const before=await p.evaluate(key=>localStorage.getItem(key),KEY);
   await p.reload({waitUntil:'load'});
   assert.equal(await p.evaluate(key=>localStorage.getItem(key),KEY),before,'Map is read-only for real native drafts too');
   await p.locator('#course-practice-link').click();
   await p.waitForURL(url=>url.pathname==='/trainers/oge-task22-functions-graphs.html');
   assert.equal(await task22.locator('.statement').innerText(),condition);
   assert.equal(await task22.locator('.ab-row .v-dec').inputValue(),'7');
   assert(await task22.locator('.minimal-help').isVisible(),'The exact unfinished help remains open');
   const record=await p.evaluate(key=>JSON.parse(localStorage.getItem(key))['oge-t22-grafiki'].ext.auditLearning,KEY);
   assert.equal(record.attempts.length,0,'A navigation recommendation creates no completed attempt');
   assert.equal(record.resume.helpUsed,true);
   assert.deepEqual(errors,[]);
   await p.screenshot({path:path.join(OUT,'real-draft-return-'+width+'.png'),fullPage:true});
   report.checks.push({width,kind:'native draft to course recommendation and exact return',status:'PASS'});
   await c.close();
  }
 } catch(e){report.failures.push(e.stack||String(e));process.exitCode=1;}
 finally{fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');if(browser)await browser.close();server.close();console.log(JSON.stringify({checks:report.checks.length,failures:report.failures}));}
})();
