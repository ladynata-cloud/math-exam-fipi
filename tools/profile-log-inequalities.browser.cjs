'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const E = require('../trainers/ege-profile/log-inequalities/engine.js');
const root = path.resolve(__dirname, '..');
const route = '/trainers/ege-profile/log-inequalities/index.html';
const shots = process.env.LOG_TRAINER_SCREENSHOTS;
const harness = `<!doctype html><meta charset="utf-8"><title>Logarithm mirror fixture</title>
<iframe id="student" src="${route}?groupLesson=1"></iframe><iframe id="teacher" src="${route}?groupLesson=1"></iframe>
<script>
window.ready={};window.updates=[];
window.send=(name,type,state)=>{const e=ready[name];document.getElementById(name).contentWindow.postMessage({...e,type,...(state===undefined?{}:{state})},location.origin)};
addEventListener('message',e=>{
 if(e.origin!==location.origin)return;
 const name=['student','teacher'].find(n=>document.getElementById(n).contentWindow===e.source);if(!name)return;
 if(e.data.type==='mathexam:trainer-ready'){ready[name]=e.data;e.source.postMessage({...e.data,type:'mathexam:hydrate',mode:'empty'},location.origin)}
 if(e.data.type==='mathexam:trainer-state')updates.push({name,state:e.data.state});
});</script>`;
const server = http.createServer((req,res)=>{
 const url = new URL(req.url,'http://fixture');
 if(url.pathname==='/mirror-fixture')return res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}).end(harness);
 try {
  let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
  if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
 }catch(_){res.writeHead(404).end();}
});

(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,headless:true,args:['--no-sandbox']});
 const errors=[];
 async function learner(context){const p=await context.newPage();p.setDefaultTimeout(12000);p.on('pageerror',e=>errors.push(e.message));await p.goto(origin+route);await p.waitForFunction(()=>window.__logTrainer);return p;}
 async function state(p){return p.evaluate(()=>window.__logTrainer.getState());}
 async function work(p){const s=await state(p);return s.work[s.taskId];}
 async function chooseTask(p,t,mode='guided'){
  await p.locator('#topics-toggle').click();
  await p.locator('[data-task="'+t.id+'"]').click();
  await p.locator('[data-mode="'+mode+'"]').click();
  if(await p.locator('#mode-confirm').isVisible())await p.locator('#confirm-mode').click();
  assert.equal((await state(p)).taskId,t.id);
 }
 async function fillStage(p,t,stage){
  if(stage===0){for(const c of t.domainChoices)await p.locator('input[name="domain"][value="'+c.id+'"]').setChecked(c.correct);}
  if(stage===1)await p.locator('input[name="transform"][value="'+t.transformChoices.find(c=>c.correct).id+'"]').check();
  if(stage===2)await p.locator('#critical-input').fill(t.criticalPoints.filter((_,i)=>t.variant!==0||t.domainCells[2*i]||t.domainCells[2*i+1]||t.domainCells[2*i+2]).map(x=>x.label).join('; '));
  if(stage===3){for(let i=0;i<t.rationalSigns.length;i+=2)if(t.domainCells[i])await p.locator('[data-sign="'+i+'"]').selectOption(String(t.rationalSigns[i]));}
  if(stage===4){
   for(let i=0;i<t.solutionCells.length;i++){const b=p.locator('[data-cell="'+i+'"]');if(!await b.count()||!await b.isEnabled())continue;const pressed=await b.getAttribute('aria-pressed')==='true';if(pressed!==t.solutionCells[i])await b.click();}
   if(!t.solutionCells.some(Boolean))await p.getByRole('button',{name:'Нет решений',exact:true}).click();
  }
 }
 async function passStage(p,t){
  const before=await work(p);await fillStage(p,t,before.stage);await p.locator('#check-step').click();
  const accepted=await work(p);assert.equal(accepted.accepted,true,t.id+' stage '+before.stage+': '+await p.locator('#feedback').innerText());
  assert.equal(accepted.stage,before.stage,'Correct input must pause on the current step');
  await p.locator('#continue-step').click();
 }
 async function solve(p,t){let limit=8;while(!(await work(p)).complete&&limit-->0)await passStage(p,t);assert.equal((await work(p)).complete,true,t.id);}
 async function screenshot(p,name){if(!shots)return;fs.mkdirSync(shots,{recursive:true});await p.screenshot({path:path.join(shots,name+'.png'),fullPage:true});}
 async function checkReflow(p,label){
  const data=await p.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,wide:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1&&e.getBoundingClientRect().width>0).slice(0,12).map(e=>({tag:e.tagName,id:e.id,cls:e.className?.baseVal??e.className,right:e.getBoundingClientRect().right,text:e.textContent.slice(0,65)}))}));
  if(data.scroll>data.width+1){await screenshot(p,'overflow-'+label.replace(/[^a-z0-9-]/gi,'-'));console.log('REFLOW_DIAGNOSTIC',JSON.stringify(data));}
  assert(data.scroll<=data.width+1,'overflow '+label);
 }
 try{
  const context=await browser.newContext({viewport:{width:1280,height:950}});
  const page=await learner(context);
  const key=await page.evaluate(()=>window.__logTrainer.storageKey);
  assert.equal(typeof key,'string');assert(key.length>5);
  assert.equal((await work(page)).stage,0);
  assert.equal(await page.locator('#current-formula math').count(),1);
  await screenshot(page,'first-desktop');
  await page.evaluate(()=>localStorage.setItem('mathExamCourseProgress.v1','legacy-untouched'));
  const first=E.tasks[0];
  await page.locator('#check-step').click();assert.equal((await work(page)).stage,0);assert.equal(await page.locator('#feedback').getAttribute('data-kind'),'error');
  const wrongFeedback=await page.locator('#feedback').innerText();await page.reload();await page.waitForFunction(()=>window.__logTrainer);assert.equal(await page.locator('#feedback').innerText(),wrongFeedback);
  await page.locator('#hint-button').click();assert((await work(page)).helps>0);
  await fillStage(page,first,0);await page.locator('#check-step').click();const accepted=await state(page);
  await page.reload();await page.waitForFunction(()=>window.__logTrainer);assert.deepEqual(await state(page),accepted,'Accepted step survives reload');
  await page.locator('#continue-step').click();await passStage(page,first);
  await page.locator('#critical-input').fill('1/');const draft=await state(page);await page.reload();await page.waitForFunction(()=>window.__logTrainer);
  assert.deepEqual(await state(page),draft);assert.equal(await page.locator('#critical-input').inputValue(),'1/');
  await page.locator('#check-step').click();assert.equal((await work(page)).stage,2,'Malformed fraction is not accepted');
  await solve(page,first);assert((await state(page)).history.find(x=>x.taskId===first.id).assisted);
  const finished=await state(page);await page.reload();await page.waitForFunction(()=>window.__logTrainer);assert.deepEqual(await state(page),finished,'Reload does not duplicate result');

  let completed=1;
  for(const t of E.tasks.slice(1)){
   await chooseTask(page,t);await solve(page,t);completed++;
   if(t.variant===0){console.log('Completed family',t.familyId);if(['reciprocal','nested','exponential'].some(s=>t.familyId.includes(s)))await screenshot(page,'completed-'+t.familyId);}
  }
  assert.equal(completed,48);assert.equal((await state(page)).history.length,48);
  assert.equal(await page.evaluate(()=>localStorage.getItem('mathExamCourseProgress.v1')),'legacy-untouched');
  const end=await state(page);await page.reload();await page.waitForFunction(()=>window.__logTrainer);assert.deepEqual(await state(page),end);

  // An independent first encounter retains its status; a hint changes it honestly.
  const fresh=await browser.newContext();const independent=await learner(fresh);
  await chooseTask(independent,E.tasks[1],'independent');assert.equal((await work(independent)).stage,2);
  await passStage(independent,E.tasks[1]);assert.equal((await work(independent)).stage,4);
  await solve(independent,E.tasks[1]);assert.equal((await state(independent)).history[0].assisted,false);
  await chooseTask(independent,E.tasks[2],'independent');await independent.locator('#hint-button').click();await solve(independent,E.tasks[2]);
  assert.equal((await state(independent)).history.find(x=>x.taskId===E.tasks[2].id).assisted,true);
  await chooseTask(independent,E.tasks[3],'example');
  for(let i=0;i<6&&!(await work(independent)).complete;i++)await independent.locator('#continue-step').click();
  assert((await work(independent)).complete);assert((await state(independent)).history.find(x=>x.taskId===E.tasks[3].id).assisted);
  await independent.locator('[data-mode="independent"]').click();assert((await work(independent)).familiar);await solve(independent,E.tasks[3]);
  assert(!((await state(independent)).history.find(x=>x.taskId===E.tasks[3].id).mode==='independent'&&!(await state(independent)).history.find(x=>x.taskId===E.tasks[3].id).assisted),'A worked example cannot become a new independent success');
  await chooseTask(independent,E.tasks[1],'independent');await independent.locator('#retry-task').click();assert((await work(independent)).familiar);await solve(independent,E.tasks[1]);
  const retained=(await state(independent)).history.find(x=>x.taskId===E.tasks[1].id);assert.equal(retained.familiar,false);assert.equal(retained.assisted,false,'An honest earlier independent result survives a repeat');
  await chooseTask(independent,E.tasks[6]);await independent.locator('#preparation > summary').click();await independent.waitForFunction(()=>{const s=__logTrainer.getState();return s.work[s.taskId].helps>0;});await independent.locator('#preparation > summary').click();
  await independent.locator('[data-mode="independent"]').click();await independent.locator('#confirm-mode').click();assert((await work(independent)).familiar,'Reading task-specific preparation survives closing it and changing mode');

  // Topic selection and same-document deep links retain the previous draft.
  await chooseTask(independent,E.tasks[4],'independent');await independent.locator('#critical-input').fill('-7/3; 2,5');
  await independent.evaluate(id=>{location.hash='task/'+id;},E.tasks[5].id);await independent.waitForFunction(id=>window.__logTrainer.getState().taskId===id,E.tasks[5].id);
  await independent.evaluate(id=>{location.hash='task/'+id;},E.tasks[4].id);await independent.waitForFunction(id=>window.__logTrainer.getState().taskId===id,E.tasks[4].id);
  assert.equal(await independent.locator('#critical-input').inputValue(),'-7/3; 2,5');

  // Every family reflows; controls remain available at mobile width and 200% zoom.
  for(const f of E.families){const t=E.tasks.find(t=>t.familyId===f.id);await chooseTask(page,t);for(const width of [320,390,1280]){await page.setViewportSize({width,height:900});await checkReflow(page,f.id+'-'+width);}}
  await page.setViewportSize({width:390,height:900});await screenshot(page,'completed-mobile');
  const mobile=await learner(await browser.newContext({viewport:{width:320,height:900}}));await screenshot(mobile,'first-320');
  const check=mobile.locator('input[name="domain"]').first();await check.focus();await mobile.keyboard.press('Space');assert(await check.isChecked(),'Keyboard domain checkbox');
  await mobile.emulateMedia({reducedMotion:'reduce'});await mobile.evaluate(()=>document.body.style.zoom='2');await checkReflow(mobile,'200-percent');await mobile.evaluate(()=>document.body.style.zoom='');

  // Denied clipboard still leaves a selectable report for manual sending.
  await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(new Error('denied'))}});});
  await page.locator('#report-details > summary').click();
  await page.locator('#copy-report').click();assert(await page.locator('#report-text').isVisible());assert((await page.locator('#report-text').inputValue()).length>100);

  // Corrupt local data and stale tabs must not overwrite a newer attempt.
  const corrupt=await learner(await browser.newContext());await corrupt.evaluate(k=>localStorage.setItem(k,'{broken'),key);await corrupt.reload();await corrupt.waitForFunction(()=>window.__logTrainer);
  await corrupt.locator('input[name="domain"]').first().check();assert.equal(await corrupt.evaluate(k=>localStorage.getItem(k),key),'{broken');
  const beforeInvalid=await state(independent);const rejected=await independent.evaluate(()=>{try{window.__logTrainer.applyState({schema:1,taskId:'unknown',work:{},history:[]});return false;}catch(_){return true;}});assert(rejected);assert.deepEqual(await state(independent),beforeInvalid);
  const staleContext=await browser.newContext();const newer=await learner(staleContext),older=await learner(staleContext);
  await newer.locator('input[name="domain"]').first().check();const saved=await newer.evaluate(k=>localStorage.getItem(k),key);
  await older.waitForFunction(()=>document.querySelector('input[name="domain"]').disabled);assert.equal(await newer.evaluate(k=>localStorage.getItem(k),key),saved,'Stale tab leaves newer work intact');
  await older.locator('#load-newer').click();assert(!(await older.locator('input[name="domain"]').first().isDisabled()));assert.deepEqual(await state(older),await state(newer));

  // Real two-frame protocol: edits in both directions, exact drafts, no echo/storage.
  const mirrorContext=await browser.newContext();const parent=await mirrorContext.newPage();parent.on('pageerror',e=>errors.push(e.message));
  await parent.goto(origin+'/mirror-fixture');await parent.waitForFunction(()=>ready.student&&ready.teacher);
  const sf=parent.frameLocator('#student'),tf=parent.frameLocator('#teacher');
  await sf.locator('#check-step').click();await parent.waitForFunction(()=>updates.some(x=>x.name==='student'));
  const snapshot=await parent.evaluate(()=>updates.filter(x=>x.name==='student').at(-1).state);
  await parent.evaluate(s=>send('teacher','mathexam:apply-trainer-state',s),snapshot);
  await tf.locator('input[name="domain"]').first().waitFor();
  await parent.waitForFunction(s=>JSON.stringify(document.getElementById('teacher').contentWindow.__logTrainer.getState())===JSON.stringify(s),snapshot);
  const teachersBefore=await parent.evaluate(()=>updates.filter(x=>x.name==='teacher').length);
  await parent.waitForTimeout(120);assert.equal(await parent.evaluate(()=>updates.filter(x=>x.name==='teacher').length),teachersBefore,'Remote application does not echo');
  assert.equal(await parent.evaluate(k=>localStorage.getItem(k),key),null,'Embedded work never writes standalone storage');
  await tf.locator('#hint-button').click();await parent.waitForFunction(n=>updates.filter(x=>x.name==='teacher').length>n,teachersBefore);
  const teacherSnapshot=await parent.evaluate(()=>updates.filter(x=>x.name==='teacher').at(-1).state);
  await parent.evaluate(s=>send('student','mathexam:apply-trainer-state',s),teacherSnapshot);
  await parent.waitForFunction(s=>JSON.stringify(document.getElementById('student').contentWindow.__logTrainer.getState())===JSON.stringify(s),teacherSnapshot);
  await parent.evaluate(s=>{const frame=document.getElementById('teacher');delete ready.teacher;frame.onload=()=>{setTimeout(()=>send('teacher','mathexam:apply-trainer-state',s),100)};frame.src=frame.src+'&reload=1';},teacherSnapshot);
  await parent.waitForFunction(s=>ready.teacher&&JSON.stringify(document.getElementById('teacher').contentWindow.__logTrainer?.getState())===JSON.stringify(s),teacherSnapshot);
  assert.deepEqual(errors,[]);
  console.log('PROFILE_LOG_INEQUALITIES_BROWSER_OK: 48 tasks, guided/example/independent modes, wrong answers and hints, explicit continuation, notebook, task links, exact drafts, restore, report fallback, corrupt/stale storage, 320/390/1280px, keyboard and two-way silent mirror hydration.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(error=>{console.error(error);process.exitCode=1;server.close();});
