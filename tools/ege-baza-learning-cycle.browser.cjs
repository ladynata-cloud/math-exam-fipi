'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..'),shots=process.env.EGE_CYCLE_SHOTS;
const server=http.createServer((req,res)=>{try{let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep))throw Error();if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url='http://127.0.0.1:'+server.address().port+'/ege-baza/path/index.html',browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox']});
 try{
  if(shots)fs.mkdirSync(shots,{recursive:true});
  for(const width of [320,1280]){
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'}),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(url+'#lesson=round');
   const submit=async value=>{await page.locator('#answer').fill(String(value));await page.locator('#answer').press('Enter');};
   await submit(-99);assert.equal(await page.locator('#repairStep').isVisible(),false);await submit(-98);assert(await page.locator('#repairStep').isVisible());assert.equal(await page.locator('#taskHelp').evaluate(el=>el.open),false);
   await page.reload();assert.equal(await page.locator('#answer').inputValue(),'-98');assert(await page.locator('#repairStep').isVisible());
   await page.locator('#repairStep').focus();await page.keyboard.press('Enter');assert(await page.locator('#taskSteps').evaluate(el=>el.open));assert.equal(await page.locator('#taskIdea').evaluate(el=>el.open),false);
   await page.locator('#stepAnswer').fill('3/');await page.locator('#returnToAnswer').click();assert.equal(await page.locator('#answer').inputValue(),'-98');assert.equal(await page.locator('#taskHelp').evaluate(el=>el.open),false);
   const task=await page.evaluate(()=>{const l=PathCourse.state().lessons.round;return PathData.task('round',l.seed);});await submit(task.answer);assert.equal(await page.locator('#new').innerText(),'Ещё задача этого типа');assert.equal(await page.evaluate(()=>PathCourse.state().lessons.round.independent),0);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'assisted result no overflow '+width);
   if(shots)await page.screenshot({path:path.join(shots,'learning-cycle-'+width+'-result.png'),fullPage:true});
   await page.locator('#new').click();assert.equal(await page.locator('#answer').inputValue(),'');assert.equal(await page.locator('#taskHelp').evaluate(el=>el.open),false);assert.notEqual(await page.locator('.task-first-problem>.task').innerText(),task.q);
   const fresh=await page.evaluate(()=>{const l=PathCourse.state().lessons.round;return PathData.task('round',l.seed).answer;});await submit(fresh);assert.equal(await page.evaluate(()=>PathCourse.state().lessons.round.independent),1);
   await page.goto(url+'#lesson=logic');await page.locator('#new').click();assert.match(await page.locator('#variantStatus').innerText(),/знакомый вариант/);await submit(7);assert.equal(await page.evaluate(()=>PathCourse.state().lessons.logic.independent),0);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   if(shots)await page.screenshot({path:path.join(shots,'learning-cycle-'+width+'-repeat.png'),fullPage:true});assert.deepEqual(errors,[]);await page.close();
   // Use a separate browser context so earlier learner journeys stay intact.
   const boundary=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'}),boundaryErrors=[];boundary.on('pageerror',error=>boundaryErrors.push(error.message));await boundary.goto(url+'#lesson=logic');
   const boundaryAnswer=await boundary.evaluate(()=>{const l=PathCourse.state().lessons.logic;return PathData.task('logic',l.seed).answer;});
   await boundary.locator('#answer').fill(String(boundaryAnswer));await boundary.locator('#answer').press('Enter');await boundary.locator('#taskNote>summary').click();await boundary.locator('#note').fill('Моя запись о решении');
   const boundaryBefore=await boundary.evaluate(()=>{const state=PathCourse.state(),l=state.lessons.logic;state.serial=1e9-254;return {seed:l.seed,independent:l.independent,checks:l.checks,note:l.note,valid:PathCourse.valid(state)};});assert.equal(boundaryBefore.seed,11);assert.equal(boundaryBefore.valid,true);
   await boundary.locator('#new').click();assert.equal(await boundary.locator('#answer').inputValue(),'');assert.equal(await boundary.locator('#feedback').innerText(),'');assert.match(await boundary.locator('#variantStatus').innerText(),/знакомый вариант/);
   const boundarySnapshot=()=>boundary.evaluate(()=>{const state=PathCourse.state(),l=state.lessons.logic;return {seed:l.seed,serial:state.serial,done:l.done,attempted:l.attempted,help:l.help,draft:l.taskFirst.finalDraft,feedback:l.taskFirst.feedback,repeated:l.taskFirst.repeatedVariant,independent:l.independent,checks:l.checks,note:l.note,valid:PathCourse.valid(state)};});
   const boundaryExpected={seed:11,serial:12,done:false,attempted:false,help:false,draft:'',feedback:'',repeated:true,independent:boundaryBefore.independent,checks:boundaryBefore.checks,note:boundaryBefore.note,valid:true};assert.deepEqual(await boundarySnapshot(),boundaryExpected);
   await boundary.reload();assert.deepEqual(await boundarySnapshot(),boundaryExpected);assert.equal(await boundary.locator('#answer').inputValue(),'');assert.equal(await boundary.locator('#feedback').innerText(),'');
   if(shots)await boundary.screenshot({path:path.join(shots,'learning-cycle-'+width+'-serial-wrap.png'),fullPage:true});
   await boundary.locator('#answer').fill(String(boundaryAnswer));await boundary.locator('#answer').press('Enter');const boundaryAfter=await boundarySnapshot();assert.equal(boundaryAfter.independent,boundaryBefore.independent);assert.deepEqual(boundaryAfter.checks.slice(0,-1),boundaryBefore.checks);assert.equal(boundaryAfter.checks.at(-1).independent,false);assert.equal(boundaryAfter.note,boundaryBefore.note);assert.deepEqual(boundaryErrors,[]);await boundary.close();
  }
  console.log('EGE_BAZA_LEARNING_CYCLE_BROWSER_OK: 320/1280px; keyboard repair, two-error offer/reload, original draft, assisted-to-fresh practice, honest repeated condition, same-seed serial wrap with preserved history, six screenshots');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
