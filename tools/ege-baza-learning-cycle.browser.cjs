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
   const task=await page.evaluate(()=>{const l=PathCourse.state().lessons.round;return PathData.task('round',l.seed);});await submit(task.answer);assert.match(await page.locator('#new').innerText(),/Проверить себя/);assert.equal(await page.evaluate(()=>PathCourse.state().lessons.round.independent),0);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'assisted result no overflow '+width);
   if(shots)await page.screenshot({path:path.join(shots,'learning-cycle-'+width+'-result.png'),fullPage:true});
   await page.locator('#new').click();assert.equal(await page.locator('#answer').inputValue(),'');assert.equal(await page.locator('#taskHelp').evaluate(el=>el.open),false);assert.notEqual(await page.locator('.task-first-problem>.task').innerText(),task.q);
   const fresh=await page.evaluate(()=>{const l=PathCourse.state().lessons.round;return PathData.task('round',l.seed).answer;});await submit(fresh);assert.equal(await page.evaluate(()=>PathCourse.state().lessons.round.independent),1);
   await page.goto(url+'#lesson=logic');await page.locator('#new').click();assert.match(await page.locator('#variantStatus').innerText(),/знакомый вариант/);await submit(7);assert.equal(await page.evaluate(()=>PathCourse.state().lessons.logic.independent),0);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   if(shots)await page.screenshot({path:path.join(shots,'learning-cycle-'+width+'-repeat.png'),fullPage:true});assert.deepEqual(errors,[]);await page.close();
  }
  console.log('EGE_BAZA_LEARNING_CYCLE_BROWSER_OK: 320/1280px; keyboard repair, two-error offer/reload, original draft, assisted-to-fresh practice, honest repeated condition, four screenshots');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
