'use strict';
// Real isolated learner journeys. No production URL or pupil account is used.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const os=require('node:os');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const OUTPUT=process.env.MAXIM_EQUATION_ARTIFACTS||path.join(os.tmpdir(),'maxim-equation-browser');
async function serve(){
 const server=http.createServer((req,res)=>{
  let file=path.join(ROOT,decodeURIComponent(new URL(req.url,'http://local').pathname));
  if(!file.startsWith(ROOT+path.sep)){res.writeHead(403);res.end();return;}
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream');
  fs.createReadStream(file).pipe(res);
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 return {server,url:'http://127.0.0.1:'+server.address().port+'/trainers/maxim-peterson6/'};
}
async function openSource(page,id){
 const picker=page.locator('details').filter({has:page.locator('#sample-select')});
 if((await picker.getAttribute('open'))===null)await picker.locator('summary').click();
 await page.selectOption('#sample-select',id);await page.click('#textbook');
}
async function run(){
 fs.mkdirSync(OUTPUT,{recursive:true});const {server,url}=await serve();
 let browser;try{browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})});}catch(error){await new Promise(resolve=>server.close(resolve));throw error;}
 let journeys=0,steps=0;
 try{
  for(const width of [320,390,1280]){
   const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));await page.goto(url+'#ratio');
   for(const id of ['303','305']){
    await openSource(page,id);
    while(true){
     const state=await page.evaluate(()=>{const C=window.TrainerCore,p=JSON.parse(localStorage.getItem(C.storageKey)),s=p.sessions.ratio,q=C.problemFor(s);return {index:s.index,count:q.steps.length,step:q.steps[s.index]};});
     if(state.index>=state.count)break;
     const step=state.step;
     if(step.kind==='choice'&&step.rich)await page.locator('[name=equation-choice][value="'+step.expected+'"]').check();
     else if(step.kind==='choice')await page.selectOption('#answer-input',step.expected);
     else await page.fill('#answer-input',String(step.expected));
     if(state.index===3){
      assert.ok(await page.locator('.equation-fraction').count()>0,'Model choices use horizontal fractions');
      const before=await page.inputValue('#answer-input');await page.reload();
      assert.equal(await page.inputValue('#answer-input'),before,'Selected model/draft survives reload');
      await page.locator('#step-'+state.index).scrollIntoViewIfNeeded();
      await page.screenshot({path:path.join(OUTPUT,id+'-'+width+'.png'),fullPage:false});
     }
     await page.click('#answer-form button[type=submit]');steps++;
    }
    assert.match(await page.locator('#finish').innerText(),/Пример решён/);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'No horizontal overflow at '+width);
    assert.deepEqual(errors,[]);journeys++;
   }
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(window.TrainerCore.storageKey)).solutions.length),2);
   await page.evaluate(()=>{
    const C=window.TrainerCore,p=C.freshProgress('2026-11-02T00:00:00.000Z',1);
    C.beginSession(p,'ratio','standard',{exampleId:'303',methodVersion:1},'2026-11-02T00:00:01.000Z');
    C.submitAnswer(p,'ratio','yes',0,'2026-11-02T00:00:02.000Z');C.toggleSessionHint(p,'ratio','2026-11-02T00:00:03.000Z');
    p.sessions.ratio.answers[1]='2,';localStorage.setItem(C.storageKey,JSON.stringify(p));
   });
   await page.reload();assert.equal(await page.inputValue('#answer-input'),'2,');
   await page.click('#equation-method');
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(window.TrainerCore.storageKey)).archivedSessions[0].answers[1]),'2,');
   assert.match(await page.locator('.equation-note').innerText(),/уже разбиралось/);
   await page.locator('.worknav a').click();await page.locator('.equation-archive summary').click();await page.locator('[data-resume-archive]').click();
   assert.equal(await page.inputValue('#answer-input'),'2,');assert.equal(await page.locator('#active-hint').isVisible(),true);
   await page.reload();assert.equal(await page.inputValue('#answer-input'),'2,');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
   journeys++;await context.close();
  }
  console.log('MAXIM_PETERSON6_EQUATIONS_BROWSER_OK: '+journeys+' journeys, '+steps+' accepted equation steps; 320/390/1280px, model reload and legacy restoration.');
  console.log('Screenshots: '+OUTPUT);
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
