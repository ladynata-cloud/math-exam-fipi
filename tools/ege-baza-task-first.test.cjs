'use strict';
const {JSDOM,VirtualConsole}=require('jsdom'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),errors=[],tick=()=>new Promise(r=>setTimeout(r,5));
function create(saved,hash='map'){
 const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(fs.readFileSync(path.join(root,'ege-baza/path/index.html'),'utf8'),{url:'https://course.test/ege-baza/path/index.html#'+hash,runScripts:'outside-only',virtualConsole:vc}),w=dom.window;
 w.structuredClone=structuredClone;w.matchMedia=()=>({matches:true});w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};
 if(saved)w.localStorage.setItem('mathexam.ege-baza.path.v1',saved);
 w.localStorage.setItem('legacy-sentinel','unchanged');
 for(const script of w.document.querySelectorAll('script'))w.eval(fs.readFileSync(path.join(root,new URL(script.src).pathname),'utf8'));
 return {dom,w,d:w.document};
}
function solution(D,t){if(t.rule==='digits22'){for(let mask=0;mask<1<<t.digits.length;mask++){const x=[...t.digits].filter((_,i)=>mask>>i&1).join('');if(D.correct(t,x))return x;}throw Error('No digit solution');}return t.a??t.solutions?.[0]??t.answer;}
const go=async(w,id)=>{w.location.hash='lesson='+id;await tick();};
const open=async(w,d,id)=>{d.querySelector('#'+id).open=true;await tick();};
function submit(w,d,prefix,value){const input=d.querySelector('#'+prefix);assert(input,prefix);input.value=String(value);input.dispatchEvent(new w.Event('input',{bubbles:true}));d.querySelector('#'+prefix+'Form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));}
(async()=>{
 const {w,d}=create(),ids=w.PathData.meta.filter(m=>!m.grade7&&!m.pre7).map(m=>m.id);assert.equal(ids.length,107);
 for(const id of ['practice-radical-equation','practice-log-equation','expressions']){const task=w.PathData.task(id,0),label=w.PathTaskFirst.question(task);assert(task.q.includes(label));assert(!label.includes(task.steps.at(-1).q)||task.q.includes(task.steps.at(-1).q));}
 for(const id of ids){
  await go(w,id);const l=w.PathCourse.state().lessons[id],t=w.PathData.task(id,l.seed);
  assert(d.querySelector('.task-first-course'),id);assert(d.querySelector('#answer'),id+' final answer');assert(!d.querySelector('#taskHelp').open,id+' starts without help');assert.equal(l.help,false,id+' no automatic help');
  assert.equal(d.querySelector('#answerForm label').textContent,w.PathTaskFirst.question(t),id+' explicit target');
  if(t.display)assert(d.querySelector('.task-support svg,.task-support table'),id+' givens');
  const answer=d.querySelector('#answer');answer.value='12/';answer.dispatchEvent(new w.Event('input'));
  await open(w,d,'taskHelp');await open(w,d,'taskModel');assert(d.querySelector('#model').textContent.trim(),id+' model');
  assert.equal(l.help,true,id+' help accounted');assert.equal(d.querySelector('#answer'),answer,id+' original input mounted');
  await open(w,d,'taskSteps');
  for(const step of t.steps){submit(w,d,'stepAnswer',solution(w.PathData,step));}
  assert(d.querySelector('#taskStepsBody').textContent.includes('Разбор завершён'),id+' guided completion');
  assert.equal(d.querySelector('#answer').value,'12/',id+' final draft preserved through guided work');
  d.querySelector('#taskHelp').open=false;await tick();assert.equal(d.querySelector('#answer').value,'12/');
  const before=l.independent;submit(w,d,'answer',solution(w.PathData,t));assert.match(d.querySelector('#feedback').textContent,/Верно/,id+' final grading');assert.equal(l.independent,before,id+' guided is not independent');
 }
 // Final, intermediate and model state are distinct and survive hiding, routes and reload.
 await go(w,'equations-linear');d.querySelector('#new').click();await tick();const lesson=w.PathCourse.state().lessons['equations-linear'];
 const final=d.querySelector('#answer');final.value='7/';final.dispatchEvent(new w.Event('input'));
 await open(w,d,'taskHelp');await open(w,d,'taskModel');await open(w,d,'taskSteps');
 const intermediate=d.querySelector('#stepAnswer');intermediate.value='3/';intermediate.dispatchEvent(new w.Event('input'));
 d.querySelector('#divisor').value='7';d.querySelector('#divisor').dispatchEvent(new w.Event('input'));
 d.querySelector('#taskHelp').open=false;await tick();assert.equal(d.querySelector('#answer'),final);assert.equal(d.querySelector('#stepAnswer'),intermediate);
 const saved=w.localStorage.getItem(w.PathCourse.KEY),restored=create(saved,'lesson=equations-linear');await tick();
 assert.equal(restored.d.querySelector('#answer').value,'7/');assert.equal(restored.d.querySelector('#stepAnswer').value,'3/');assert.equal(restored.w.PathCourse.state().lessons['equations-linear'].help,true);
 await open(restored.w,restored.d,'taskHelp');await open(restored.w,restored.d,'taskModel');assert.equal(restored.d.querySelector('#divisor').value,'7');restored.w.close();
 // Switching to a related equation family keeps the requested guided help open
 // even when the hashchange arrives after the immediate render.
 await go(w,'equations');await open(w,d,'taskHelp');await open(w,d,'taskSteps');d.querySelector('#moreGuided').click();await tick();
 assert.equal(w.location.hash,'#lesson=equations-linear');assert(d.querySelector('#taskHelp').open);assert(d.querySelector('#taskSteps').open);assert.equal(d.querySelector('#answer').value,'');
 // First-attempt independent success still requires a fresh unseen problem.
 await go(w,'round');d.querySelector('#new').click();const round=w.PathCourse.state().lessons.round,task=w.PathData.task('round',round.seed),before=round.independent;
 delete w.PathCourse.state().seen[task.q];submit(w,d,'answer',task.answer);assert.equal(round.independent,before+1);
 d.querySelector('#new').click();const badTask=w.PathData.task('round',round.seed),after=round.independent;submit(w,d,'answer',-99);submit(w,d,'answer',badTask.answer);assert.equal(round.independent,after);
 // Existing versions 0–4 migrate without confusing the final and guided drafts.
 for(let stage=0;stage<=4;stage++){
  const legacy=JSON.parse(saved),rec=legacy.lessons['equations-linear'];delete rec.taskFirst;rec.stage=stage;rec.draft='9/';rec.step=1;rec.note='Сначала сохраняю равенство';rec.help=stage!==3;
  const old=create(JSON.stringify(legacy),'lesson=equations-linear');await tick();assert.equal(old.d.querySelector('#answer').value,[3,4].includes(stage)?'9/':'');assert.equal(old.d.querySelector('#stepAnswer').value,stage===2?'9/':'');assert.equal(old.d.querySelector('#note').value,rec.note);assert.equal(old.w.PathCourse.state().lessons['equations-linear'].taskFirst.legacyDraft,stage<2?'9/':'');if(stage<2)assert(old.d.querySelector('#taskHelp').textContent.includes('Ранее записано')); assert.equal(old.w.PathCourse.state().lessons['equations-linear'].step,1);old.w.close();
 }
 // Grade 7 and check controllers retain their original presentation and restrictions.
 const grade7=w.PathData.meta.find(m=>m.grade7&&!m.geometryRebuild);await go(w,grade7.id);assert(!d.querySelector('.task-first-course'));assert(d.querySelector('[data-stage]'));
 w.location.hash='exam';await tick();d.querySelector('#start').click();assert(!d.querySelector('#taskHelp'));assert.equal(w.PathCourse.state().active.ids.length,21);
 for(let i=0;i<21;i++){const run=w.PathCourse.state().active,t=w.PathData.task(run.ids[run.i],run.seed+run.i);submit(w,d,'answer',solution(w.PathData,t));await tick();}
 assert.equal(w.PathCourse.state().runs.at(-1).answers.filter(a=>a.correct).length,21);assert.equal(w.localStorage.getItem('legacy-sentinel'),'unchanged');assert(w.PathCourse.valid(w.PathCourse.state()));assert.deepEqual(errors,[]);w.close();
 console.log('EGE_BAZA_TASK_FIRST_OK: 107 complete model/guided/final paths, retained givens and two drafts, saved model, all legacy stages, honest credit, grade7 exclusion and 21-task exam');
})().catch(e=>{console.error(e);process.exitCode=1;});
