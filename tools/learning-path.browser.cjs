'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const harness = `<!doctype html><meta charset="utf-8"><title>Managed Path integration fixture</title><style>iframe{width:48%;height:900px;border:0}</style><script>
window.messages=[];window.framesById={};
addEventListener('message',e=>{if(e.origin!==location.origin)return;for(const [id,f]of Object.entries(framesById))if(e.source===f.contentWindow)messages.push({id,data:e.data});});
window.add=(id)=>{let f=document.createElement('iframe');f.id=id;f.src='/ege-baza/path/index.html?learning=1&parentOrigin='+encodeURIComponent(location.origin)+'&channel=fixture_channel_'+id+'#lesson=round';framesById[id]=f;document.body.append(f);};
window.hydrate=(id,payload)=>{const ready=messages.filter(m=>m.id===id&&m.data.type==='ready').at(-1);if(!ready)throw Error('not ready');const m=ready.data;framesById[id].contentWindow.postMessage({protocol:m.protocol,version:m.version,channel:m.channel,instance:m.instance,type:'hydrate',payload},location.origin);};
window.latest=(id)=>messages.filter(m=>m.id===id&&m.data.type==='change').at(-1)?.data.payload;
</script><body>`;
const server = http.createServer((req,res)=>{try{
 const url=new URL(req.url,'http://local');if(url.pathname==='/fixture'){res.setHeader('Content-Type','text/html');res.end(harness);return;}
 let p=path.resolve(ROOT,'.'+decodeURIComponent(url.pathname));if(!p.startsWith(ROOT+path.sep))throw Error();if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');
 res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html'})[path.extname(p)]||'text/plain');res.end(fs.readFileSync(p));
}catch(e){res.writeHead(404);res.end();}});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const context=await browser.newContext({reducedMotion:'reduce'}), page=await context.newPage(), errors=[];page.on('pageerror',e=>errors.push(e.message));
  await context.addInitScript(()=>localStorage.setItem('mathexam.ege-baza.path.v1','standalone-sentinel'));
  await page.goto(origin+'/fixture');await page.evaluate(()=>{add('a');add('b');});
  await page.waitForFunction(()=>['a','b'].every(id=>messages.some(m=>m.id===id&&m.data.type==='ready')));
  const frame=id=>page.frames().find(f=>f.url().includes('channel=fixture_channel_'+id));
  assert.equal(await frame('a').locator('#answer').count(),0,'must not generate a task before hydration');
  async function spec(id,seed=10){return frame('a').evaluate(({id,seed})=>({trainerId:'ege-path',contentId:id,id,seed,contentVersion:1,task:PathData.task(id,seed)}),{id,seed});}
  async function hydrate(id,taskSpec,state=null,readOnly=false){const before=await page.evaluate(id=>messages.filter(m=>m.id===id&&m.data.type==='applied').length,id);await page.evaluate(({id,payload})=>window.hydrate(id,payload),{id,payload:{taskSpec,state,readOnly}});await page.waitForFunction(({id,before})=>messages.filter(m=>m.id===id&&m.data.type==='applied').length>before,{id,before});const last=await page.evaluate(id=>messages.filter(m=>m.id===id&&m.data.type==='applied').at(-1).data.payload,id);assert(!last.error,`${id}: ${JSON.stringify(last)} ${taskSpec.id}`);}
  async function change(id,action){const before=await page.evaluate(id=>messages.filter(m=>m.id===id&&m.data.type==='change').length,id);await action(frame(id));const barrier=Date.now()+'-'+Math.random();await frame(id).evaluate(barrier=>parent.postMessage({type:'fixture-barrier',barrier},location.origin),barrier);await page.waitForFunction(({id,barrier})=>messages.some(m=>m.id===id&&m.data.barrier===barrier),{id,barrier});await page.waitForFunction(({id,before})=>messages.filter(m=>m.id===id&&m.data.type==='change').length>before,{id,before});return page.evaluate(id=>latest(id),id);}
  const ids=await frame('a').evaluate(()=>PathData.meta.map(m=>m.id)), kinds=new Set();assert.equal(ids.length,107);
  for(const id of ids){const taskSpec=await spec(id);await hydrate('a',taskSpec);let event=await change('a',f=>f.locator('#answer').fill('−3/7'));assert.equal(event.state.work.draft,'−3/7');assert.equal(event.kind,'input');event=await change('a',f=>f.locator('[data-stage="1"]').click());assert.equal(event.kind,'hint');assert.equal(event.state.work.help,true);kinds.add(taskSpec.task.model.kind);assert((await frame('a').locator('#model').innerText()).length>0);await hydrate('b',taskSpec,event.state,true);assert.equal(await frame('a').locator('#model').innerText(),await frame('b').locator('#model').innerText(),id);assert.deepEqual(await frame('a').evaluate(()=>[...document.querySelectorAll('#model input,#model select')].map(x=>x.value)),await frame('b').evaluate(()=>[...document.querySelectorAll('#model input,#model select')].map(x=>x.value)),id);}
  // Stateful models: changes survive a fresh renderer and match in the observer.
  const cases=[
   ['equations-linear',async f=>{await f.locator('.term[data-s="1"]').first().click();await f.locator('[data-sign="-1"]').click();await f.locator('#moveTerm').click();await f.locator('#collect').click();await f.locator('#divisor').fill('7/3');}],
   ['graphs',async f=>f.locator('#px').evaluate(el=>{el.value='1.5';el.dispatchEvent(new Event('input',{bubbles:true}));})],
   ['box',async f=>f.locator('#angle').evaluate(el=>{el.value='117';el.dispatchEvent(new Event('input',{bubbles:true}));})],
   ['triangle',async f=>{await f.locator('#build').click();await f.locator('[data-choice="1"]').click();}],
   ['integers',async f=>f.locator('[data-digit="1"]').click()],
   ['motion',async f=>f.locator('#part').evaluate(el=>{el.value='3';el.dispatchEvent(new Event('input',{bubbles:true}));})],
   ['reasoning',async f=>f.locator('#length').click()],
   ['numberline',async f=>f.locator('#testx').evaluate(el=>{el.value='4';el.dispatchEvent(new Event('input',{bubbles:true}));})],
   ['practice-fraction-add',async f=>{await f.locator('[data-share="0"]').click();await f.locator('#checkShares').click();await f.locator('[data-share="1"]').click();}],
   ['practice-percent-part',async f=>{await f.locator('[data-base="whole"]').click();await f.locator('#percentSlide').evaluate(el=>{el.value='41';el.dispatchEvent(new Event('input',{bubbles:true}));});}],
   ['practice-ratio-parts',async f=>{await f.locator('[data-ratio="1"]').click();await f.locator('#checkRatio').click();}],
   ['practice-grid-cut',async f=>{await f.locator('#auxRect').click();await f.locator('#auxDiagonal').click();}],
   ['practice-inequality-match',async f=>f.locator('#testPoint').evaluate(el=>{el.value=el.max;el.dispatchEvent(new Event('input',{bubbles:true}));})],
   ['practice-digits-multiple',async f=>{await f.locator('[data-place="0"]').selectOption('3');await f.locator('#checkDigits').click();}],
   ['practice-delivery',async f=>f.locator('[data-item="1"]').click()],
   ['practice-logic-all',async f=>f.locator('#model details').first().locator('summary').click()],
   ['round',async f=>f.locator('#revealPlan').click()]
  ];
  for(const[id,action]of cases){const taskSpec=await spec(id);await hydrate('a',taskSpec);await change('a',f=>f.locator('[data-stage="1"]').click());await change('a',action);const payload=await page.evaluate(()=>latest('a'));assert.equal(payload.kind,'model',id);await hydrate('b',taskSpec,payload.state,true);assert.equal(await frame('a').locator('#model').innerText(),await frame('b').locator('#model').innerText(),id+' text');assert.equal(await frame('a').locator('#model').evaluate(el=>[...el.querySelectorAll('svg')].map(x=>x.outerHTML).join('')),await frame('b').locator('#model').evaluate(el=>[...el.querySelectorAll('svg')].map(x=>x.outerHTML).join('')),id+' drawing');assert.deepEqual(await frame('a').evaluate(()=>[...document.querySelectorAll('#model input,#model select')].map(x=>x.value)),await frame('b').evaluate(()=>[...document.querySelectorAll('#model input,#model select')].map(x=>x.value)),id+' inputs');assert.deepEqual(await frame('a').evaluate(()=>[...document.querySelectorAll('#model [aria-pressed]')].map(x=>x.getAttribute('aria-pressed'))),await frame('b').evaluate(()=>[...document.querySelectorAll('#model [aria-pressed]')].map(x=>x.getAttribute('aria-pressed'))),id+' selection');}
  // Exact raw draft, rejected answer, hint, step progression and silent restore.
  let taskSpec=await spec('equations-fractions',80);await hydrate('a',taskSpec);await change('a',f=>f.locator('#answer').fill('0,333333'));let event=await change('a',f=>f.locator('#answerForm').evaluate(el=>el.requestSubmit()));assert.equal(event.kind,'check');assert.equal(event.details.answer,'0,333333');assert.equal(event.state.work.done,false);await hydrate('b',taskSpec,event.state,true);assert.equal(await frame('b').locator('#answer').inputValue(),'0,333333');assert.match(await frame('b').locator('#feedback').innerText(),/неверно/);
  await change('a',f=>f.locator('[data-stage="2"]').click());event=await change('a',f=>f.locator('#hint').click());assert.equal(event.details.level,1);await hydrate('b',taskSpec,event.state,true);assert.equal(await frame('b').locator('#hintText').innerText(),taskSpec.task.steps[0].why);
  await change('a',f=>f.locator('#answer').fill(String(taskSpec.task.steps[0].a)));event=await change('a',f=>f.locator('#answerForm').evaluate(el=>el.requestSubmit()));assert.equal(event.details.scope,'step');assert.equal(event.details.step,0);assert.equal(event.state.work.step,1);assert.deepEqual(event.details.answers,[]);assert.deepEqual(event.state.work.answers,[String(taskSpec.task.steps[0].a)]);await hydrate('b',taskSpec,event.state,true);
  let count=await page.evaluate(()=>messages.filter(m=>m.id==='b'&&m.data.type==='change').length);await frame('b').locator('#answer').evaluate(el=>{el.value='99';el.dispatchEvent(new Event('input',{bubbles:true}));el.closest('form').requestSubmit();});assert.equal(await page.evaluate(()=>messages.filter(m=>m.id==='b'&&m.data.type==='change').length),count,'read-only cannot emit changes');
  await hydrate('b',taskSpec,event.state,true);assert.equal(await page.evaluate(()=>messages.filter(m=>m.id==='b'&&m.data.type==='change').length),count,'hydrate must not fabricate events');
  // Every guided step carries its validated raw prefix, including after hydration.
  await hydrate('a',taskSpec,event.state,false);
  for(let i=1;i<taskSpec.task.steps.length;i++){
    const raw=await frame('a').evaluate(i=>PathData.answerText(PathData.task('equations-fractions',80).steps[i]),i);
    await change('a',f=>f.locator('#answer').fill(raw));event=await change('a',f=>f.locator('#answerForm').evaluate(el=>el.requestSubmit()));
    assert.equal(event.details.step,i);assert.equal(event.details.answers.length,i);assert.equal(event.state.work.answers.length,i+1);assert.equal(event.state.work.step,i+1);
    await hydrate('b',taskSpec,event.state,true);
  }
  assert.equal(event.state.work.done,true);assert.equal(event.state.work.help,true);assert.match(await frame('b').locator('#lesson').innerText(),/Разбор завершён/);
  const invalid=structuredClone(event.state);invalid.work.answers[0]='invalid answer';
  assert.equal(await frame('a').evaluate(({invalid,taskSpec})=>{try{PathManagedState.validate(invalid,taskSpec);return false;}catch(_){return true;}},{invalid,taskSpec}),true,'invalid prefix cannot be restored');
  await change('a',f=>f.locator('[data-stage="3"]').click());const before=await frame('a').locator('.task').innerText();event=await change('a',f=>f.locator('#new').click());assert.equal(event.kind,'new-task');assert.equal(await frame('a').locator('.task').innerText(),before,'new task needs parent assignment');
  // Same tab may reopen on another device without reading its standalone history.
  const saved=event.state;await frame('a').goto(frame('a').url().replace('#','&reload=1#'));await page.waitForFunction(()=>messages.filter(m=>m.id==='a'&&m.data.type==='ready').length>=2);await hydrate('a',taskSpec,saved,false);assert.equal(await frame('a').locator('.task').innerText(),before);assert.equal(await frame('a').evaluate(()=>localStorage.getItem('mathexam.ege-baza.path.v1')),'standalone-sentinel');
  // Hydration renders the pinned task, not an updated client generator.
  await frame('a').evaluate(()=>PathData.task=()=>{throw Error('must not regenerate pinned task');});await hydrate('a',taskSpec,saved,false);
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{framesById.a.style.width='100%';framesById.b.hidden=true;});assert(await frame('a').evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.deepEqual(errors,[]);console.log('LEARNING_PATH_BROWSER_OK: 107 routes; '+kinds.size+' model kinds; semantic controls/figures, teacher read-only, exact drafts/feedback/hints/steps, silent hydrate, reload, parent new-task, pinned task and standalone isolation.');
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
