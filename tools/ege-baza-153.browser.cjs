'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const ROOT=path.resolve(__dirname,'..'),out=process.env.EGE_153_SHOTS||'artifacts/ege-153';
const server=http.createServer((req,res)=>{try{let f=path.resolve(ROOT,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!f.startsWith(ROOT+path.sep))throw Error();if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch{res.writeHead(404).end();}});
async function help(p,part){if(!await p.locator('#taskHelp').evaluate(e=>e.open))await p.locator('#taskHelp>summary').click();const id=part==='model'?'taskModel':'taskSteps';if(!await p.locator('#'+id).evaluate(e=>e.open))await p.locator('#'+id+'>summary').click();}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=process.env.EGE_153_ORIGIN||'http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH});
 try{
  const p=await browser.newPage({reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));fs.mkdirSync(out,{recursive:true});
  const ids=['practice-digits-delete','practice-average-three','practice-ring-route','practice-ring-meeting'];
  for(const width of [360,768,1280]){
   await p.setViewportSize({width,height:900});
   for(const id of ids){
    await p.goto(base+'/ege-baza/path/index.html#lesson='+id);await p.locator('#new').click();await p.locator('#answer').fill('17/');await help(p,'model');
    if(id==='practice-average-three'){await p.locator('#part').focus();await p.keyboard.press('End');assert.equal(await p.locator('#part').inputValue(),'3');}
    if(id==='practice-ring-route'){await p.locator('#opposite').click();await p.locator('#length').click();assert.match(await p.locator('#modelread').innerText(),/Длина кольца/);}
    if(id==='practice-ring-meeting'){await p.locator('#firstMeeting').focus();await p.keyboard.press('Enter');assert.match(await p.locator('#modelread').innerText(),/Первая новая встреча/);}
    if(id==='practice-digits-delete'){await p.locator('[data-digit="0"]').focus();await p.keyboard.press('Space');assert.equal(await p.locator('[data-digit="0"]').getAttribute('aria-pressed'),'true');}
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),id+' overflow '+width);
    assert(!/NaN|undefined|Infinity/.test(await p.locator('#model').innerHTML()));
    await p.screenshot({path:path.join(out,`${id}-${width}.png`),fullPage:true});
    const before=await p.locator('#model').innerText();await p.reload();await help(p,'model');assert.equal(await p.locator('#answer').inputValue(),'17/');assert.equal(await p.locator('#model').innerText(),before);
    await help(p,'steps');
    while(await p.locator('#stepAnswer').count()){
     const answer=await p.evaluate(id=>{const l=PathCourse.state().lessons[id],s=PathData.task(id,l.seed).steps[l.step];return s.solutions?.at(-1)??s.a;},id);
     await p.locator('#stepAnswer').fill(String(answer));await p.locator('#stepAnswer').press('Enter');
    }
    const data=await p.evaluate(id=>{const l=PathCourse.state().lessons[id],t=PathData.task(id,l.seed);return {answer:t.solutions?.at(-1)??t.answer,count:l.independent};},id);
    await p.locator('#answer').fill(String(data.answer));await p.locator('#answer').press('Enter');assert.match(await p.locator('#feedback').innerText(),/Верно/);assert.equal(await p.evaluate(id=>PathCourse.state().lessons[id].independent,id),data.count);
    // Stable course and reference links remain available for every new family.
    assert(await p.locator('.ref-help').count());
   }
   await p.goto(base+'/ege-baza/path/index.html#lesson=practice-average-speed');await help(p,'model');assert.equal(await p.locator('#part').getAttribute('max'),'2');assert.equal(await p.locator('#model svg rect').count(),2);
   await p.goto(base+'/trainers/ege-baza/index.html');
   for(const id of ['p20a','p20b','p20c','p20d']){
    await p.evaluate(id=>TrainerDebug.go(id),id);
    if(id==='p20b'){await p.locator('[data-lab="water-add"]').click();assert.match(await p.locator('.lab-read').innerText(),/9 %/);await p.locator('[data-lab="water-start"]').click();assert.match(await p.locator('.lab-read').innerText(),/15 %/);}
    if(id==='p20c'){await p.locator('[data-lab="avg-part"][data-i="3"]').click();assert.match(await p.locator('.lab-read').innerText(),/75 км\/ч/);}
    if(id==='p20d')assert.match(await p.locator('.lab-read').innerText(),/300 км/);
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),id+' overflow');await p.screenshot({path:path.join(out,`${id}-${width}.png`),fullPage:true});
   }
  }
  assert.deepEqual(errors,[]);console.log('EGE_153_BROWSER_OK: 4 new lesson flows; all alternative final steps; 360/768/1280; keyboard models; saved draft/model; honest help; p20a–d; 24 screenshots.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
