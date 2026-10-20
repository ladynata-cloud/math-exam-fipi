'use strict';

// Additional real-browser contract for the per-function discovery dialog.
// Run in cloud CI after copying this file to tools/ and the candidate trainer
// to trainers/. TASK11_DISCOVERY_ROOT/FILE also permit an isolated candidate.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(process.env.TASK11_DISCOVERY_ROOT||path.join(__dirname,'..'));
const file=path.resolve(process.env.TASK11_DISCOVERY_FILE||path.join(root,'trainers/oge-task11-graphs-trainer.html'));
const artifacts=path.resolve(process.env.TASK11_DISCOVERY_ARTIFACTS||path.join(root,'artifacts/task11-discovery'));
const KEY='mathExamCourseProgress.v1';
const URL_PATH='/trainers/oge-task11-graphs-trainer.html';
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};

async function serve(){
 assert(fs.existsSync(file),'candidate trainer exists');
 const server=http.createServer((req,res)=>{
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch(_){res.writeHead(400).end();return;}
  if(pathname==='/favicon.ico'){res.writeHead(204).end();return;}
  const target=pathname===URL_PATH?file:path.resolve(root,'.'+pathname);
  if(target!==file&&!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(target,(error,body)=>{if(error){res.writeHead(404).end('Not found');return;}res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream'}).end(body);});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 return{server,url:'http://127.0.0.1:'+server.address().port+URL_PATH};
}

async function fits(page,label){
 const bad=await page.evaluate(()=>{
  const selectors=['#m4','#m4 .card','#m4-graphs','#m4-desc','#m4-desc .row','#m4-desc select','#m4-desc .function-help','#t11-help-dialog[open]','#t11-help-dialog[open] input','#t11-help-dialog[open] select','#t11-help-graph svg'];
  return selectors.flatMap(selector=>[...document.querySelectorAll(selector)].filter(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden').map(el=>{const r=el.getBoundingClientRect();return{selector,left:r.left,right:r.right,width:innerWidth};})).filter(r=>r.left < -1 || r.right > r.width+1);
 });
 assert.deepEqual(bad,[],label+' horizontal element bounds');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' page width');
 const dialog=page.locator('#t11-help-dialog');
 if(await dialog.isVisible()){
  const r=await dialog.boundingBox(),height=page.viewportSize().height;
  assert(r.y>=-1&&r.y+r.height<=height+1,label+' dialog fits viewport vertically');
 }
}

const helpButton=(page,index)=>page.locator('#m4-desc button.function-help[data-i="'+index+'"]');
const readState=page=>page.evaluate(()=>window.Task11Discovery.getState());
const drafts=page=>page.evaluate(()=>({matches:[...document.querySelectorAll('#m4-desc select')].map(s=>s.value),answer:document.getElementById('m4-answer').value}));
const grading=page=>page.evaluate(key=>({progress:localStorage.getItem(key),attempts:M4.attempts,done:M4.done,shown:M4.shown,lastTry:M4.lastTry}),KEY);
async function assertUntouched(page,draft,grade,label){
 assert.deepEqual(await drafts(page),draft,label+' retains all three matching drafts');
 assert.deepEqual(await grading(page),grade,label+' does not grade or write progress');
 assert.equal(await page.locator('#m4-good').isVisible(),false,label+' no success reveal');
 assert.equal(await page.locator('#m4-razbor').isVisible(),false,label+' no matching solution reveal');
}
async function openFunction(page,index){
 const trigger=helpButton(page,index);assert.equal(await trigger.count(),1,'function help '+index+' exists');
 await trigger.focus();await page.keyboard.press('Enter');
 await page.locator('#t11-help-dialog').waitFor({state:'visible'});
 assert.equal(await page.locator('#t11-help-dialog').getAttribute('open')!==null,true,'native modal is open');
 assert.equal((await readState(page)).index,index,'dialog describes the selected function');
 assert(await page.locator('#t11-help-formula').innerText(),'selected function formula is displayed');
 assert.equal(await page.locator('#t11-help-graph svg').count(),1,'selected function has a real graph');
}
async function closeFunction(page,index,method){
 if(method==='escape')await page.keyboard.press('Escape');else await page.locator('#t11-help-close').click();
 await page.locator('#t11-help-dialog').waitFor({state:'hidden'});
 assert.equal(await helpButton(page,index).evaluate(button=>button===document.activeElement),true,'closing restores focus to the same function');
}
async function deeper(page){
 await page.locator('#t11-help-start').click();
 assert.equal(await page.locator('#t11-help-observation').isVisible(),true,'first visual explanation opens');
 assert.equal((await readState(page)).started,true,'first help step recorded');
 await page.locator('#t11-help-highlight').click();
 assert.equal(await page.locator('#t11-help-look').isVisible(),true,'nested explanation opens');
 assert.equal((await readState(page)).highlighted,true,'nested highlight recorded');
 const marks=page.locator('#t11-help-graph svg [data-discovery-highlight]');
 assert(await marks.count()>0,'nested help draws an actual highlighted feature');
 assert(await marks.first().isVisible(),'highlight is visible in the model');
}
async function changeParameter(page){
 const control=page.locator('#t11-help-controls [data-param]').first();
 assert(await control.count()>0,'each function offers a meaningful parameter');
 const meta=await control.evaluate(input=>({tag:input.tagName,type:input.type,key:input.dataset.param,value:input.value,min:Number(input.min),max:Number(input.max),options:input.options?[...input.options].map(o=>o.value):[]}));
 const beforeFormula=await page.locator('#t11-help-formula').innerHTML();
 const beforeGraph=await page.locator('#t11-help-graph svg').innerHTML();
 if(meta.tag==='SELECT'){
  const next=meta.options.find(value=>value!==meta.value);assert.notEqual(next,undefined,'parameter has another allowed value');await control.selectOption(next);
 }else{
  assert.equal(meta.type,'range','parameter is keyboard-operable range');
  await control.focus();await page.keyboard.press(Number(meta.value)<meta.max?'ArrowRight':'ArrowLeft');
 }
 assert.notEqual(await control.inputValue(),meta.value,'keyboard/select input changes parameter');
 assert.notEqual(await page.locator('#t11-help-formula').innerHTML(),beforeFormula,'displayed experimental formula changes');
 assert.notEqual(await page.locator('#t11-help-graph svg').innerHTML(),beforeGraph,'parameter changes the actual graph');
 assert.equal(await page.locator('#t11-help-changed').isVisible(),true,'changed model is explicitly identified');
 assert.equal(await page.locator('#t11-help-original').isVisible(),true,'original formula is shown for comparison with the experiment');
 assert.match(await page.locator('#t11-help-changed').innerText(),/измен|эксперимент|исход/i,'changed-model notice has meaningful wording');
 assert.equal((await readState(page)).changed,true);
 return{key:meta.key,value:await control.inputValue()};
}
async function movePoint(page){
 const control=page.locator('#t11-help-x');
 const before=await readState(page);
 const readout=await page.locator('#t11-help-readout').innerText();
 const bounds=await control.evaluate(input=>({value:Number(input.value),max:Number(input.max)}));
 await control.focus();await page.keyboard.press(bounds.value<bounds.max?'ArrowRight':'ArrowLeft');
 assert.notEqual((await readState(page)).pointX,before.pointX,'the learner moves the actual inspection point');
 assert.notEqual(await page.locator('#t11-help-readout').innerText(),readout,'moving the point updates its coordinates');
}

async function main(){
 fs.mkdirSync(artifacts,{recursive:true});
 const{server,url}=await serve();let browser,livePage;const errors=[],evidence=[];
 try{
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
  for(const width of[320,360,1280]){
   const context=await browser.newContext({viewport:{width,height:900}});
   await context.tracing.start({screenshots:true,snapshots:true});
   const page=await context.newPage();livePage=page;
   page.on('pageerror',error=>errors.push(width+': '+error.message));
   page.on('console',message=>{if(message.type()==='error')errors.push(width+': '+message.text());});
   await page.goto(url);await page.waitForSelector('#m4-graphs svg');
   assert.equal(await page.locator('#m4-graphs svg').count(),3,'three graphs on first screen');
   assert.equal(await page.locator('#m4-desc select').count(),3,'three function matching inputs');
   assert.equal(await page.locator('#m4-desc button.function-help').count(),3,'each function has its own help');
   const fingerprints=await page.locator('#m4-graphs svg').evaluateAll(graphs=>graphs.map(svg=>[...svg.querySelectorAll('polyline')].map(p=>p.getAttribute('points')).join('|')));
   assert(fingerprints.every(Boolean),'each graph includes a plotted function');
   assert.equal(new Set(fingerprints).size,3,'the initial graphs are visibly distinct');
   assert.equal(await page.locator('#t11-help-dialog').isVisible(),false,'help is opt-in');
   await fits(page,width+' initial');
   await page.screenshot({path:path.join(artifacts,width+'-01-first-question.png'),fullPage:true});

   for(let i=0;i<3;i++)await page.locator('#m4-desc select').nth(i).selectOption(['2','3','1'][i]);
   const draft=await drafts(page),grade=await grading(page);assert.equal(draft.answer,'231');
   const originalStates=[],modifiedStates=[],initialFormulas=[],originalLabels=[];
   for(let i=0;i<3;i++){
    await openFunction(page,i);
    const original=await readState(page);originalStates.push(original);
    assert.equal(original.changed,false,'function '+i+' starts from its own original parameters');
    assert.equal(original.started,false,'function '+i+' does not inherit another function\'s nested help');
    assert.equal(original.highlighted,false,'function '+i+' has no inherited highlight');
    assert.equal(await page.locator('#t11-help-changed').isVisible(),false);
    initialFormulas.push(await page.locator('#t11-help-formula').innerHTML());
    originalLabels.push(await page.locator('#t11-help-original').innerHTML());
    await fits(page,width+' function '+i+' help');
    if(i===0)await page.locator('#t11-help-dialog').screenshot({path:path.join(artifacts,width+'-02-function-a-help.png')});
    await deeper(page);
    await fits(page,width+' function '+i+' nested');
    const returnBox=await page.locator('#t11-help-close').boundingBox();
    assert(returnBox&&returnBox.y>=0&&returnBox.y+returnBox.height<=900,'return to the task stays on screen after deeper help');
    if(i===0)await page.locator('#t11-help-dialog').screenshot({path:path.join(artifacts,width+'-03-function-a-discovery.png')});
    if(width===360&&i>0)await page.locator('#t11-help-dialog').screenshot({path:path.join(artifacts,width+'-03-function-'+['a','b','c'][i]+'-discovery.png')});
    await changeParameter(page);
    await movePoint(page);
    assert.equal(await page.locator('#t11-help-original').innerHTML(),originalLabels[i],'original formula remains unchanged beside experiment');
    modifiedStates.push(await readState(page));
    await fits(page,width+' function '+i+' changed parameter');
    if(i===0)await page.locator('#t11-help-dialog').screenshot({path:path.join(artifacts,width+'-04-function-a-experiment.png')});
    await assertUntouched(page,draft,grade,'function '+i+' exploration');
    await closeFunction(page,i,i===1?'button':'escape');
    await assertUntouched(page,draft,grade,'function '+i+' close');
   }

   // Return to each item after changing the other two; compare the actual
   // dialog controls/state, rather than only a generic "help opened" flag.
   for(let i=0;i<3;i++){
    await openFunction(page,i);
    assert.deepEqual(await readState(page),modifiedStates[i],'function '+i+' keeps its independent parameters and nested position');
    assert.equal(await page.locator('#t11-help-observation').isVisible(),true);
    assert.equal(await page.locator('#t11-help-look').isVisible(),true);
    assert(await page.locator('#t11-help-graph svg [data-discovery-highlight]').count()>0);
    if(i===0){
     await page.locator('#t11-help-reset').click();
     const reset=await readState(page);
     assert.deepEqual(reset.values,originalStates[i].values,'reset restores this function\'s parameters');
     assert.equal(reset.pointX,originalStates[i].pointX,'reset restores original inspection point');
     assert.equal(reset.changed,false);
     assert.equal(await page.locator('#t11-help-formula').innerHTML(),initialFormulas[i],'reset restores the displayed original model formula');
     assert.equal(await page.locator('#t11-help-changed').isVisible(),false);
     assert.equal(await page.locator('#t11-help-original').innerHTML(),originalLabels[i]);
    }
    await closeFunction(page,i,'button');await assertUntouched(page,draft,grade,'function '+i+' resumed/reset');
   }

   await page.locator('#m4-next').click();
   assert.equal(await page.locator('#t11-help-dialog').isVisible(),false);
   assert.deepEqual(await drafts(page),{matches:['','',''],answer:''},'a new task starts with new matching inputs');
   for(let i=0;i<3;i++){
    await openFunction(page,i);const state=await readState(page);
    assert.equal(state.changed,false,'new task resets model '+i);
    assert.equal(state.started,false,'new task resets nested step '+i);
    assert.equal(state.highlighted,false,'new task resets highlight '+i);
    assert.equal(await page.locator('#t11-help-changed').isVisible(),false);
    await closeFunction(page,i,'escape');
   }
   assert.deepEqual(await grading(page),grade,'a new task and new help do not grade or write progress');
   await fits(page,width+' next task');
   evidence.push({width,graphs:3,independentFunctions:3,nestedSteps:true,highlight:true,reset:true,draftsRetained:true,focusReturn:true,noAutoGrade:true});
   await context.tracing.stop({path:path.join(artifacts,width+'-trace.zip')});await context.close();livePage=null;
   console.log('PASS '+width+'px: three graphs, three independent discoveries, reset, keyboard return and untouched drafts');
  }
  assert.deepEqual(errors,[],'no browser or resource errors');
  fs.writeFileSync(path.join(artifacts,'evidence.json'),JSON.stringify({ok:true,evidence,errors},null,2)+'\n');
  console.log('TASK11_DISCOVERY_BROWSER_OK');
 }catch(error){
  if(livePage)await livePage.screenshot({path:path.join(artifacts,'failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(artifacts,'evidence.json'),JSON.stringify({ok:false,evidence,errors,failure:error.stack||String(error)},null,2)+'\n');
  throw error;
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
