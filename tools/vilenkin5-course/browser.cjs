'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),course=path.join(root,'courses/vilenkin-5-part-1');
const data=[1,2,3,4,5].flatMap(n=>JSON.parse(fs.readFileSync(path.join(course,`data/lessons-${n}.json`))));
const out=process.env.V5_COURSE_ARTIFACTS||path.join(root,'artifacts/vilenkin5-part1');fs.mkdirSync(out,{recursive:true});
const report={views:[],journeys:[],errors:[]};const KEY='mathexam-vilenkin5-part1-v1';
let server,browser;
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.pdf':'application/pdf'};
(async()=>{try{
 let origin=process.env.V5_COURSE_ORIGIN;
 if(!origin){server=http.createServer((req,res)=>{try{let f=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));assert(f.startsWith(root+path.sep));if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);}catch{res.writeHead(404).end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));origin='http://127.0.0.1:'+server.address().port;}
 const base=origin+'/courses/vilenkin-5-part-1/';browser=await chromium.launch({headless:true});
 for(const width of [320,1280]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>report.errors.push(e.message));
  const go=async hash=>{await page.goto(base+hash);await page.locator('#main .lesson-head h1, #main .hero h1, #main #bookSearch, #main #bookNote').first().waitFor();};
  const fit=async label=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' no horizontal page overflow');
  const shot=async name=>page.screenshot({path:path.join(out,name+'-'+width+'.png'),fullPage:true});
  await go('#home');await fit('home');await shot('home');
  for(const l of data)for(const tab of ['theory','steps','practice','check']){
   await go(`#lesson/${l.id}/${tab}`);assert.equal((await page.locator('.lesson-head h1').innerText()).trim(),l.title);await fit(l.id+'/'+tab);
   assert(!/\bNaN\b|undefined|Infinity/.test(await page.locator('#lessonBody').innerText()),l.id+' rendered data');
   if(tab==='theory'){
    assert((await page.locator('#labHost').innerText()).trim().length>20,l.id+' model');
    const ranges=async()=>{for(const control of await page.locator('#labHost input[type=range]:visible').all()){
     const before=await control.inputValue();for(const attr of ['min','max']){const value=await control.getAttribute(attr);if(value!==null){await control.fill(value);await control.dispatchEvent('input');assert(!/\bNaN\b|undefined|Infinity/.test(await page.locator('#labHost').innerText()),l.id+' model extreme');}}
     await control.fill(before);await control.dispatchEvent('input');
    }};
    await ranges();
    for(const select of await page.locator('#labHost select:visible').all()){
     const original=await select.inputValue();
     for(const value of await select.locator('option').evaluateAll(es=>es.map(e=>e.value))){await select.selectOption(value);await select.dispatchEvent('input');await ranges();}
     await select.selectOption(original);await select.dispatchEvent('input');
    }
    if([0,8,16,21,25].includes(l.id))await shot('lesson-'+l.id);
   }
   report.views.push({width,id:l.id,tab,status:'PASS'});
  }
  const l=data.find(x=>x.id===8),e=l.examples[0];await go('#lesson/8/steps/0');
  await page.locator('#answer').fill(String(e.steps[0].answer));await page.locator('#answerForm button').click();assert.equal(await page.locator('.step.completed').count(),1);
  await page.locator('#answer').fill('321');await page.locator('#trainArithmetic').click();await page.locator('.arithmetic-dialog').waitFor();await fit('arithmetic');await shot('arithmetic');
  assert.equal(await page.locator('#answer').inputValue(),'321');await page.locator('#arithmeticClose').click();assert.equal(await page.locator('#answer').inputValue(),'321');assert.equal(await page.locator('.step.completed').count(),1);
  await page.reload();await page.locator('#answer').waitFor();assert.equal(await page.locator('#answer').inputValue(),'321');assert.equal(await page.locator('.step.completed').count(),1);
  await page.locator('#stepReveal').click();assert.equal(await page.locator('.step.completed').count(),1);await page.locator('#continueStep').click();assert.equal(await page.locator('.step.completed').count(),2);
  report.journeys.push({width,case:'completed steps, arithmetic detour, draft reload, explicit reveal continuation',status:'PASS'});
  await go('#lesson/8/practice/0');await page.locator('#hint').click();await page.locator('#answer').fill(String(l.tasks[0].answer));await page.locator('#answerForm button').click();
  const result=await page.evaluate(({key,id})=>JSON.parse(localStorage.getItem(key)).lessons[8].tasks[id].result,{key:KEY,id:l.tasks[0].id});assert.equal(result,'assisted');
  await page.reload();await page.locator('.badge.assisted').waitFor();
  await go('#lesson/8/check');await page.locator('#startExam').click();await page.locator('#answer').fill('');await page.locator('#answerForm button').click();assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).lessons[8].exam.n,KEY),0);
  await page.locator('#answer').fill('987');await page.locator('#openArithmetic').click();await page.locator('#arithmeticClose').click();assert.equal(await page.locator('#answer').inputValue(),'987');
  await page.reload();await page.locator('#answer').waitFor();assert.equal(await page.locator('#answer').inputValue(),'987');assert(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).lessons[8].exam.aided,KEY));
  report.journeys.push({width,case:'assisted result, invalid exam answer, saved exam and help provenance',status:'PASS'});
  await go('#book/7');await page.locator('#bookNote').fill('Разобрать задачу с учителем');await page.reload();await page.locator('#bookNote').waitFor();assert.equal(await page.locator('#bookNote').inputValue(),'Разобрать задачу с учителем');
  await page.goto(base+'offline.html#lesson/8/theory');await page.locator('#labHost').waitFor();await fit('offline');
  report.journeys.push({width,case:'source-page notes and standalone edition',status:'PASS'});
  await context.close();console.log('VILENKIN5_BROWSER_WIDTH_OK',width);
 }
 assert.deepEqual(report.errors,[]);console.log('VILENKIN5_PART1_BROWSER_OK',JSON.stringify({views:report.views.length,journeys:report.journeys.length,errors:report.errors.length}));
}finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));if(browser)await browser.close();if(server)await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});
