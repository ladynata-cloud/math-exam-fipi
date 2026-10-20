'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const artifacts=path.resolve(process.env.TASK11_BROWSER_ARTIFACTS||path.join(root,'artifacts/task11-minimal'));
const file=path.join(root,'trainers/oge-task11-graphs-trainer.html');
const KEY='mathExamCourseProgress.v1';
async function main(){
 fs.mkdirSync(artifacts,{recursive:true});
 const server=http.createServer((req,res)=>{if(req.url==='/favicon.ico'){res.writeHead(204).end();return;}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(fs.readFileSync(file));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;const errors=[];
 try{
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
  const context=await browser.newContext({viewport:{width:360,height:800},acceptDownloads:true});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const go=async()=>{await page.goto('http://127.0.0.1:'+server.address().port+'/trainers/oge-task11-graphs-trainer.html');await page.waitForSelector('#m4-graphs svg');};
  const fits=async label=>{
   const bad=await page.evaluate(()=>[...document.querySelectorAll('#m4, #m4 .card, #m4-graphs, #m4-desc, .lab-layout, .lab-layout input, .lab-graph svg')].filter(e=>e.getClientRects().length).map(e=>({id:e.id||e.className,left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right})).filter(x=>x.left < -1 || x.right>innerWidth+1));
   assert.deepEqual(bad,[],label);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' horizontal scroll');
  };
  await go();assert.equal(await page.locator('#m4-hint').innerText(),'Хочешь подсказку?');assert.equal(await page.locator('#m4-hintbox').isVisible(),false);assert.equal(await page.locator('#m4-show').isVisible(),false);
  assert.equal(await page.locator('#m4-graphs svg').count(),3);assert.equal(await page.locator('#m4-desc select').count(),3);assert.equal(await page.locator('#task11-more').getAttribute('open'),null);
  await fits('mobile initial');await page.screenshot({path:path.join(artifacts,'01-mobile-question.png'),fullPage:true});
  await page.locator('#m4-graphs .gitem').first().click();const widths=await page.locator('#m4-graphs .gitem').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().width));assert(widths[0]>widths[1]*2,'small graph expands');await fits('mobile expanded graph');await page.locator('#m4-graphs .gitem').first().click();
  for(const id of ['m4-hint','m4-check','m4-next'])assert((await page.locator('#'+id).boundingBox()).height>=44,id+' touch target');
  await page.locator('#m4-hint').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#m4-hintbox').isVisible(),true);
  for(const family of ['lin','par','hyp','root','constant']){
   await page.locator('[data-family='+family+']').click();const graphBefore=await page.locator('#lab-graph').innerHTML();
   const slider=page.locator('#lab-controls input[type=range]').first();if(await slider.count()){await slider.focus();await page.keyboard.press('ArrowRight');}else{await page.locator('#lab-k').selectOption('4');await page.locator('#lab-k').dispatchEvent('input');}
   assert.notEqual(await page.locator('#lab-graph').innerHTML(),graphBefore,family+' changes graph');await fits('mobile '+family);
   assert.equal(await page.locator('#m4-good').isVisible(),false);assert.equal(await page.evaluate(k=>localStorage.getItem(k),KEY),null);
  }
  await page.locator('[data-family=hyp]').click();await page.locator('#lab-x').focus();await page.keyboard.press('ArrowLeft');assert.match(await page.locator('#lab-readout').innerText(),/не определено/);assert.equal(await page.locator('#lab-graph circle').count(),0);
  await page.locator('[data-family=lin]').click();await page.screenshot({path:path.join(artifacts,'02-mobile-lab.png'),fullPage:true});
  const key=await page.evaluate(()=>M4.task.key);const type=await page.evaluate(()=>M4.task.type);
  await page.locator('#m4-answer').fill([key[1],key[0],key[2]].join(''));await page.locator('#m4-check').click();assert.match(await page.locator('#m4-soft').innerText(),/Верно 1 из 3/);
  await page.locator('#m4-answer').fill(key.join(''));await page.locator('#m4-check').click();assert.match(await page.locator('#m4-good').innerText(),/Верно/);
  assert.equal(await page.evaluate(([k,t])=>JSON.parse(localStorage.getItem(k))['oge-t11-grafiki'].solvedByType[t],[KEY,type]),1);await fits('mobile feedback');
  await page.locator('#m4-next').click();assert.equal(await page.locator('#m4-hintbox').isVisible(),false);assert.equal(await page.locator('#m4-answer').inputValue(),'');
  // All former modes remain reachable and the ten-question exam still writes course progress.
  await page.locator('#task11-more summary').click();await page.locator('#tabs button[data-m=m6]').click();
  await page.evaluate(()=>{const original=buildQuiz11;buildQuiz11=()=>{const list=original();window.__task11Quiz=list;return list;};});
  await page.locator('#m6-start').click();
  for(let n=0;n<10;n++){
   const answer=await page.evaluate(i=>window.__task11Quiz[i].key.join(''),n);
   await page.locator('#m6-answer').fill(answer);await page.locator('#m6-ok').click();await page.locator('#m6-next').click();
  }
  const record=await page.evaluate(k=>JSON.parse(localStorage.getItem(k))['oge-t11-grafiki'],KEY);assert.equal(record.runs,1);assert.equal(record.best,10);assert.equal(record.passed,true);
  await page.locator('#tabs button[data-m=m4]').click();await page.setViewportSize({width:1280,height:900});await fits('desktop');await page.screenshot({path:path.join(artifacts,'03-desktop-question.png'),fullPage:true});
  await page.locator('#m4-hint').click();await fits('desktop lab');await page.screenshot({path:path.join(artifacts,'04-desktop-lab.png'),fullPage:true});
  // The existing self-contained download still opens offline with the new laboratory.
  const downloading=page.waitForEvent('download');await page.locator('#dl-html').click();const download=await downloading;const downloaded=path.join(artifacts,'downloaded-task11.html');await download.saveAs(downloaded);
  await page.goto(pathToFileURL(downloaded).href);await page.locator('#m4-hint').click();assert.equal(await page.locator('#lab-graph svg').count(),1);await fits('downloaded HTML');
  assert.deepEqual(errors,[]);await context.close();console.log('TASK11_MINIMAL_BROWSER_OK');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
