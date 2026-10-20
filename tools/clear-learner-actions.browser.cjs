'use strict';
// Run only in cloud CI: real pointer/keyboard/touch journeys for two affected trainers.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const artifacts=path.resolve(process.env.CLEAR_ACTIONS_ARTIFACTS||path.join(root,'artifacts/clear-learner-actions'));
const KEY='mathExamCourseProgress.v1';
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
const compact=text=>text.replace(/[\s\u2009]/g,'').replace(/−/g,'-');

async function serve(){
 const server=http.createServer((req,res)=>{
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch(_){res.writeHead(400).end();return;}
  if(pathname==='/favicon.ico'){res.writeHead(204).end();return;}
  const file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end('Not found');return;}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'}).end(data);});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 return{server,base:'http://127.0.0.1:'+server.address().port};
}
async function fits(page,selectors,label){
 const bad=await page.evaluate(selectors=>selectors.flatMap(selector=>[...document.querySelectorAll(selector)]
  .filter(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden')
  .map(el=>{const r=el.getBoundingClientRect();return{selector,left:r.left,right:r.right,width:innerWidth};}))
  .filter(r=>r.left < -1 || r.right > r.width+1),selectors);
 assert.deepEqual(bad,[],label+' keeps each relevant control within the screen');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' has no page overflow');
}
const percentState=page=>page.evaluate(()=>window.__PERCENT_TRAINER_TEST__.getState());
const percentFits=page=>fits(page,['#view-practice .task-card','#practice-question','#practice-answer-label','#practice-answer-hint','#practice-input','#practice-help','#practice-return-answer','#hint-btn','#learn-return-task','#basics-return'],'percentages');

async function percentages(page,base,width){
 // Select the real generator's fixed 40%-of-200 example; do not inject task HTML or answers.
 await page.addInitScript(()=>{
  localStorage.setItem('percentTrainer.v1',JSON.stringify({skill:'of',difficulty:'standard'}));
  const draws=[6.1/11,2.1/9];Math.random=()=>draws.length?draws.shift():0.1;
 });
 await page.goto(base+'/trainers/oge-1-5-trainers/percent-table-trainer.html');
 await page.waitForFunction(()=>document.documentElement.dataset.practicalMinimal==='ready'&&window.__PERCENT_TRAINER_TEST__);
 const input=page.locator('#practice-input'),label=page.locator('#practice-answer-label'),help=page.locator('#practice-help');
 const question=await page.locator('#practice-question').innerText(),labelText=await label.innerText();
 assert.match(question,/40\s*%/);assert.match(question,/200/);assert.match(labelText,/40\s*%/);assert.match(labelText,/200/);
 assert.equal(await label.getAttribute('for'),'practice-input');assert.equal(await input.getAttribute('aria-labelledby'),'practice-answer-label');
 assert.match(await input.getAttribute('aria-describedby'),/practice-answer-hint/);
 assert.match(await page.locator('#practice-answer-hint').innerText(),/[Вв]веди.*число/);
 await input.fill('12,5');const initial=await percentState(page);
 await percentFits(page);await page.locator('#view-practice .task-card').screenshot({path:path.join(artifacts,width+'-percent-question.png')});
 await page.locator('#hint-btn').click();await help.waitFor({state:'visible'});
 assert.match(await page.locator('#hint-stack').innerText(),/200.*100%/s);
 assert.match(await help.innerText(),/промежуточные.*итог всей задачи/s);
 assert.equal(await label.innerText(),labelText,'an intermediate basis hint does not change the requested final answer');
 assert.equal(await input.inputValue(),'12,5');const helped=await percentState(page);
 assert.equal(helped.taskState.hintLevel,1);assert.deepEqual(helped.stats,initial.stats);assert.deepEqual(helped.advanced,initial.advanced);
 await percentFits(page);await page.locator('#view-practice .task-card').screenshot({path:path.join(artifacts,width+'-percent-intermediate-help.png')});
 for(let i=0;i<2;i++){
  await page.locator('#practice-return-answer').click();
  assert.equal(await help.isVisible(),false);assert.equal(await input.inputValue(),'12,5');
  assert(await input.evaluate(el=>el===document.activeElement),'return focuses the final answer');
  assert.equal(await page.locator('#hint-btn').getAttribute('aria-expanded'),'false');
  await page.locator('#hint-btn').click();assert.equal(await help.isVisible(),true);
  assert.equal((await percentState(page)).taskState.hintLevel,1,'reopening help does not consume another hint or erase assistance');
 }
 await page.locator('#practice-return-answer').click();
 await page.locator('.main-nav [data-view="learn"]').click();
 await page.locator('#learn-return-task').waitFor({state:'visible'});await page.locator('#learn-return-task').click();
 assert.equal(await page.locator('#view-practice').isVisible(),true);assert.equal(await input.inputValue(),'12,5');
 assert.equal(await page.locator('#practice-question').innerText(),question);
 const returned=await percentState(page);assert.equal(returned.current.id,initial.current.id);assert.equal(returned.taskState.hintLevel,1);
 assert.deepEqual(returned.stats,initial.stats);assert.deepEqual(returned.advanced,initial.advanced);
 assert.equal(new URL(await page.locator('#basics-return').getAttribute('href'),page.url()).pathname,'/trainers/oge-basics/');
 assert.equal(await page.locator('#basics-return').isVisible(),true);
 await percentFits(page);await page.locator('#view-practice .task-card').screenshot({path:path.join(artifacts,width+'-percent-returned-draft.png')});
 await input.fill('80');await page.locator('#practice-check').click();
 const complete=await percentState(page);assert.equal(complete.taskState.outcome,'supported');
 assert.equal(complete.stats.of.independent,0);assert.equal(complete.stats.of.supported,1,'returning from help retains supported credit');
 return{fixedExample:'40% of 200',labels:true,intermediateHelp:true,draftRetained:true,returnFromLearning:true,supportedCredit:true};
}

const equationState=page=>page.evaluate(key=>({progress:localStorage.getItem(key),solved:[...maraState.solved],clean:[...maraState.clean],shown:[...maraState.shown],record:{...maraRec(BANK[0].id)}}),KEY);
async function termState(lab,id){const term=lab.locator('.transfer-term[data-term-id="'+id+'"]');return{side:await term.evaluate(el=>el.closest('[data-side]').dataset.side),text:compact(await term.innerText())};}
async function assertTerm(lab,id,side,text){assert.deepEqual(await termState(lab,id),{side,text});}
async function pointerDrag(page,source,target){
 await source.scrollIntoViewIfNeeded();const start=await source.boundingBox(),end=await target.boundingBox();assert(start&&end);
 const sx=start.x+start.width/2,sy=start.y+start.height/2,tx=end.x+end.width/2,ty=end.y+end.height/2;
 await page.mouse.move(sx,sy);await page.mouse.down();
 await page.mouse.move(sx+9,sy,{steps:3});await page.mouse.move(tx,ty,{steps:12});
 // Chromium needs dragover before drop; a second pointer move supplies it.
 await page.mouse.move(tx+1,ty,{steps:2});await page.mouse.up();
}
async function equations(page,base,width){
 await page.goto(base+'/trainers/oge-task9-equations.html');
 const card=page.locator('#mara-list > .task-card:not([hidden])');await card.waitFor();
 const main=card.locator(':scope > .field input').first(),helpButton=card.getByRole('button',{name:'Хочешь подсказку?',exact:true});
 assert.equal(await main.getAttribute('aria-label'),'Чему равен x?');
 await main.fill('123');const initial=await equationState(page);
 await helpButton.click();const panel=card.locator('.minimal-hint-panel'),step=panel.locator('.step.active'),lab=step.locator('.transfer-lab');await lab.waitFor();
 const left=step.getByRole('textbox',{name:'Число перед x после сложения',exact:true}),right=step.getByRole('textbox',{name:'Число справа после сложения',exact:true});
 assert.equal(await left.isVisible(),true);assert.equal(await right.isVisible(),true);
 assert.match(await step.locator('.canon-fields').innerText(),/Число перед x/);assert.match(await step.locator('.canon-fields').innerText(),/Число справа/);
 await left.fill('7');await right.fill('8');
 await assertTerm(lab,'0','L','+4x');await assertTerm(lab,'1','L','-4');await assertTerm(lab,'2','R','+16');await assertTerm(lab,'3','R','+2x');
 const fit=()=>fits(page,['#mara-list > .task-card:not([hidden])','#mara-list > .task-card:not([hidden]) input','.minimal-hint-panel:not([hidden]) .transfer-lab','.minimal-hint-panel:not([hidden]) .transfer-board','.minimal-hint-panel:not([hidden]) .transfer-side','.minimal-hint-panel:not([hidden]) .transfer-term','.minimal-hint-panel:not([hidden]) .canon-fields label'],'equation help');
 await fit();await lab.screenshot({path:path.join(artifacts,width+'-equation-before-drag.png')});
 await pointerDrag(page,lab.locator('[data-term-id="1"]'),lab.locator('[data-side="R"]'));
 await assertTerm(lab,'1','R','+4');assert.match(await lab.innerText(),/перенесено.*стало/s);
 await fit();await lab.screenshot({path:path.join(artifacts,width+'-equation-pointer-crossing.png')});
 await lab.locator('[data-term-id="1"]').press('ArrowLeft');await assertTerm(lab,'1','L','-4');
 // A native drop consumes an accidental click for 350ms. These are deliberate later actions.
 await page.waitForTimeout(380);
 await lab.locator('[data-term-id="1"]').press('Enter');await assertTerm(lab,'1','R','+4');
 await lab.locator('[data-term-id="1"]').press('Space');await assertTerm(lab,'1','L','-4');
 const activate=async locator=>width<600?locator.tap():locator.click();
 await activate(lab.locator('[data-term-id="1"]'));await assertTerm(lab,'1','R','+4');
 await activate(lab.locator('[data-term-id="3"]'));await assertTerm(lab,'3','L','-2x');
 assert.match(await lab.innerText(),/Теперь сложи числа перед x.*Впиши оба результата/s);
 await lab.getByRole('button',{name:'Перейти к сложению',exact:true}).click();
 assert(await left.evaluate(el=>el===document.activeElement));assert.equal(await left.inputValue(),'7');assert.equal(await right.inputValue(),'8');assert.equal(await main.inputValue(),'123');
 const after=await equationState(page);assert.equal(after.progress,initial.progress);assert.deepEqual(after.solved,initial.solved);assert.deepEqual(after.clean,initial.clean);assert.deepEqual(after.shown,initial.shown);
 assert.equal(after.record.hinted,true,'using the model retains the existing assistance history');assert.equal(after.record.counted,false);assert.equal(after.record.verdict,'');
 await fit();await panel.screenshot({path:path.join(artifacts,width+'-equation-ready-to-collect.png')});
 await panel.getByRole('button',{name:'Вернуться к задаче',exact:true}).click();
 assert.equal(await panel.isVisible(),false);assert(await main.evaluate(el=>el===document.activeElement));assert.equal(await main.inputValue(),'123');
 await helpButton.click();await assertTerm(lab,'1','R','+4');await assertTerm(lab,'3','L','-2x');
 assert.equal(await left.inputValue(),'7');assert.equal(await right.inputValue(),'8');assert.deepEqual(await equationState(page),after);
 await helpButton.click();assert.equal(await panel.isVisible(),false);await helpButton.click();assert.equal(await panel.isVisible(),true);
 assert.deepEqual(await equationState(page),after);await fit();
 return{realPointerDrag:true,reverseCrossing:true,keyboard:true,tap:width<600,click:width>=600,labels:true,draftsRetained:true,noAutomaticAward:true};
}

(async()=>{
 fs.mkdirSync(artifacts,{recursive:true});const{server,base}=await serve();let browser,livePage,liveContext;const errors=[],evidence=[];
 try{
  browser=await chromium.launch({headless:true});
  for(const width of[320,360,1280]){
   const context=await browser.newContext({viewport:{width,height:900},hasTouch:width<600,reducedMotion:'reduce'});liveContext=context;
   await context.tracing.start({screenshots:true,snapshots:true});
   const item={width};
   for(const[name,journey]of[['percentages',percentages],['equations',equations]]){
    const page=await context.newPage();livePage=page;page.setDefaultTimeout(15000);
    page.on('pageerror',e=>errors.push(width+' '+name+': '+e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(width+' '+name+': '+m.text());});
    item[name]=await journey(page,base,width);await page.close();livePage=null;
   }
   evidence.push(item);await context.tracing.stop({path:path.join(artifacts,width+'-trace.zip')});await context.close();liveContext=null;
   console.log('PASS '+width+'px: explicit questions, return paths, retained drafts, real term drag, keyboard/touch and no automatic credit');
  }
  assert.deepEqual(errors,[],'no runtime or resource errors');fs.writeFileSync(path.join(artifacts,'evidence.json'),JSON.stringify({evidence,errors},null,2));
 }catch(error){
  if(livePage)await livePage.screenshot({path:path.join(artifacts,'failure.png'),fullPage:true}).catch(()=>{});
  if(liveContext)await liveContext.tracing.stop({path:path.join(artifacts,'failure-trace.zip')}).catch(()=>{});
  fs.writeFileSync(path.join(artifacts,'failure.json'),JSON.stringify({message:error.message,stack:error.stack,evidence,errors},null,2));throw error;
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
