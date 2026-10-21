'use strict';
if(!process.env.CI)throw new Error('Run geometry proof acceptance only in cloud CI.');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/oge-course-proof'),names={23:'geometry-calculations',24:'proofs',25:'geometry'};
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png'};
async function fit(page,label){const width=await page.evaluate(()=>document.documentElement.clientWidth);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),label+' page overflow');const bad=await page.locator('.ocp-writing textarea,.ocp-references>details[open],.ocp-references>details[open] a,.ocp-step-reason[open],.ocp-figure-pan,.ocp-figure-controls,#courseHintPanel,#courseHintPanel .step-recog,#courseHintPanel .choice-btn,#courseHintPanel .gsteps>li,#courseHintPanel input').evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length).map(n=>{const r=n.getBoundingClientRect();return{left:r.left,right:r.right,text:n.textContent.slice(0,50)}}).filter(r=>r.left< -1||r.right>document.documentElement.clientWidth+1));assert.deepEqual(bad,[],label+' new UI fits '+width);}
function courseCreditSnapshot(){
 const records=JSON.parse(localStorage.getItem('mathExamCourseProgress.v1')||'{}');
 // Opening a guide legitimately logs task_start / hint and updates its timestamp.
 // Preserve every actual progress field, including solved counts and mastery.
 for(const record of Object.values(records)){delete record.events;delete record.updatedAt;}
 return records;
}
async function captureUnansweredHelp(page,n,width){
 const writing=page.locator('.ocp-writing'),area=writing.locator('textarea'),draft='Моя запись до открытия помощи';
 await writing.locator(':scope>summary').click();await area.fill(draft);await writing.locator(':scope>summary').click();
 const progress=await page.evaluate(courseCreditSnapshot);
 await page.locator('#courseHintToggle').click();
 assert.equal(await page.locator('#courseHintToggle').getAttribute('aria-expanded'),'true');
 assert.equal(await page.locator('#courseHintToggle').innerText(),'Убрать подсказку');
 await page.locator('#courseHintPanel').getByRole('button',{name:'Решать по шагам',exact:true}).click();
 if(n===23){
  await page.locator('#courseHintPanel .step-recog:not(.done)').waitFor();
  assert.equal(await page.locator('#courseHintPanel .ladder .done').count(),0);
  assert.equal(await page.locator('#courseHintPanel .guide-done').count(),0);
 }else{
  // The first prototype begins with four theoretical statements. Advance only
  // through these reading steps; stop before the first numeric response.
  const count=await page.evaluate(()=>window.eval('trS.b.steps.length'));
  for(let i=0;i<count&&await page.locator('#courseHintPanel #gAsk').count()===0;i++){
   await page.locator('#courseHintPanel [data-act="g-next"]').click();
  }
  await page.locator('#courseHintPanel #gAsk').waitFor();
  assert.equal(await page.locator('#courseHintPanel #gAsk').inputValue(),'');
  assert(await page.evaluate(()=>window.eval('!trS.done&&!trS.shown&&trS.gres.length===0')),'guide has no solved or revealed answer');
 }
 assert.equal(await area.inputValue(),draft,'draft survives opening guided help');
 await fit(page,`unanswered-help${n}/${width}`);
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:path.join(out,`task${n}-${width}-help.png`),fullPage:true});
 await page.locator('#courseHintToggle').click();
 assert.equal(await page.locator('#courseHintToggle').getAttribute('aria-expanded'),'false');
 assert.equal(await page.locator('#courseHintToggle').innerText(),'Хочешь подсказку?');
 assert.equal(await page.locator('#courseHintPanel').isVisible(),false);
 assert.equal(await area.inputValue(),draft,'draft survives closing guided help');
 assert.deepEqual(await page.evaluate(courseCreditSnapshot),progress,'opening and closing help gives no course credit');
}
(async()=>{fs.mkdirSync(out,{recursive:true});const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,bytes)=>{if(err){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(bytes);});});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;let browser;const errors=[],coverage=[];
try{browser=await chromium.launch({headless:true});for(const width of[320,360,1280])for(const n of[23,24,25]){const page=await browser.newPage({viewport:{width,height:920}});page.on('pageerror',e=>errors.push(e.message));await page.goto(base+`/trainers/oge-task${n}-${names[n]}.html`);await page.locator('html[data-oge-course-proof="ready"]').waitFor();const ids=await page.evaluate(n=>window.eval(n===23?'ORDER':n===24?'TASKS.map(t=>t.id)':'TYPES.map(t=>t.id)'),n);
for(const id of ids){await page.evaluate(({n,id})=>{if(n===23)window.eval(`buildTask(document.querySelector('.train-host'),{sub:'${id}',p:SUBS['${id}'].gen()},'train',function(){});`);else if(n===24)window.startStudy(id);else window.newTrainTask(id);window.OgeCourseProof.decorate();},{n,id});const writing=page.locator('.ocp-writing'),area=writing.locator('textarea');assert.equal(await writing.evaluate(e=>e.open),false,'notebook starts collapsed');
const toggle=page.locator('#courseHintToggle');if(await toggle.count()){assert(await toggle.evaluate(e=>!!(e.compareDocumentPosition(document.querySelector('.ocp-writing'))&Node.DOCUMENT_POSITION_FOLLOWING)),'help precedes notebook');assert.equal(await toggle.innerText(),'Хочешь подсказку?');}
const pan=page.locator('.ocp-figure-pan').first(),zoom=page.locator('.ocp-figure-zoom').first();assert.equal(await pan.getAttribute('tabindex'),'0');const tooSmall=await pan.locator('svg text').evaluateAll(nodes=>nodes.map(n=>({text:n.textContent,size:parseFloat(getComputedStyle(n).fontSize)*Math.hypot(n.getScreenCTM().a,n.getScreenCTM().b)})).filter(n=>n.size<17.8));assert.deepEqual(tooSmall,[],'enlarged labels are readable');
await fit(page,`initial${n}/${id}/${width}`);if(id===ids[0]){await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(out,`task${n}-${width}-initial.png`),fullPage:true});if(n===23||n===25)await captureUnansweredHelp(page,n,width);}
await zoom.click();assert.equal(await zoom.getAttribute('aria-pressed'),'false');await fit(page,`diagram-fit${n}/${id}/${width}`);await zoom.click();assert.equal(await zoom.getAttribute('aria-pressed'),'true');
await writing.locator(':scope>summary').click();await area.fill('Из условия следует ... По теореме ...');await writing.locator(':scope>summary').click();assert.equal(await area.inputValue(),'Из условия следует ... По теореме ...');const detail=page.locator('.ocp-references>.ocr-theory'),summary=detail.locator(':scope>summary');await summary.focus();await page.keyboard.press('Enter');assert(await detail.evaluate(e=>e.open));assert((await detail.locator('a').allTextContents()).some(t=>/Атанасян/.test(t)));assert((await detail.locator('a').allTextContents()).some(t=>/Мерзляк/.test(t)));await fit(page,`${n}/${id}/${width}`);await detail.locator(':scope>.ocr-close').click();assert(await summary.evaluate(e=>e===document.activeElement));assert.equal(await area.inputValue(),'Из условия следует ... По теореме ...');
if(n===24){const count=await page.evaluate(()=>window.eval('curTask().steps.length'));for(let i=0;i<count;i++){await page.locator(`button[onclick="pickCard({type:'s',i:${i}})"]`).click();assert.equal(await page.locator('.chain .citem').count(),i+1);}assert.equal(await page.locator('.chain .ocp-step-reason').count(),count);const reason=page.locator('.chain .ocp-step-reason').first();await reason.locator(':scope>summary').click();await reason.locator('.ocr-theory>summary').click();await fit(page,`proof${id}/${width}`);}
if(id===ids[0])await page.screenshot({path:path.join(out,`task${n}-${width}.png`),fullPage:true});coverage.push({n,id,width});}
await page.close();}assert.deepEqual(errors,[]);console.log('OGE_COURSE_PROOF_BROWSER_OK: 168 prototype/viewport cases; readable original diagrams, initial task and unanswered-help screenshots, compact drafts, every proof assembled with step sources; keyboard and no overflow');}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));fs.writeFileSync(path.join(out,'coverage.json'),JSON.stringify({coverage,errors},null,2));}})().catch(e=>{console.error(e);process.exitCode=1;});
