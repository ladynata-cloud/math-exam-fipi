#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'../../courses/vilenkin-6-part-1');
const units=['A','B','C','D'].flatMap(block=>JSON.parse(fs.readFileSync(path.join(root,`textbook-data/units-${block}.json`),'utf8')));
const KEY='mathexam-vilenkin6-textbook-2024-v1';
const html=fs.readFileSync(path.join(root,'textbook.html'),'utf8');
const scripts=['textbook-math.js','textbook-course.js'].map(name=>fs.readFileSync(path.join(root,name),'utf8'));
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
async function open(hash='',saved=null){
  const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error.message));
  const dom=new JSDOM(html,{url:`https://example.test/courses/vilenkin-6-part-1/textbook.html${hash}`,runScripts:'outside-only',virtualConsole:vc});
  dom.window.scrollTo=()=>{};
  dom.window.fetch=async name=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'))});
  if(saved!==null)dom.window.localStorage.setItem(KEY,saved);
  scripts.forEach(source=>dom.window.eval(source));
  for(let i=0;i<20&&!dom.window.VilenkinTextbook?.ready;i++)await tick();
  assert(dom.window.VilenkinTextbook?.ready,'course must load all source data');assert.deepEqual(errors,[]);
  return {dom,w:dom.window,d:dom.window.document,errors};
}
async function go(ctx,hash){ctx.w.location.hash=hash;await tick();await tick();}
function submit(ctx,value){const input=ctx.d.querySelector('#answer');assert(input,'answer field');input.value=String(value);input.dispatchEvent(new ctx.w.Event('input',{bubbles:true}));ctx.d.querySelector('#answer-form').dispatchEvent(new ctx.w.Event('submit',{bubbles:true,cancelable:true}));}
function click(ctx,selector){const node=ctx.d.querySelector(selector);assert(node,selector);node.click();}
function firstAnswer(item){return Array.isArray(item.answer)?item.answer[0]:item.answer;}
function url(unit,task){return `#unit/${unit.id}/task/${task.id}`;}
(async()=>{
  let ctx=await open();
  assert.equal(ctx.d.querySelectorAll('.topic-card').length,24);
  let views=0,figures=0;
  for(const unit of units){
    await go(ctx,`#unit/${unit.id}`);assert(ctx.d.querySelector('h1').textContent.includes(unit.title));
    for(const task of unit.tasks){
      await go(ctx,url(unit,task));views++;
      assert(ctx.d.querySelector('.source a').getAttribute('href').endsWith(`#page=${task.source.page+1}`));
      assert(ctx.d.querySelector('.prompt').textContent.length>5);
      assert(ctx.d.querySelector('#answer-form'));
      if(task.visual?.type==='image'){figures++;assert.equal(ctx.d.querySelector('.task-image').getAttribute('src'),task.visual.src);}
    }
  }
  const learnUnit=units.find(u=>u.tasks.some(t=>t.role==='learn'&&t.steps.length>=2&&t.steps[0].answerType!=='self-check'));
  const learn=learnUnit.tasks.find(t=>t.role==='learn'&&t.steps.length>=2&&t.steps[0].answerType!=='self-check');
  await go(ctx,url(learnUnit,learn));
  const taskHash=ctx.w.location.hash;click(ctx,'.skip-link');await tick();
  assert.equal(ctx.w.location.hash,taskHash,'keyboard skip link must keep the current task route');
  assert.equal(ctx.d.activeElement,ctx.d.querySelector('#main'));assert(ctx.d.querySelector('.condition'));
  submit(ctx,firstAnswer(learn.steps[0]));
  assert.equal(ctx.d.querySelectorAll('.step-history li').length,1);
  const visibleCondition=ctx.d.querySelector('.prompt').textContent;
  const step2=ctx.d.querySelector('#answer');if(step2){step2.value='123456789';step2.dispatchEvent(new ctx.w.Event('input',{bubbles:true}));}
  const saved=ctx.w.localStorage.getItem(KEY);ctx.w.close();ctx=await open(url(learnUnit,learn),saved);
  assert.equal(ctx.d.querySelectorAll('.step-history li').length,1,'completed calculation survives reload');
  assert.equal(ctx.d.querySelector('.prompt').textContent,visibleCondition,'condition stays visible');
  if(step2)assert.equal(ctx.d.querySelector('#answer').value,'123456789','draft survives reload');
  const workUnit=units.find(u=>u.tasks.some(t=>t.role==='practice'&&t.answerType==='integer'&&t.hint));
  const task=workUnit.tasks.find(t=>t.role==='practice'&&t.answerType==='integer'&&t.hint);
  await go(ctx,url(workUnit,task));submit(ctx,'999999999');
  assert(ctx.d.querySelector('.feedback'));assert(ctx.d.querySelector('.hint'));
  const wrongSaved=ctx.w.localStorage.getItem(KEY);ctx.w.close();ctx=await open(url(workUnit,task),wrongSaved);
  assert(ctx.d.querySelector('.feedback'),'wrong answer feedback survives reload');
  assert(ctx.d.querySelector('.hint'),'contextual hint survives reload');
  submit(ctx,firstAnswer(task));assert(ctx.d.querySelector('.work').textContent.includes('Решено с помощью'));
  click(ctx,'[data-action="repeat"]');submit(ctx,firstAnswer(task));assert(ctx.d.querySelector('.work').textContent.includes('Решено повторно'));
  const independent=units.flatMap(u=>u.tasks.map(t=>({u,t}))).find(({t})=>t.role==='check'&&t.answerType==='integer');
  await go(ctx,url(independent.u,independent.t));submit(ctx,firstAnswer(independent.t));assert(ctx.d.querySelector('.work').textContent.includes('Решено самостоятельно'));
  await go(ctx,`#unit/${independent.u.id}`);click(ctx,'[data-action="ask-reset"]');click(ctx,'[data-action="confirm-reset"]');
  await go(ctx,url(independent.u,independent.t));submit(ctx,firstAnswer(independent.t));assert(ctx.d.querySelector('.work').textContent.includes('Решено повторно'),'reset must not relabel familiar problems as first independent work');
  const guided=units.flatMap(u=>u.tasks.map(t=>({u,t}))).find(({t})=>t.role==='practice'&&t.steps.every(s=>s.answerType!=='self-check'));
  await go(ctx,url(guided.u,guided.t));click(ctx,'[data-action="guide"]');
  for(const step of guided.t.steps)submit(ctx,firstAnswer(step));
  assert.equal(ctx.d.querySelectorAll('.step-history li').length,guided.t.steps.length);
  assert(ctx.d.querySelector('.work').textContent.includes('Решено с помощью'));
  const manual=units.flatMap(u=>u.tasks.map(t=>({u,t}))).find(({t})=>t.answerType==='self-check'&&t.role!=='learn');
  if(manual){
    await go(ctx,url(manual.u,manual.t));ctx.d.querySelector('#answer-form').dispatchEvent(new ctx.w.Event('submit',{bubbles:true,cancelable:true}));assert(ctx.d.querySelector('.feedback'));
    const checks=[...ctx.d.querySelectorAll('[data-criterion]')];assert(checks.length>0);checks.forEach(box=>{box.checked=true;box.dispatchEvent(new ctx.w.Event('change',{bubbles:true}));});
    ctx.d.querySelector('#answer-form').dispatchEvent(new ctx.w.Event('submit',{bubbles:true,cancelable:true}));
    assert(ctx.d.querySelector('.work').textContent.includes('Проверено по памятке'));assert(!ctx.d.querySelector('.work').textContent.includes('Решено самостоятельно'));
  }
  await go(ctx,'#progress');assert.equal(ctx.d.querySelector('h1').textContent,'Моя работа');
  await go(ctx,'#book');assert.equal(ctx.d.querySelectorAll('.topic-card').length,24);
  assert.deepEqual(ctx.errors,[]);ctx.w.close();
  const malformed={version:1,tasks:{[learn.id]:{step:999999,mode:'guided',status:'invalid',hintKeys:['bad',{}],stepDrafts:[{}],feedback:null}}};
  ctx=await open(url(learnUnit,learn),JSON.stringify(malformed));assert(ctx.d.querySelector('#answer-form'),'malformed progress must not break lesson');ctx.w.close();
  ctx=await open(url(learnUnit,learn));
  let draft=ctx.d.querySelector('#answer');draft.value='11';draft.dispatchEvent(new ctx.w.Event('input',{bubbles:true}));
  click(ctx,'[data-action="reveal-step"]');
  assert.equal(ctx.d.querySelector('#answer').value,'11','revealing keeps current draft');
  assert.equal(ctx.d.querySelectorAll('.step-history li').length,0,'revealing does not advance');
  const revealSaved=ctx.w.localStorage.getItem(KEY);ctx.w.close();ctx=await open(url(learnUnit,learn),revealSaved);
  assert(ctx.d.querySelector('[data-action="continue-step"]'),'step reveal survives reload');
  const staleForm=ctx.d.querySelector('#answer-form');
  click(ctx,'[data-action="continue-step"]');
  assert.equal(ctx.d.querySelectorAll('.step-history li').length,1);
  staleForm.dispatchEvent(new ctx.w.Event('submit',{bubbles:true,cancelable:true}));
  assert.equal(ctx.d.querySelectorAll('.step-history li').length,1,'stale submit cannot advance another step');
  await go(ctx,url(workUnit,task));click(ctx,'[data-action="hint"]');assert(ctx.d.querySelector('.hint'));click(ctx,'[data-action="hint"]');assert(!ctx.d.querySelector('.hint'));
  draft=ctx.d.querySelector('#answer');draft.value='1'.repeat(1000);draft.dispatchEvent(new ctx.w.Event('input',{bubbles:true}));assert.equal(draft.value.length,180);
  draft.value='1'.repeat(1000);ctx.d.querySelector('#answer-form').dispatchEvent(new ctx.w.Event('submit',{bubbles:true,cancelable:true}));
  assert.equal(JSON.parse(ctx.w.localStorage.getItem(KEY)).tasks[task.id].draft.length,180,'programmatic submit is bounded');
  submit(ctx,firstAnswer(task));assert(ctx.d.querySelector('.work').textContent.includes('Решено с помощью'),'closing hint does not erase help');
  await go(ctx,url(independent.u,independent.t));draft=ctx.d.querySelector('#answer');draft.value='123';draft.dispatchEvent(new ctx.w.Event('input',{bubbles:true}));
  await go(ctx,`#unit/${independent.u.id}`);await go(ctx,url(independent.u,independent.t));assert.equal(ctx.d.querySelector('#answer').value,'123');submit(ctx,firstAnswer(independent.t));assert(ctx.d.querySelector('.work').textContent.includes('Решено с помощью'),'opening unit rule while checking counts as help');
  await go(ctx,'#unit/0');await go(ctx,'#');assert(ctx.d.querySelector('.intro .button-link').getAttribute('href').includes('#unit/0'),'unit zero has resume link');
  ctx.w.close();
  ctx=await open(url(independent.u,independent.t));const sourceLink=ctx.d.querySelector('.source a');sourceLink.addEventListener('click',e=>e.preventDefault());sourceLink.click();submit(ctx,firstAnswer(independent.t));assert(ctx.d.querySelector('.work').textContent.includes('Решено с помощью'),'opening source PDF counts as help');ctx.w.close();
  for(const bad of ['{bad',JSON.stringify({version:999,tasks:{}}),'x'.repeat(250001)]){
    ctx=await open(url(learnUnit,learn),bad);assert.equal(ctx.w.localStorage.getItem(KEY),bad,'unreadable work is preserved');assert(ctx.d.querySelector('#save-status').textContent.includes('Прежняя запись сохранена'));
    submit(ctx,firstAnswer(learn.steps[0]));assert.equal(ctx.w.localStorage.getItem(KEY),bad,'new writes cannot overwrite unreadable work');ctx.w.close();
  }
  const other=units.flatMap(u=>u.tasks.map(t=>({u,t}))).find(({u,t})=>u.id!==independent.u.id&&t.role==='practice');
  ctx=await open(url(independent.u,independent.t));submit(ctx,firstAnswer(independent.t));
  const staleRepeat=ctx.d.querySelector('[data-action="repeat"]');
  const staleLink=ctx.d.querySelector('.breadcrumb a');
  await go(ctx,url(other.u,other.t));
  let before=ctx.w.localStorage.getItem(KEY),visible=ctx.d.querySelector('.prompt').textContent,currentHash=ctx.w.location.hash;
  staleRepeat.click();assert.equal(ctx.w.localStorage.getItem(KEY),before);assert.equal(ctx.d.querySelector('.prompt').textContent,visible,'detached repeat cannot redraw an old task');
  const staleNavigation=new ctx.w.MouseEvent('click',{bubbles:true,cancelable:true});staleLink.dispatchEvent(staleNavigation);assert(staleNavigation.defaultPrevented,'detached navigation must be cancelled');assert.equal(ctx.w.location.hash,currentHash);
  await go(ctx,`#unit/${independent.u.id}`);click(ctx,'[data-action="ask-reset"]');
  const staleReset=ctx.d.querySelector('[data-action="confirm-reset"]'),staleCancel=ctx.d.querySelector('[data-action="cancel-reset"]');
  await go(ctx,url(other.u,other.t));before=ctx.w.localStorage.getItem(KEY);visible=ctx.d.querySelector('.prompt').textContent;
  staleReset.click();staleCancel.click();assert.equal(ctx.w.localStorage.getItem(KEY),before);assert.equal(ctx.d.querySelector('.prompt').textContent,visible,'detached reset cannot clear another visit');
  await go(ctx,url(learnUnit,learn));click(ctx,'[data-action="reveal-step"]');const staleContinue=ctx.d.querySelector('[data-action="continue-step"]');
  await go(ctx,url(other.u,other.t));before=ctx.w.localStorage.getItem(KEY);staleContinue.click();assert.equal(ctx.w.localStorage.getItem(KEY),before,'detached continue cannot advance an old lesson');ctx.w.close();
  for(const evidence of [{solution:true},{hintKeys:['final']},{hiddenHints:['final']},{ruleOpen:true}]){
    const savedProgress={version:1,tasks:{[independent.t.id]:{mode:'independent',step:0,draft:'',status:'',helped:false,...evidence}}};
    ctx=await open(url(independent.u,independent.t),JSON.stringify(savedProgress));submit(ctx,firstAnswer(independent.t));assert.equal(JSON.parse(ctx.w.localStorage.getItem(KEY)).tasks[independent.t.id].status,'assisted','surviving help evidence cannot become independent');ctx.w.close();
  }
  for(const [flags,expected] of [[{},'independent'],[{helped:true},'assisted'],[{repeated:true},'repeated']]){
    ctx=await open(url(independent.u,independent.t),JSON.stringify({version:1,tasks:{[independent.t.id]:{mode:'independent',step:0,draft:String(firstAnswer(independent.t)),status:'independent',...flags}}}));
    assert.equal(JSON.parse(ctx.w.localStorage.getItem(KEY)).tasks[independent.t.id].status,expected,'completed status is reconciled with valid answers and assistance');ctx.w.close();
  }
  for(const incompatible of ['learned','manual']){
    ctx=await open(url(independent.u,independent.t),JSON.stringify({version:1,tasks:{[independent.t.id]:{mode:'independent',step:0,draft:String(firstAnswer(independent.t)),status:incompatible,helped:false}}}));
    assert.equal(JSON.parse(ctx.w.localStorage.getItem(KEY)).tasks[independent.t.id].status,'repeated','incompatible saved status cannot be promoted to independent');ctx.w.close();
  }
  ctx=await open(url(independent.u,independent.t),JSON.stringify({version:1,tasks:{[independent.t.id]:{mode:'independent',step:0,draft:'999999999',status:'independent',helped:true,repeated:true}}}));
  assert(ctx.d.querySelector('#answer-form'),'invalid completed answer must return to unfinished work');assert.equal(JSON.parse(ctx.w.localStorage.getItem(KEY)).tasks[independent.t.id].status,'');ctx.w.close();
  ctx=await open(url(learnUnit,learn),JSON.stringify({version:1,tasks:{[learn.id]:{mode:'guided',step:learn.steps.length,status:'learned',stepDrafts:['999999999']}}}));
  assert.equal(ctx.d.querySelectorAll('.step-history li').length,0,'invalid step prefix cannot restore completed calculations');assert(ctx.d.querySelector('#answer-form'));ctx.w.close();
  ctx=await open(url(independent.u,independent.t));click(ctx,'[data-action="hint"]');await go(ctx,`#unit/${independent.u.id}`);click(ctx,'[data-action="ask-reset"]');click(ctx,'[data-action="confirm-reset"]');await go(ctx,url(independent.u,independent.t));submit(ctx,firstAnswer(independent.t));assert.equal(JSON.parse(ctx.w.localStorage.getItem(KEY)).tasks[independent.t.id].status,'repeated','reset after help cannot create a first independent completion');ctx.w.close();
  console.log(JSON.stringify({ok:true,views,sourceFigures:figures,journeys:['step-reload','wrong-hint-reload','assisted','independent','repeat','reset','guided','manual','progress','book','corrupt-state','step-reveal-reload','stale-submit','bounded-input','hidden-hint','rules-help','source-help','unit-zero-resume','preserve-unreadable-state','stale-repeat-reset-navigation-continue','reconcile-help-evidence','reconcile-completed-answers','validate-step-prefix','hint-reset-remains-familiar']}));
})().catch(error=>{console.error(error);process.exitCode=1;});
