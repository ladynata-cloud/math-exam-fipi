'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=process.env.SEARCH_ENTRY_PROOF_OUTPUT||(process.env.SEARCH_ENTRY_ARTIFACTS?path.join(process.env.SEARCH_ENTRY_ARTIFACTS,'proof'):path.join(os.tmpdir(),'search-entry-proof-evidence'));
const fixtures=require('./fixtures/search-entry-proof-legacy.json');
const ids=['ch4-p1-t2-proof-angle-sum','ch2-p3-t2-proof-asa'];
const passes=[],errors=[];let server,browser,base,failure=null;
fs.mkdirSync(OUT,{recursive:true});
const sha=v=>crypto.createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const round=v=>typeof v==='number'?Math.round(v*1e8)/1e8:Array.isArray(v)?v.map(round):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,round(x)])):v;
const withoutTimes=v=>Array.isArray(v)?v.map(withoutTimes):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).filter(([k])=>k!=='t').map(([k,x])=>[k,withoutTimes(x)])):v;
function pass(label){passes.push(label);console.log('PASS',label);}
async function serve(){
 server=http.createServer((req,res)=>{try{let p=path.resolve(ROOT,'.'+new URL(req.url,'http://local').pathname);if(!p.startsWith(ROOT+path.sep))throw Error();if(fs.statSync(p).isDirectory())p+='/index.html';res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'application/javascript','.json':'application/json','.css':'text/css'})[path.extname(p)]||'application/octet-stream');res.end(fs.readFileSync(p));}catch(_){res.writeHead(404).end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));return'http://127.0.0.1:'+server.address().port;
}
async function pageFor(context){const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));return p;}
async function direct(page,id){await page.goto(base+'/geometry-course/trainers/'+id+'.html');await page.locator('#search-entry-proof[data-ready="true"]').waitFor();}
async function ready(page){await page.waitForFunction(()=>document.documentElement.dataset.geometry7Board==='ready');const f=page.frames().find(f=>f.url().includes('/geometry-course/trainers/'));await f.locator('#search-entry-proof[data-ready="true"]').waitFor();return f;}
async function wrapper(page,id,state){await page.goto(base+'/trainers/geometry7-practice.html?activity='+id);await ready(page);if(state)await page.evaluate(s=>Geometry7Practice.applyState(s),state);return ready(page);}
async function own(page){return page.evaluate(()=>MathExamSearchEntry.snapshot());}
async function finishProof(f,id,wrong=false){
 if(id===ids[0]){
  if(wrong&&await f.evaluate(()=>si===0&&!asmDead.length))await f.getByRole('button',{name:'∠1 = ∠A, потому что они соответственные.',exact:true}).click();
  for(let n=0;n<15;n++){
   if(await f.evaluate(()=>MathExamSearchProof.finished()))return;
   const label=await f.evaluate(()=>{const c=(STEPS[si].cards||[]).find(c=>!c.trap&&!asmDone.includes(c.id)&&(c.need||[]).every(x=>asmDone.includes(x)));if(!c)return null;const d=document.createElement('div');d.innerHTML=c.txt;return d.textContent;});
   if(label)await f.getByRole('button',{name:label,exact:true}).click();else{
    await f.locator('#nextBtn').click();
    if(wrong&&await f.evaluate(()=>si===1&&!asmDead.length))await f.getByRole('button',{name:'∠A + ∠B + ∠C = 180° — это же известно, возьмём как есть.',exact:true}).click();
   }
  }
 }else{
  if(wrong)await f.getByRole('button',{name:'Измерим третий угол: ∠C = ∠C₁ — значит, и он равен.',exact:true}).click();
  for(let n=0;n<5;n++){
   const label=await f.evaluate(()=>CARDS.find(c=>!c.distract&&!done.includes(c.id)&&c.need.every(x=>done.includes(x)))?.txt||null);if(label)await f.getByRole('button',{name:label,exact:true}).click();
  }
  await f.locator('#nextBtn').click();await f.getByRole('button',{name:'Две пересекающиеся прямые имеют ровно одну общую точку — поэтому C однозначно определена пересечением лучей.',exact:true}).click();
 }
 assert(await f.evaluate(()=>MathExamSearchProof.finished()),id+' proof finished');
}
async function keyboardRegion(page,view){
 // Starting at the chosen region heading, Tab and Shift+Tab cannot enter an
 // inactive proof, notes or investigation. This checks actual browser focus.
 for(const key of ['Tab','Tab','Shift+Tab','Tab']){
  await page.keyboard.press(key);
  assert(await page.evaluate(()=>{const a=document.activeElement;return !a?.closest('[hidden],[inert],[aria-hidden="true"]');}),view+' focus stays in a visible region');
 }
}
(async()=>{
 base=await serve();browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH||process.env.GEOMETRY_CHROMIUM?{executablePath:process.env.CHROMIUM_PATH||process.env.GEOMETRY_CHROMIUM}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  // Frozen pre-change recordings include proof traps, dynamic card pools,
  // experiment controls, canvas dragging, quizzes and all three note fields.
  const legacyContext=await browser.newContext({viewport:{width:900,height:1000}}),legacyPage=await pageFor(legacyContext);
  for(const fixture of fixtures.fixtures){
   const f=await wrapper(legacyPage,fixture.id,fixture.state);
   const actual=await f.evaluate(n=>{
    Geometry7Native.pause();
    return{controls:[...document.querySelectorAll('button,input,select,textarea,summary,canvas,[role="button"]')].slice(0,n).map((x,index)=>({index,tag:x.tagName.toLowerCase()+(x.tagName==='INPUT'?':'+x.type:''),id:x.id,text:(x.textContent||'').replace(/\s+/g,' ').trim(),value:x.value??null,disabled:!!x.disabled,onclick:x.getAttribute('onclick')})),variables:typeof done!=='undefined'?{done:[...done],dead:[...dead],order:[...order],quizDone,expOn,expT,mistakes}:{si,asmDone:[...asmDone],asmDead:[...asmDead],proved:{...proved},stepResolved,mistakes,hintsUsed},progress:JSON.parse(localStorage.getItem('mathExamCourseProgress.v1')||'{}')};
   },fixture.legacyControls);
   assert.equal(sha(actual.controls),fixture.controlsSha256,fixture.id+' '+fixture.label+' exact legacy slots');
   assert.deepEqual(round(actual.variables),round(fixture.variables),fixture.id+' '+fixture.label+' proof state');
   assert.deepEqual(withoutTimes(actual.progress),fixture.progress,fixture.id+' '+fixture.label+' progress semantics');
   pass('legacy '+fixture.id+' '+fixture.label);
  }
  await legacyContext.close();
  for(const size of [{width:320,height:900},{width:390,height:844},{width:1280,height:900},{width:1440,height:900}]){
   const context=await browser.newContext({viewport:size}),page=await pageFor(context);
   for(const id of ids){
    await direct(page,id);const result=await page.evaluate(()=>{
     const model=document.getElementById('entry-model'),b=model.getBoundingClientRect(),h=document.getElementById('entry-title').getBoundingClientRect();
     return{view:MathExamSearchEntry.snapshot().view,overflow:document.documentElement.scrollWidth>innerWidth+1,bottom:b.bottom,top:b.top,heading:h.top,proofHidden:document.querySelector('.app').hidden&&document.querySelector('.app').inert,labels:[...model.querySelectorAll('text')].map(t=>{const m=t.getScreenCTM(),r=t.getBoundingClientRect();return{font:Number(t.getAttribute('font-size'))*Math.min(Math.hypot(m.a,m.b),Math.hypot(m.c,m.d)),top:r.top,bottom:r.bottom,left:r.left,right:r.right};})};
    });
    assert.equal(result.view,'research');assert(result.proofHidden);assert(!result.overflow);assert(result.heading>=0&&result.bottom<size.height,'question and model in first viewport');
    for(const l of result.labels){assert(l.font>=17.5,'readable labels');assert(l.top>=0&&l.bottom<size.height&&l.left>=0&&l.right<=size.width,'unclipped labels');}
    await page.locator('#entry-position').focus();await page.keyboard.press('ArrowRight');await keyboardRegion(page,'research');
    await page.screenshot({path:path.join(OUT,id+'-'+size.width+'.png'),fullPage:true});
    pass('first viewport '+id+' '+size.width);
   }
   await context.close();
  }
  for(const id of ids){
   const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await pageFor(context);
   await page.addInitScript(()=>{if(!localStorage.getItem('mathExamCourseProgress.v1'))localStorage.setItem('mathExamCourseProgress.v1',JSON.stringify({unrelated:{keep:'yes'}}));});
   await direct(page,id);await page.locator('#entry-position').focus();await page.keyboard.press('ArrowRight');await page.locator('#entry-guess').fill('Я изменил вершину; проверяю, какие условия сохраняются.');
   const first=await own(page);await page.reload();await page.locator('#search-entry-proof[data-ready="true"]').waitFor();assert.deepEqual((await own(page)).research,first.research);
   await page.locator('#entry-to-proof').click();await keyboardRegion(page,'proof');assert(await page.locator('#entry-research').isHidden());
   await page.locator('#geometry7-reasons').fill('Сначала дано, затем основание, после него вывод.');
   const label=await page.evaluate(()=>typeof CARDS!=='undefined'?CARDS.find(c=>c.id==='overlay').txt:(()=>{let d=document.createElement('div');d.innerHTML=STEPS[0].cards[0].txt;return d.textContent;})());await page.getByRole('button',{name:label,exact:true}).click();
   const partial=await own(page);await page.reload();await page.locator('#search-entry-proof[data-ready="true"]').waitFor();assert.deepEqual((await own(page)).proof.done,partial.proof.done);assert.equal(await page.locator('#geometry7-reasons').inputValue(),'Сначала дано, затем основание, после него вывод.');
   await finishProof(page,id,true);const complete=await own(page),runs=await page.evaluate(id=>JSON.parse(localStorage.getItem('mathExamCourseProgress.v1'))[id].runs,id),raw=await page.evaluate(()=>localStorage.getItem(MathExamSearchEntry.storageKey));
   await page.reload();await page.locator('#search-entry-proof[data-ready="true"]').waitFor();assert((await own(page)).proof.finished);assert.equal(await page.evaluate(id=>JSON.parse(localStorage.getItem('mathExamCourseProgress.v1'))[id].runs,id),runs,'reload never counts another completion');assert.equal(await page.evaluate(()=>localStorage.getItem(MathExamSearchEntry.storageKey)),raw,'finished draft is byte-stable');
   await page.locator('#entry-to-practice').click();await keyboardRegion(page,'practice');await page.locator('#entry-check').click();assert.equal((await own(page)).practice.attempts,0);
   await page.locator('#entry-answer').fill(id===ids[0]?'64':'R');await page.locator('#entry-reason').selectOption(id===ids[0]?'angle-sum':'asa');await page.locator('#entry-check').click();assert.equal((await own(page)).practice.attempts,1);assert(await page.locator('#entry-solution').isHidden());
   await page.reload();await page.locator('#search-entry-proof[data-ready="true"]').waitFor();assert(await page.locator('#entry-solution').isHidden(),'one mistake does not reveal the solution on reload');await page.locator('#entry-answer').fill(id===ids[0]?'65':'U');await page.locator('#entry-check').click();assert((await own(page)).practice.solved);assert(!(await own(page)).practice.independent);
   const prior=(await own(page)).practice.attempts;await page.locator('#entry-check').click();assert.equal((await own(page)).practice.attempts,prior,'repeat does not create success');assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('mathExamCourseProgress.v1')).unrelated.keep),'yes');
   await page.locator('#entry-answer').fill(id===ids[0]?'12':'R');assert.match(await page.locator('#entry-feedback').textContent(),/изменены/,'editing cannot leave an old positive verdict');await page.reload();await page.locator('#search-entry-proof[data-ready="true"]').waitFor();assert.match(await page.locator('#entry-feedback').textContent(),/изменены/,'reload does not approve an edited wrong answer');assert.equal((await own(page)).practice.attempts,prior);
   await page.locator('#entry-answer').fill(id===ids[0]?'65':'U');await page.locator('#entry-check').click();await page.locator('#entry-reason').selectOption(id===ids[0]?'appearance':'two-angles');assert.match(await page.locator('#entry-feedback').textContent(),/изменены/,'editing a reason also invalidates the visible verdict');await page.reload();await page.locator('#search-entry-proof[data-ready="true"]').waitFor();assert.match(await page.locator('#entry-feedback').textContent(),/изменены/);await page.locator('#entry-reason').selectOption(id===ids[0]?'angle-sum':'asa');await page.locator('#entry-check').click();assert.equal((await own(page)).practice.attempts,prior);
   await page.screenshot({path:path.join(OUT,id+'-practice.png'),fullPage:true});pass('direct restore and honest attempt '+id);await context.close();
  }
  // New research, notes, proof and independent result reproduce in a peer;
  // neither wrapper may change the pupil's personal local results.
  for(const id of ids){
   const context=await browser.newContext({viewport:{width:1280,height:900}}),peerContext=await browser.newContext({viewport:{width:390,height:844}}),page=await pageFor(context),peerPage=await pageFor(peerContext);
   await page.addInitScript(()=>localStorage.setItem('mathExamCourseProgress.v1','{"private":"keep"}'));await peerPage.addInitScript(()=>localStorage.setItem('mathExamCourseProgress.v1','{"private":"keep"}'));
   const f=await wrapper(page,id);await f.locator('#entry-position').focus();await page.keyboard.press('ArrowRight');await f.locator('#entry-guess').fill('Моя новая догадка для общей доски.');await f.locator('#entry-explain').click();await f.locator('#entry-to-proof').click();await f.locator('#geometry7-conclusion').fill('Запись общего рассуждения.');await finishProof(f,id);await f.locator('#entry-to-practice').click();await f.locator('#entry-answer').fill(id===ids[0]?'65':'U');
   // selectOption dispatches untrusted synthetic events, which native-session
   // correctly ignores. Use real keyboard input for the shared-board recording.
   await f.locator('#entry-reason').focus();for(const key of ['Home','ArrowDown','ArrowDown','Tab'])await page.keyboard.press(key);assert.equal(await f.locator('#entry-reason').inputValue(),id===ids[0]?'angle-sum':'asa');await f.locator('#entry-answer').press('Enter');
   await page.waitForTimeout(100);const state=await page.evaluate(()=>Geometry7Practice.getState());assert(await page.evaluate(s=>Geometry7Practice.validateState(s),state));const peer=await wrapper(peerPage,id,state);
   assert.deepEqual(round(await own(peer)),round(await own(f)),'new typed operations reproduce all learning state');assert((await own(peer)).practice.independent);assert.equal(await peerPage.evaluate(()=>localStorage.getItem('mathExamCourseProgress.v1')),'{"private":"keep"}');
   await peer.locator('#entry-check').click();assert.equal((await own(peer)).practice.attempts,1);pass('new peer replay '+id);await context.close();await peerContext.close();
  }
  const conflictContext=await browser.newContext(),a=await pageFor(conflictContext),b=await pageFor(conflictContext);await direct(a,ids[0]);await direct(b,ids[0]);await a.locator('#entry-guess').fill('Запись первой вкладки.');await b.locator('#entry-storage-warning').waitFor();await b.locator('#entry-guess').fill('Запись второй вкладки остаётся на экране.');assert.equal(await a.evaluate(()=>JSON.parse(localStorage.getItem(MathExamSearchEntry.storageKey)).research.guess),'Запись первой вкладки.');pass('concurrent drafts are not overwritten');await conflictContext.close();
  const corruptContext=await browser.newContext(),p=await pageFor(corruptContext);await p.addInitScript(()=>localStorage.setItem('mathExamGeometrySearchEntry.v1:ch4-p1-t2-proof-angle-sum','{"version":999,"future":"preserve"}'));await direct(p,ids[0]);await p.locator('#entry-guess').fill('Работа без перезаписи неизвестного формата.');assert.equal(await p.evaluate(()=>localStorage.getItem(MathExamSearchEntry.storageKey)),'{"version":999,"future":"preserve"}');assert(await p.locator('#entry-storage-warning').isVisible());pass('unknown draft format preserved');await corruptContext.close();
  assert.deepEqual(errors,[]);console.log('SEARCH_ENTRY_PROOF_BROWSER_PASS',passes.length);
 }catch(e){failure=e.stack||String(e);throw e;}finally{
  fs.writeFileSync(path.join(OUT,'summary.json'),JSON.stringify({base:fixtures.base,legacyFixtureSha256:fixtures.sourceSha256,passes,errors,failure},null,2));if(browser)await browser.close();if(server)server.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1;server?.close();});
