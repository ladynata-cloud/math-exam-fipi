'use strict';
// User journeys across the actual root/path script lists; no network or browser mutation.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..'),PATH_KEY='mathexam.ege-baza.path.v1',OLD_KEY='mathexam.ege-baza.foundation.v1';
const tick=()=>new Promise(resolve=>setTimeout(resolve,10));
let checks=0;const errors=[],open=[];
const ok=(value,label)=>{assert.ok(value,label);checks++;};
function boot(page='ege-baza/index.html',hash='',saved={},options={}){
 const vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error.message));
 const dom=new JSDOM(fs.readFileSync(path.join(root,page),'utf8'),{url:'https://course.test/'+page+(options.search||'')+hash,runScripts:'outside-only',virtualConsole:vc});
 open.push(dom);const w=dom.window,d=w.document,values=new Map(Object.entries(saved));let writes=0;
 w.structuredClone=structuredClone;w.TextEncoder=TextEncoder;w.matchMedia=()=>({matches:true});
 w.HTMLElement.prototype.scrollIntoView=()=>{};w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};
 w.Storage.prototype.getItem=function(key){if(options.blocked)throw new Error('storage denied');return values.get(key)??null;};
 w.Storage.prototype.setItem=function(key,value){writes++;values.set(key,String(value));};
 w.Storage.prototype.removeItem=function(key){writes++;values.delete(key);};
 w.Storage.prototype.clear=function(){writes++;values.clear();};
 for(const script of d.querySelectorAll('script[src]')){
  const file=path.join(root,new URL(script.src).pathname);
  ok(fs.existsSync(file),'actual script exists: '+new URL(script.src).pathname);
  w.eval(fs.readFileSync(file,'utf8'));
 }
 return {dom,w,d,values,writes:()=>writes};
}
const stateOf=ctx=>JSON.parse(ctx.values.get(PATH_KEY));
const input=(ctx,id,value)=>{const node=ctx.d.getElementById(id);assert(node,id);node.value=String(value);node.dispatchEvent(new ctx.w.Event('input',{bubbles:true}));};
const submit=(ctx,id,value)=>{input(ctx,id,value);ctx.d.getElementById(id+'Form').dispatchEvent(new ctx.w.Event('submit',{bubbles:true,cancelable:true}));};
const go=async(ctx,hash)=>{ctx.w.location.hash=hash;await tick();};
const savedMap=ctx=>Object.fromEntries(ctx.values);
(async()=>{
 try{
  const clean=boot();await tick();
  ok(clean.d.querySelectorAll('[data-exam-position]').length===21,'default entrance shows all 21 exam numbers');
  ok(clean.d.querySelector('[data-exam-position="1"] .exam-start'),'visible direct preparation entry');
  ok(!Array.from(clean.d.querySelectorAll('[data-exam-position]')).some(node=>node.closest('details')),'numbered map is not hidden inside disclosures');
  ok(clean.d.querySelectorAll('[data-exam-jump]').length===21,'all numbers have compact jump links');
  const lines=clean.w.EgeBazaJourney.catalog();
  ok(lines.slice(0,6).reduce((sum,line)=>sum+line.items.length,0)===111,'all 111 current EGE families appear once');
  ok(new Set(lines.slice(0,6).flatMap(line=>line.items.map(item=>item.id))).size===111,'no duplicate family coverage');
  for(const hash of ['#today','#map','#lines','#progress','#line?line=m01','#line?line=m02','#line?line=m03','#line?line=m04','#line?line=m05','#line?line=m06','#line?line=m07','#progress?module=m01','#progress?module=m02','#backup?module=m01','#backup?module=m02']){
   await go(clean,hash);ok(clean.d.querySelector('main h1'),'route rendered: '+hash);
  }
  for(const hash of ['#map','#today','#progress']){
   await go(clean,hash);ok(clean.d.querySelectorAll('[data-exam-position]').length===21,'all 21 number cards on '+hash);
  }
  await go(clean,'#lines');ok(clean.d.querySelectorAll('[data-line]').length===7,'secondary learning lines remain accessible');
  for(let pos=1;pos<=21;pos++){
   await go(clean,'#map');
   const card=clean.d.querySelector('[data-exam-position="'+pos+'"]');
   ok(card.querySelector('.exam-topics').hash==='#task?pos='+pos,'number card opens its own topics '+pos);
   const first=new URL(card.querySelector('.exam-start').href).hash.slice('#lesson='.length);
   ok(clean.w.PathData.meta.find(item=>item.id===first).pos===pos,'direct start opens a family of the correct number '+pos);
   await go(clean,'#task?pos='+pos);
   const expected=clean.w.PathData.meta.filter(item=>item.pos===pos&&!item.grade7&&!item.pre7);
   const rows=Array.from(clean.d.querySelectorAll('[data-journey-item]'));
   ok(clean.d.querySelector('[data-exam-task="'+pos+'"]'),'task number section '+pos);
   ok(rows.length===expected.length&&rows.every(node=>expected.some(item=>item.id===node.dataset.journeyItem)),'all and only own families visible for '+pos);
   ok(clean.d.querySelector('a[href="#map"]'),'return to all numbers '+pos);
  }
  for(const invalid of ['0','22','foo','1.5']){
   await go(clean,'#task?pos='+invalid);ok(!clean.d.querySelector('[data-exam-task]'),'invalid task number is not silently replaced: '+invalid);
  }
  ok(clean.writes()===0,'opening root routes and backups never writes progress');
  ok(clean.values.size===0,'empty browser stays empty');

  const old={v:1,practice:{},runs:{}};
  for(const task of clean.w.EgeBazaFoundationReference.tasks.filter(task=>task.phase==='practice'&&task.skill==='decimal'))old.practice[task.id]={tries:1,hints:false,solution:false,done:true,answer:String(task.answer)};
  const legacy=boot('ege-baza/index.html','#today',{[OLD_KEY]:JSON.stringify(old),'legacy-sentinel':'unchanged'});await tick();
  ok(legacy.d.querySelector('[data-line="m01"] .journey-legacy-count')?.textContent.includes('начато 1 из 6'),'old module result visible on main card');
  ok(legacy.d.querySelector('[data-line="m01"] progress').value===0,'old broad skill does not grant 29 path-family achievements');
  await go(legacy,'#line?line=m01');ok(legacy.d.querySelector('[data-journey-item="m01-decimal"] .journey-status').textContent.includes('Самостоятельно'),'legacy skill visible separately');
  await go(legacy,'#progress?module=m01');ok(legacy.d.querySelector('[data-stat="independent"]').textContent.trim().startsWith('4'),'legacy detailed result preserved');
  ok(legacy.values.get(OLD_KEY)===JSON.stringify(old)&&legacy.values.get('legacy-sentinel')==='unchanged'&&legacy.writes()===0,'root presentation preserves exact stored bytes');

  const bad=boot('ege-baza/index.html','#progress',{[PATH_KEY]:'{broken'});await tick();
  ok(!bad.d.querySelector('#storage-notice').hidden,'damaged store announced');
  ok(bad.d.querySelectorAll('[data-line] progress,[data-exam-position] progress').length===0,'unknown path data does not display zero progress in numbers or lines');
  ok(bad.values.get(PATH_KEY)==='{broken'&&bad.writes()===0,'damaged bytes retained');
  const blocked=boot('ege-baza/index.html','#progress',{}, {blocked:true});await tick();
  ok(!blocked.d.querySelector('#storage-notice').hidden&&blocked.d.querySelectorAll('[data-line] progress,[data-exam-position] progress').length===0,'blocked results remain unknown');
  ok(blocked.writes()===0,'blocked store not overwritten');

  const task=boot('ege-baza/path/index.html','#lesson=equations-linear');await tick();
  const initial=stateOf(task).lessons['equations-linear'];
  ok(task.d.querySelector('.journey-lesson-nav')&&task.d.querySelector('[data-journey-next]').hidden,'standalone line visible, next waits for success');
  input(task,'answer','7/');task.d.querySelector('#taskHelp').open=true;task.d.querySelector('#taskSteps').open=true;await tick();
  const question=task.w.PathData.task('equations-linear',initial.seed);submit(task,'stepAnswer',question.steps[0].a);await tick();
  input(task,'stepAnswer','3/');
  const snapshot=stateOf(task).lessons['equations-linear'],before=JSON.stringify(snapshot);
  const resumedHome=boot('ege-baza/index.html','#today',savedMap(task));await tick();
  ok(resumedHome.d.querySelector('.journey-continue').getAttribute('href').endsWith('#lesson=equations-linear'),'main action resumes meaningful saved attempt');
  ok(resumedHome.values.get(PATH_KEY)===task.values.get(PATH_KEY)&&resumedHome.writes()===0,'recommendation preserves exact path save');
  const resumed=boot('ege-baza/path/index.html','#lesson=equations-linear',savedMap(task));await tick();
  ok(resumed.d.querySelector('#answer').value==='7/'&&resumed.d.querySelector('#stepAnswer').value==='3/','both drafts restored');
  const row=stateOf(resumed).lessons['equations-linear'];
  ok(row.seed===snapshot.seed&&row.step===1&&row.help===true,'same numbers, completed step and assistance restored');
  ok(JSON.stringify(snapshot)===before,'saved fixture not mutated');
  submit(resumed,'answer',question.answer);await tick();
  ok(stateOf(resumed).lessons['equations-linear'].independent===0,'assisted answer does not earn independent progress');
  ok(!resumed.d.querySelector('[data-journey-next]').hidden,'next topic offered after successful assisted solution');

  const independent=boot('ege-baza/path/index.html','#lesson=box');await tick();
  const box=stateOf(independent).lessons.box,answer=independent.w.PathData.task('box',box.seed).answer;
  submit(independent,'answer',answer);await tick();
  ok(stateOf(independent).lessons.box.independent===1,'new first-attempt solution retains honest credit');
  const next=independent.d.querySelector('[data-journey-next]');
  ok(!next.hidden&&independent.w.EgeBazaExamMap.forLesson(next.hash.slice(8)).pos===11,'next topic belongs to the same exam number');
  ok(independent.d.querySelector('.journey-lesson-nav .back').hash==='#task?pos=11','task returns directly to its exam number');
  const numbered=boot('ege-baza/index.html','#task?pos=11',savedMap(independent));await tick();
  ok(numbered.d.querySelector('[data-journey-item="box"] .journey-status').textContent.includes('Самостоятельно'),'actual solution appears on numbered topic');
  ok(numbered.d.querySelector('progress').value===1&&numbered.d.querySelector('progress').max===5,'one family adds one of five steps to number 11');
  ok(numbered.writes()===0,'numbered page reads saved results without writing');
  const progressed=boot('ege-baza/index.html','#line?line=m05',savedMap(independent));await tick();
  ok(progressed.d.querySelector('[data-journey-item="box"] .journey-status').textContent.includes('Самостоятельно'),'actual solution appears on line');
  ok(progressed.d.querySelector('progress').value===1&&progressed.d.querySelector('progress').max===12,'one family adds one line step');
  ok(progressed.writes()===0,'returning to line is read-only');
  const last=boot('ege-baza/path/index.html','#lesson=practice-faces');await tick();
  const lastState=stateOf(last).lessons['practice-faces'];
  submit(last,'answer',last.w.PathData.task('practice-faces',lastState.seed).answer);await tick();
  const endLink=last.d.querySelector('[data-journey-next]');
  ok(endLink&&!endLink.hidden&&endLink.hash==='#task?pos=11','last family returns to its own number after success rather than crossing to another number');


  // A healthy row cannot promise exact resume when the real loader rejects a sibling.
  const partialState=stateOf(independent);
  Object.assign(partialState.lessons.box,{seed:123,draft:'12/',done:false});delete partialState.lessons.box.taskFirst;
  ok(independent.w.PathCourse.valid(partialState),'saved box seed and draft fixture is accepted by the real loader');
  partialState.lessons.fractions={broken:true};
  ok(!independent.w.PathCourse.valid(partialState),'real loader rejects the damaged sibling despite the healthy box row');
  const partialRaw=JSON.stringify(partialState),partial=boot('ege-baza/index.html','#today',{[PATH_KEY]:partialRaw});await tick();
  const partialView=partial.w.EgeBazaJourney.snapshot(),partialAction=partial.d.querySelector('.journey-continue');
  ok(partialView.status==='partial'&&!partialView.sources.path.resumeCompatible,'partially rejected save is not declared resumable');
  ok(partialView.recommendation.kind==='recovery'&&new URL(partialAction.href).pathname==='/ege-baza/index.html','main action opens readable course results instead of promising task resume');
  ok(!partial.d.querySelector('#storage-notice').hidden&&/не гарантировано/.test(partial.d.querySelector('.journey-reason').textContent),'home explains that exact continuation cannot be guaranteed');
  await go(partial,'#line?line=m05');
  ok(partial.d.querySelector('[data-journey-item="box"] .journey-status').textContent.includes('Самостоятельно'),'readable historical box achievement remains visible');
  ok(!partial.d.querySelector('[data-journey-item="box"] .journey-resume'),'healthy box row does not advertise a saved continuation');
  await go(partial,'#line?line=m01');
  ok(partial.d.querySelector('[data-journey-item="fractions"] .journey-status-unknown'),'damaged sibling remains unknown rather than unstarted');
  ok(partial.values.get(PATH_KEY)===partialRaw&&partial.writes()===0,'partial save stays byte-for-byte unchanged across root routes');

  // Shared-board mount supplies no journey context and must not leak standalone navigation.
  const host=independent.d.querySelector('#main'),lesson={seed:22,stage:3,step:0,help:false,attempted:false,independent:0,guided:0,note:'',draft:'',checks:[]};
  independent.w.PathTaskFirst.mount(host,{meta:independent.w.PathData.meta.find(item=>item.id==='box'),task:independent.w.PathData.task('box',22),lesson,save(){},seen:()=>false,expose(){},fresh(){},remediationId:()=>'',equationPracticeLinks:()=>'',fractionPracticeLink:()=>'',setHash(){}});
  ok(!host.querySelector('.journey-lesson-nav,[data-journey-next]'),'shared mount without opt-in has no standalone course continuation');
  const managed=boot('ege-baza/path/index.html','#lesson=box',{}, {search:'?learning=1'});await tick();
  ok(managed.d.body.classList.contains('learning-managed')&&!managed.d.querySelector('.journey-lesson-nav,[data-journey-next]'),'managed controller excludes autonomous continuation');
  const grade7=task.w.PathData.meta.find(item=>item.grade7&&!item.geometryRebuild);await go(task,'#lesson='+grade7.id);
  ok(!task.d.querySelector('.journey-lesson-nav,[data-journey-next]')&&task.d.querySelector('[data-stage]'),'grade7 presentation preserved');
  ok(errors.length===0,'no DOM errors: '+errors.join('; '));
  console.log(`EGE_BAZA_JOURNEY_DOM_OK: ${checks} checks; actual scripts, 21 exam numbers/111 families, 7 secondary lines, legacy/read-only/unknown states, exact draft resume, independent/assisted success and managed/board exclusions.`);
 }finally{for(const dom of open)dom.window.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
