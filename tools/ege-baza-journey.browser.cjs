'use strict';
// CI browser regression, separate from the supported interactive preview workflow.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),shots=process.env.EGE_JOURNEY_SHOTS,KEY='mathexam.ege-baza.path.v1';
const server=http.createServer((request,response)=>{
 try{
  let file=path.resolve(root,'.'+decodeURIComponent(new URL(request.url,'http://localhost').pathname));
  if(!file.startsWith(root+path.sep))throw Error('path');
  if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  response.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');
  response.end(fs.readFileSync(file));
 }catch{response.writeHead(404).end();}
});
let browser,checks=0;const errors=[];
const ok=(value,label)=>{assert.ok(value,label);checks++;};
(async()=>{
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port,home=origin+'/ege-baza/index.html',lesson=origin+'/ege-baza/path/index.html';
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox']});
  const context=await browser.newContext({reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  if(shots)fs.mkdirSync(shots,{recursive:true});
  const fits=async label=>ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow: '+label);
  for(const width of [1280,320,390]){
   await page.setViewportSize({width,height:900});
   for(const route of ['today','map','progress',...Array.from({length:7},(_,i)=>'line?line=m0'+(i+1))]){
    await page.goto(home+'#'+route);await page.locator('#content h1').waitFor();await fits(width+' '+route);
    if(['today','map','progress'].includes(route))ok(await page.locator('[data-line]').count()===7,'seven line cards '+route);
    if(route==='today')ok(await page.locator('.course-start .journey-continue').isVisible(),'main continuation visible '+width);
    if(shots&&['today','line?line=m05'].includes(route))await page.screenshot({path:path.join(shots,'journey-'+width+'-'+(route==='today'?'today':'stereo-line')+'.png'),fullPage:true});
   }
   ok(await page.evaluate(()=>localStorage.length)===0,'browsing root routes is read-only '+width);
   await page.goto(lesson+'#lesson=box');await page.locator('#answer').waitFor();await fits(width+' box');
   const bounds=await page.locator('#answerForm button[type=submit]').boundingBox();
   ok(bounds&&bounds.y>=0&&bounds.y+bounds.height<=900,'box answer and check button fit first viewport '+width);
   ok(await page.locator('.task-support svg').isVisible(),'box givens remain visible '+width);
   ok(await page.locator('a[href*="oge-course"]').count()===0,'EGE lesson has no unrelated OGE return '+width);
   if(shots)await page.screenshot({path:path.join(shots,'journey-'+width+'-box.png'),fullPage:false});
   // Leave the trainer before clearing this synthetic fixture: its pagehide saves work.
   await page.goto(home+'#today');await page.locator('#content h1').waitFor();
   await page.evaluate(()=>localStorage.clear());
  }
  await page.setViewportSize({width:1280,height:900});
  await page.goto(home+'#today');await page.locator('[data-nav="map"]').focus();await page.keyboard.press('Enter');
  await page.waitForURL('**/#map');await page.waitForFunction(()=>document.activeElement===document.getElementById('content'));
  ok(await page.locator('#content').evaluate(node=>node===document.activeElement),'keyboard route focuses main');
  await page.locator('[data-line="m05"] .actions a').click();await page.waitForURL('**/#line?line=m05');
  await page.locator('[data-journey-item="box"] a').first().click();await page.locator('#answer').waitFor();
  const answer=await page.evaluate(()=>{const row=PathCourse.state().lessons.box;return PathData.task('box',row.seed).answer;});
  ok(await page.locator('[data-journey-next]').isHidden(),'next-topic action waits for answer');
  await page.locator('#answer').fill(String(answer));await page.locator('#answer').press('Enter');await page.locator('[data-journey-next]').waitFor({state:'visible'});
  ok(await page.evaluate(()=>PathCourse.state().lessons.box.independent)===1,'first-attempt independent credit preserved');
  const nextId=(await page.locator('[data-journey-next]').getAttribute('href')).split('#lesson=')[1];
  ok(await page.evaluate(id=>EgeBazaJourney.lineForLesson(id).id,nextId)==='m05','next-topic stays in same line');
  await page.locator('.journey-lesson-nav .back').first().click();await page.locator('[data-journey-item="box"]').waitFor();
  ok(await page.locator('[data-journey-item="box"] .journey-status').innerText()==='Самостоятельно','line shows actual saved independent result');
  ok(await page.locator('.journey-line-summary progress').evaluate(node=>node.value===1&&node.max===12),'one success is one of 12 types');
  const before=await page.evaluate(key=>localStorage.getItem(key),KEY);
  for(const hash of ['#map','#progress','#today']){await page.goto(home+hash);await page.locator('#content h1').waitFor();}
  ok(await page.evaluate(key=>localStorage.getItem(key),KEY)===before,'root navigation preserves stored bytes');

  await page.goto(lesson+'#lesson=equations-linear');await page.locator('#answer').fill('7/');
  await page.locator('#taskHelp>summary').click();await page.locator('#taskSteps>summary').click();await page.locator('#stepAnswer').fill('3/');
  const seed=await page.evaluate(()=>PathCourse.state().lessons['equations-linear'].seed);
  await page.goto(home+'#today');await page.locator('.journey-continue').waitFor();
  ok((await page.locator('.journey-continue').getAttribute('href')).endsWith('#lesson=equations-linear'),'main resumes real saved work');
  await page.locator('.journey-continue').click();await page.locator('#answer').waitFor();
  ok(await page.locator('#answer').inputValue()==='7/'&&await page.locator('#stepAnswer').inputValue()==='3/','both final and intermediate drafts preserved through home');
  ok(await page.evaluate(()=>PathCourse.state().lessons['equations-linear'].seed)===seed,'resume does not generate new numbers');
  const helped=await page.evaluate(()=>PathData.task('equations-linear',PathCourse.state().lessons['equations-linear'].seed).answer);
  await page.locator('#answer').fill(String(helped));await page.locator('#answer').press('Enter');
  ok(await page.evaluate(()=>PathCourse.state().lessons['equations-linear'].independent)===0,'assisted solution remains separate');
  const grade7=await page.evaluate(()=>PathData.meta.find(item=>item.grade7&&!item.geometryRebuild).id);
  await page.goto(lesson+'#lesson='+grade7);await page.locator('[data-stage]').first().waitFor();
  ok(await page.locator('.journey-lesson-nav,[data-journey-next]').count()===0,'grade7 stays outside EGE journey UI');
  await page.goto(lesson+'?learning=1#lesson=box');await page.locator('body.learning-managed').waitFor();
  ok(await page.locator('.journey-lesson-nav,[data-journey-next]').count()===0,'managed task has no autonomous continuation');
  ok(errors.length===0,'no browser errors: '+errors.join('; '));
  console.log(`EGE_BAZA_JOURNEY_BROWSER_OK: ${checks} checks; 1280/320/390 widths, all seven lines, first-screen box controls, keyboard, actual success/return, exact draft resume, grade7/managed exclusions.`);
 }finally{await browser?.close();if(server.listening)await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
