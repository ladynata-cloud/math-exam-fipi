'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright'),C=require('../trainers/oge-basics/multiplication-division/arithmetic-foundations-core.js');
const root=path.resolve(__dirname,'..'),origin='https://mathexam.space',url=origin+'/trainers/oge-basics/multiplication-division/arithmetic-foundations.html',output=process.env.DIVISION_DIAGNOSTIC_OUTPUT_DIR;
(async()=>{const browser=await chromium.launch({headless:true});try{
 for(const [i,stage] of C.stages.entries()){
  const width=[320,390,1060][i%3],context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await context.route('**/*',route=>{const u=new URL(route.request().url()),file=path.resolve(root,'.'+u.pathname);assert.equal(u.origin,origin);assert(file.startsWith(root+path.sep));route.fulfill({status:200,contentType:({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'})[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});});
  await page.goto(url+'#'+stage.id);await page.locator('#answer').waitFor();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.locator('#answer').fill('999999');await page.locator('#check').click();assert(await page.locator('.feedback.error').isVisible());
  await page.locator('#hint').click();assert(await page.locator('.hint').isVisible());
  if(output){fs.mkdirSync(output,{recursive:true});await page.screenshot({path:path.join(output,'foundations-'+stage.id+'-'+width+'.png'),fullPage:true});}
  const task=C.make(stage.id,1);
  for(const [j,q] of task.steps.entries()){
   assert.equal(await page.locator('#question').innerText(),q.prompt);await page.locator('#answer').fill(q.answer);await page.locator('#check').click();
   const key='mathExam.foundations.tab.v1.'+stage.id,before=await page.evaluate(key=>sessionStorage.getItem(key),key);await page.reload();await page.locator('#exercise').waitFor();assert.equal(await page.evaluate(key=>sessionStorage.getItem(key),key),before);assert.equal(JSON.parse(before).answers.length,j+1);
  }
  assert(await page.locator('#new').isVisible());assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.locator('#new').click();assert.equal(await page.evaluate(id=>JSON.parse(sessionStorage.getItem('mathExam.foundations.tab.v1.'+id)).seed,stage.id),2);
  assert.deepEqual(errors,[]);await context.close();console.log('PASS foundations '+stage.id+' '+width+'px wrong/help/correct, complete and reload');
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
