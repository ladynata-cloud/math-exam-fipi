'use strict';
// Synthetic local learner work only. No cabinet, pupil records or production writes.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os'),{execFileSync}=require('node:child_process'),{pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/grade56-attempts');
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.pdf':'application/pdf'};
const report={gate:'GRADE56_ATTEMPTS_BROWSER_OK',scenarios:[],errors:[],screenshots:[]};
const server=http.createServer((req,res)=>{try{let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));assert(file.startsWith(root+path.sep));if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'}).end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
let browser,origin,offlineDir;
async function setup(width,offline=false){
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--single-process']}:{})});
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
 // Only local course assets are needed for these acceptance journeys.
 await context.route('**/*',route=>offline?(/^(file|data|blob):/.test(route.request().url())?route.continue():route.abort()):new URL(route.request().url()).origin===origin?route.continue():route.abort());
 const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>report.errors.push(e.message));
 return {context,page};
}
async function offlinePeterson(width){
 const source=path.join(root,'downloads/trainers/peterson6-math/peterson6-math.html'),zip=path.join(root,'downloads/trainers/peterson6-math/peterson6-math-package.zip');
 if(!offlineDir){
  offlineDir=fs.mkdtempSync(path.join(os.tmpdir(),'grade56-offline-'));
  execFileSync('python3',['-c','import zipfile,sys; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; z.extractall(sys.argv[2])',zip,offlineDir]);
 }
 const extracted=path.join(offlineDir,'peterson6-math.html');assert(fs.readFileSync(source).equals(fs.readFileSync(extracted)),'standalone and ZIP HTML match exactly');
 const file=width===320?extracted:source,{context,page}=await setup(width,true),network=[];
 page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
 await page.goto(pathToFileURL(file).href+'#lesson/p04/0');await page.waitForFunction(()=>window.PetersonApp);
 const current=()=>page.evaluate(()=>window.PetersonApp.getState().tasks['p04-t01']);
 await page.locator('#final-answer').fill('не число');await page.locator('#final-answer').press('Enter');assert.equal((await current()).attempts,0);
 await page.locator('#final-answer').fill('99');await page.locator('#final-answer').press('Enter');assert.equal((await current()).attempts,1);
 await page.locator('#final-answer').fill(String(3*4+2));await page.locator('#final-answer').press('Enter');
 await page.reload();await page.waitForFunction(()=>window.PetersonApp);
 const s=await current();assert.equal(s.correct,true);assert.equal(s.value,'14');assert.deepEqual(s.firstErrors.final,{value:'99',assisted:false});assert.equal(s.independent,false);
 await page.locator('.first-errors > summary').focus();await page.keyboard.press('Enter');assert((await page.locator('.first-errors').innerText()).includes('Исправлено: 14'));
 await capture(page,'peterson6-offline-'+(width===320?'zip':'html'),width,page.locator('.first-errors'));
 for(const lesson of ['p15','p33']){
  await page.goto(pathToFileURL(file).href+'#lesson/'+lesson+'/0');
  await page.locator('[data-action="hint"]').click();
  const figure=page.locator('.help figure'),helper=page.locator('.peterson-help');
  assert.equal(await helper.evaluate(el=>getComputedStyle(el).position),'static','closed helper leaves the model readable');
  assert(await figure.evaluate(el=>{
   const help=el.closest('.help'),style=getComputedStyle(help);
   const contentWidth=help.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);
   return el.getBoundingClientRect().width>=contentWidth-1;
  }),'the diagram uses the space available inside the hint');
  if(lesson==='p15')assert(await figure.locator('meter').first().evaluate(el=>el.getBoundingClientRect().width>=115),'ratio bars stay legible');
  await capture(page,'peterson6-model-'+lesson,width,figure);
  await helper.locator('.peterson-help-launcher').click();
  assert.equal(await helper.evaluate(el=>getComputedStyle(el).position),'fixed','opened helper remains available');
  await page.keyboard.press('Escape');
  assert.equal(await helper.evaluate(el=>getComputedStyle(el).position),'static');
 }
 assert.deepEqual(network,[],'offline attempt flow makes no network request');
 report.scenarios.push({name:'Peterson 6 offline '+(width===320?'ZIP':'HTML')+' format/error/correction/reload/no network',width,status:'PASS'});await browser.close();
}
async function capture(page,name,width,locator){
 await locator.scrollIntoViewIfNeeded();
 const file=name+'-'+width+'.png';await page.screenshot({path:path.join(out,file),fullPage:true});report.screenshots.push(file);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+': no horizontal overflow at '+width);
 assert(await locator.evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1;}),name+': feedback fits');
}
async function helperHistory(page,width){
 const helper=page.locator('.peterson-help'),launcher=helper.locator('.peterson-help-launcher'),panel=helper.locator('.peterson-help-panel'),summary=page.locator('.first-errors > summary');
 await helper.waitFor();const before=await page.evaluate(()=>JSON.stringify({...localStorage}));
 assert.equal(await helper.evaluate(el=>getComputedStyle(el).position),'static','history gives the closed helper flow space');
 for(const p of await page.locator('.first-errors li p').all()){
  await p.scrollIntoViewIfNeeded();assert(await p.evaluate(el=>{const r=el.getBoundingClientRect(),x=r.left+Math.min(r.width/2,40),y=r.top+r.height/2;return el.contains(document.elementFromPoint(x,y));}),'first error and correction remain uncovered');
 }
 await launcher.click();assert(await panel.isVisible());assert.equal(await helper.evaluate(el=>getComputedStyle(el).position),'fixed');
 await capture(page,'peterson6-history-helper-open',width,panel);
 await page.keyboard.press('Escape');assert(await panel.isHidden());assert(await launcher.evaluate(el=>document.activeElement===el));
 assert.equal(await helper.evaluate(el=>getComputedStyle(el).position),'static');
 await summary.focus();await page.keyboard.press('Enter');assert.equal(await helper.evaluate(el=>getComputedStyle(el).position),'fixed','collapsing history restores launcher');
 await summary.focus();await page.keyboard.press('Enter');assert.equal(await helper.evaluate(el=>getComputedStyle(el).position),'static');
 assert.equal(await page.evaluate(()=>JSON.stringify({...localStorage})),before,'history/helper presentation preserves all saved work');
}
async function peterson(width,grade){
 const id=grade===5?'p02-t01':'p04-t01',lesson=grade===5?'p02':'p04';
 // Compute the examples independently from their visible conditions.
 const answer=String(grade===5?(8+9)*2-5*5+360/6/10:3*4+2);
 const url=origin+'/school/peterson'+grade+'/#lesson/'+lesson+'/0';
 {
  const {context,page}=await setup(width);await page.goto(url);await page.waitForFunction(()=>window.PetersonApp);
  const current=()=>page.evaluate(taskId=>window.PetersonApp.getState().tasks[taskId],id);
  await page.locator('#final-answer').fill('не число');await page.locator('#final-answer').press('Enter');
  let s=await current();assert.equal(s.attempts,0);assert.equal(s.value,'не число');assert(!s.firstErrors.final);
  assert((await page.locator('#problem [role=status]').first().innerText()).includes('не распознана'));
  assert.equal(await page.locator('.first-errors').count(),0);
  await page.reload();await page.waitForFunction(()=>window.PetersonApp);assert.equal(await page.locator('#final-answer').inputValue(),'не число');
  await page.locator('#final-answer').fill(answer);await page.locator('#final-answer').press('Enter');
  s=await current();assert.equal(s.attempts,1);assert.equal(s.independent,true);assert.equal(s.correct,true);
  await capture(page,'peterson'+grade+'-format-independent',width,page.locator('.task-heading'));
  report.scenarios.push({name:'Peterson '+grade+' format/reload/independent',width,status:'PASS'});await browser.close();
 }
 {
  const {context,page}=await setup(width);await page.goto(url);await page.waitForFunction(()=>window.PetersonApp);
  const current=()=>page.evaluate(taskId=>window.PetersonApp.getState().tasks[taskId],id);
  await page.locator('#final-answer').fill('99');await page.locator('#final-answer').press('Enter');
  let s=await current();assert.equal(s.attempts,1);assert.deepEqual(s.firstErrors.final,{value:'99',assisted:false});
  await page.locator('#final-answer').fill('98');await page.locator('#final-answer').press('Enter');
  assert.deepEqual((await current()).firstErrors.final,{value:'99',assisted:false},'later errors cannot replace the first');
  await page.locator('#final-answer').fill(answer);await page.locator('#final-answer').press('Enter');
  s=await current();assert.equal(s.correct,true);assert.equal(s.independent,false);assert.equal(s.value,answer);
  const savedError=s.firstErrors.final;await page.reload();await page.waitForFunction(()=>window.PetersonApp);
  assert.deepEqual((await current()).firstErrors.final,savedError);assert.equal((await current()).correct,true);
  // Open the retained reasoning with the keyboard, as a learner would.
  const summary=page.locator('.first-errors > summary');await summary.focus();await page.keyboard.press('Enter');
  assert(await page.locator('.first-errors').evaluate(el=>el.open));
  const history=await page.locator('.first-errors').innerText();assert(history.includes('99'));assert(history.includes('без подсказки'));assert(history.includes('Исправлено: '+answer));
  if(grade===6)await helperHistory(page,width);
  await capture(page,'peterson'+grade+'-retained-first-error',width,page.locator('.first-errors'));
  const freshMode=grade===6?'check':'practice';
  await page.locator('[data-action=independent-check]').click();await page.waitForURL('**/#'+freshMode+'/**');await page.waitForFunction(mode=>Object.keys(window.PetersonApp.getState().tasks).some(id=>id.startsWith(mode+':')),freshMode);
  const practice=await page.evaluate(mode=>{const s=window.PetersonApp.getState();return s.tasks[Object.keys(s.tasks).find(id=>id.startsWith(mode+':'))];},freshMode);
  assert(practice);assert(!practice.firstErrors.final);assert.deepEqual(practice.firstErrors.steps,{});assert.equal(practice.attempts,0);
  assert.deepEqual((await current()).firstErrors.final,savedError,'a new practice keeps the original history');
  report.scenarios.push({name:'Peterson '+grade+' first error/correction/reload/keyboard/fresh practice',width,status:'PASS'});await browser.close();
 }
}
async function vilenkin(width){
 const prefix=origin+'/courses/vilenkin-6-part-1/textbook.html',check='#unit/2/task/v6-book-2-1-87',practice='#unit/0/task/v6-book-0-intro-reduce',id='v6-book-2-1-87';
 const state=page=>page.evaluate(taskId=>JSON.parse(localStorage.getItem('mathexam-vilenkin6-textbook-2024-v1')).tasks[taskId],id);
 const ready=page=>page.waitForFunction(()=>window.VilenkinTextbook?.ready&&document.querySelector('.condition'));
 const nav=async(page,hash)=>{await page.goto(prefix+hash);await ready(page);};
 {
  const {context,page}=await setup(width);await nav(page,check);await page.locator('#answer').fill('499');
  assert.equal((await state(page)).helped,false);await nav(page,practice);
  let s=await state(page);assert.equal(s.helped,true);assert.equal(s.draft,'499');assert.equal(s.attempts,0);
  await page.locator('[data-action=hint]').click();await page.locator('[data-action=solution]').click();await nav(page,check);
  assert.equal(await page.locator('#answer').inputValue(),'499');await page.reload();await ready(page);assert.equal((await state(page)).helped,true);
  // The condition asks to restore a whole from a percentage; its answer is 500.
  await page.locator('#answer').fill('500');await page.locator('#answer').press('Enter');
  s=await state(page);assert.equal(s.status,'assisted');assert.equal(s.attempts,1);assert.equal(s.draft,'500');
  await capture(page,'vilenkin6-practice-help',width,page.locator('.work'));
  report.scenarios.push({name:'Vilenkin 6 practice detour/help/draft/reload/assisted result',width,status:'PASS'});await browser.close();
 }
 {
  const {context,page}=await setup(width);await nav(page,check);await page.locator('#answer').fill('498');
  assert.equal((await state(page)).helped,false,'a visible PDF link is not assistance');
  // Keep the native link and native middle-button event; prevent only its navigation.
  await page.locator('.source a').evaluate(el=>el.addEventListener('auxclick',ev=>ev.preventDefault()));
  await page.locator('.source a').click({button:'middle'});
  let s=await state(page);assert.equal(s.helped,true);assert.equal(s.draft,'498');assert.equal(s.attempts,0);
  await page.reload();await ready(page);s=await state(page);assert.equal(s.helped,true);assert.equal(s.draft,'498');
  await capture(page,'vilenkin6-middle-pdf',width,page.locator('#answer-form'));
  report.scenarios.push({name:'Vilenkin 6 native middle-button PDF attribution/reload',width,status:'PASS'});await browser.close();
 }
}
(async()=>{try{
 fs.mkdirSync(out,{recursive:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));origin='http://127.0.0.1:'+server.address().port;
 for(const width of [320,1280]){await peterson(width,5);await peterson(width,6);await vilenkin(width);await offlinePeterson(width);}
 assert.deepEqual(report.errors,[]);report.status='PASS';console.log(JSON.stringify(report));
}catch(error){report.status='FAIL';report.failure=error.stack;console.error(error);process.exitCode=1;}finally{
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(report,null,2));if(browser)await browser.close();server.close();if(offlineDir)fs.rmSync(offlineDir,{recursive:true,force:true});
}})();
