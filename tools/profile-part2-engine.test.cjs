'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const api=require('../ege-profil/part-two/state.js'),checker=require('../ege-profil/start/checks.js');
const root=path.resolve(__dirname,'..'),folder=path.join(root,'ege-profil/part-two');
const bank=['algebra','geometry','models'].flatMap(name=>require(path.join(folder,'content-'+name+'.js')));
const pause=()=>new Promise(r=>setImmediate(r));
async function settle(w){await w.ProfilePartTwoApp.store.flush();await pause();await w.ProfilePartTwoApp.store.flush();await pause();}
async function boot(hash='map',entries=[]){
 const dom=new JSDOM(fs.readFileSync(path.join(folder,'index.html'),'utf8'),{url:'https://mathexam.space/ege-profil/part-two/#'+hash,runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.HTMLElement.prototype.scrollIntoView=()=>{};
 entries.forEach(([k,v])=>w.localStorage.setItem(k,v));
 for(const script of w.document.querySelectorAll('script[src]')){const src=script.getAttribute('src').split('?')[0];if(src.startsWith('/assets/'))continue;w.eval(fs.readFileSync(path.resolve(folder,src),'utf8'));}
 await settle(w);return dom;
}
async function go(w,hash){w.location.hash=hash;await new Promise(r=>setTimeout(r,0));await w.ProfilePartTwoApp.render();await settle(w);}
function input(w,id,value){const el=w.document.getElementById(id);assert(el,id);el.value=String(value);el.dispatchEvent(new w.Event('input',{bubbles:true}));}
async function submit(w,id){w.document.getElementById(id).dispatchEvent(new w.Event('submit',{cancelable:true,bubbles:true}));await settle(w);}
const memory=()=>{const values=new Map();return{getItem:k=>values.has(k)?values.get(k):null,setItem:(k,v)=>values.set(k,String(v))};};

test('safe answer parser accepts fractions, roots, pi, unordered roots and exact unions without erasing boundaries',()=>{
 for(const [answers,value] of [[['3/4'],'0,75'],[['3sqrt(2)'],'sqrt(18)'],[['π/6'],'pi/6'],[['1;2'],'2;1'],[['(-∞;1)∪(3;+∞)'],'(3;∞) или (-∞;1)']])assert(api.matches(answers,value,checker),value);
 for(const [answers,value]of [[['[1;2]'],'(1;2)'],[['1'],''],[['1'],'globalThis.x=1'],[['1'],'1.001'],[['(1;+∞)'],'[1;+∞)']])assert(!api.matches(answers,value,checker),value);
});

test('open answers preserve exact roots and accept equivalent unions without filling a hole',()=>{
 const roots={answers:['-2; 4'],excluded:7};
 assert(api.openAnswer(roots,'{8/2; -2,0; 4}').correct);
 assert(!api.openAnswer(roots,'-2;4,00000000000000001').correct);
 assert.match(api.openAnswer(roots,'-2; 4; 7').hint,/знаменатель/);
 assert(!api.openAnswer(roots,'-2;4;1/0').recognized);
 const intervals={answers:['(−∞; −2) ∪ (−2; +∞)']};
 assert(api.openAnswer(intervals,'(-4/2; +∞) или (−∞; −2)').correct);
 assert(api.openAnswer(intervals,'(-∞; -4] ∪ (-4; -2) ∪ (-2; ∞)').correct);
 assert(!api.openAnswer(intervals,'(-∞; -2] ∪ (-2; ∞)').correct);
 assert(!api.openAnswer(intervals,'[-∞; -2) ∪ (-2; ∞)').recognized);
 assert(!api.openAnswer(intervals,'(-∞; -2] ∪').recognized);
});

test('independent open answer keeps prior fields, distinguishes format from attempts and restores correction',async()=>{
 const task=bank.find(l=>l.id==='p14-rational-hole').tasks[5],hash='task/'+task.id+'/independent';
 const storage=memory(),seed=api.create(storage);
 await seed.patch(task.id,r=>{r.drafts.final=['2','-6'];r.drafts.proof='Мой черновик';});
 const dom=await boot(hash,[[seed.key(task.id),storage.getItem(seed.key(task.id))]]),w=dom.window,d=w.document;
 const read=()=>w.ProfilePartTwoApp.store.read(task.id);
 try {
  assert.equal(d.querySelectorAll('[data-final]').length,1);
  assert.doesNotMatch(d.querySelector('.condition').textContent,/количество корней/);
  assert.equal(d.querySelector('#final-0').value,'');
  assert.match(d.querySelector('.earlier-final').textContent,/-6/);
  input(w,'final-0','-6;');await submit(w,'final-form');
  assert.equal(read().attemptCount,0);
  assert.match(d.querySelector('#feedback').textContent,/формат/);
  input(w,'final-0','-6; 2; 7');await submit(w,'final-form');
  assert.match(d.querySelector('#feedback').textContent,/знаменатель/);
  input(w,'final-0','2; -6');await submit(w,'final-form');
  await submit(w,'final-form');
  assert(read().completed);assert(read().independent);
  assert.match(d.querySelector('#completion').textContent,/исправлен самостоятельно/);
  assert.equal(read().attemptCount,2);
  assert.deepEqual(Array.from(read().drafts.final),['2','-6']);
  const next=await boot(hash,[[seed.key(task.id),w.localStorage.getItem(seed.key(task.id))]]);
  assert.equal(next.window.document.querySelector('#final-0').value,'2; -6');
  assert.equal(next.window.document.querySelector('#proof-draft').value,'Мой черновик');
  next.window.close();
 }finally{w.close();}
});

test('state retains first wrong attempt, separate help, unique completion, bounded history and fresh cross-tab writes',async()=>{
 const storage=memory(),a=api.create(storage),b=api.create(storage);
 await a.attempt('task-a',{kind:'final',answers:['7'],correct:false,mode:'independent',independentEligible:true});
 await b.patch('task-a',s=>{s.drafts.proof='Свежий текст другой вкладки';s.helped=true;});
 await a.attempt('task-a',{kind:'final',answers:['8'],correct:true,mode:'independent',independentEligible:true});
 assert.equal(a.read('task-a').independent,false);assert.equal(a.read('task-a').completed,true);assert.equal(a.read('task-a').attempts[0].answers[0],'7');assert.equal(a.read('task-a').drafts.proof,'Свежий текст другой вкладки');
 await a.attempt('task-b',{kind:'final',answers:['8'],correct:false,mode:'independent',independentEligible:true});
 await a.attempt('task-b',{kind:'final',answers:['9'],correct:true,mode:'independent',independentEligible:true});
 assert.equal(a.read('task-b').independent,true,'unassisted self-correction is independent, first error remains');
 for(let i=0;i<70;i++)await a.attempt('task-a',{kind:'final',answers:[i],correct:true,mode:'guided'});
 assert.equal(a.read('task-a').attempts.length,60);assert.equal(a.read('task-a').attempts[0].answers[0],'7');
});

test('malformed saves are preserved and a failed save keeps current working memory',async()=>{
 const storage=memory();storage.setItem(api.PREFIX+'broken','{not json');let warnings=0;
 const state=api.create(storage,{onWarning:()=>warnings++});await state.patch('broken',r=>{r.drafts.proof='Новое обоснование';});
 assert.equal(storage.getItem(api.PREFIX+'broken'),'{not json');assert.equal(state.read('broken').drafts.proof,'Новое обоснование');assert.equal(warnings,1);
 const bad=state.read('another');bad.solvedSteps=[99];assert(!api.valid(bad,'another'));
});

test('all seven sections and every lesson/task render with the authored answer fields',async()=>{
 const dom=await boot(),w=dom.window,d=w.document;
 assert.equal(d.querySelectorAll('.grid .card').length,7);
 for(const lesson of bank){await go(w,'lesson/'+lesson.id);assert.equal(d.querySelectorAll('.task-link').length,6);assert(d.querySelector('a[href="#exam/'+lesson.exam+'"]'));}
 for(const lesson of bank)for(const [index,task] of lesson.tasks.entries()){await go(w,'task/'+task.id+'/independent');assert.equal(d.querySelectorAll('[data-final]').length,index>=3&&task.independentFinal?1:task.final.length,task.id);assert(d.querySelector('#proof-draft'),task.id+' proof');assert.match(d.querySelector('.proof-status').textContent,/требует проверки/);}
 w.close();
});

test('empty, wrong, hinted and correct answers preserve drafts and truthfully separate assistance after reload',async()=>{
 const lesson=bank[0],task=lesson.tasks[3],dom=await boot('task/'+task.id+'/independent'),w=dom.window;
 await submit(w,'final-form');assert.equal(w.ProfilePartTwoApp.store.read(task.id).attemptCount,0);
 task.final.forEach((_,i)=>input(w,'final-'+i,'99999'));await submit(w,'final-form');assert.equal(w.ProfilePartTwoApp.store.read(task.id).attempts[0].correct,false);
 input(w,'proof-draft','Моё обоснование и ограничения');w.document.getElementById('request-help').click();await settle(w);
 task.final.forEach((field,i)=>input(w,'final-'+i,field.answers[0]));await submit(w,'final-form');
 const r=w.ProfilePartTwoApp.store.read(task.id);assert(r.completed);assert(!r.independent);assert.equal(r.attempts[0].answers[0],'99999');assert.equal(w.document.getElementById('proof-draft').value,'Моё обоснование и ограничения');assert(w.document.querySelector('#completion a'));
 const entries=Object.keys(w.localStorage).map(k=>[k,w.localStorage.getItem(k)]);w.close();const next=await boot('task/'+task.id+'/independent',entries);assert(next.window.document.getElementById('completion'));assert.match(next.window.document.querySelector('.proof-status').textContent,/требует проверки/);next.window.close();
});

test('guided accepted steps retain literal drafts and do not affect independent count',async()=>{
 const lesson=bank[0],task=lesson.tasks[0],dom=await boot('task/'+task.id+'/guided'),w=dom.window;
 for(let i=0;i<task.steps.length;i++){input(w,'step-answer',task.steps[i].answers[0]);await submit(w,'step-form');assert.equal(w.document.querySelectorAll('.step-done').length,i+1);}
 task.final.forEach((field,i)=>input(w,'final-'+i,field.answers[0]));await submit(w,'final-form');const r=w.ProfilePartTwoApp.store.read(task.id);assert.equal(r.drafts.steps.length,task.steps.length);assert(r.completed);assert(!r.independent);assert.match(w.document.getElementById('completion').textContent,/Другое условие самостоятельно/);w.close();
});

test('same-task stale step never grades a different prompt and current-mode click refreshes safely',async()=>{
 const task=bank[0].tasks[0],dom=await boot('task/'+task.id+'/guided'),w=dom.window;
 await w.ProfilePartTwoApp.store.patch(task.id,s=>{s.solvedSteps=[0];});
 input(w,'step-answer',task.steps[0].answers[0]);await submit(w,'step-form');
 assert.equal(w.ProfilePartTwoApp.store.read(task.id).attemptCount,0);
 assert.match(w.document.getElementById('feedback').textContent,/другой вкладке/);
 w.document.querySelector('.modes a[aria-current=page]').click();await settle(w);
 assert.match(w.document.querySelector('#step-form .eyebrow').textContent,/Шаг 2/);w.close();
});

test('a pending help or correct submit cannot replace a newer route',async()=>{
 const task=bank[0].tasks[3],dom=await boot('task/'+task.id+'/independent'),w=dom.window;
 w.document.getElementById('request-help').click();w.location.hash='progress';await w.ProfilePartTwoApp.render();await settle(w);assert.equal(w.document.querySelector('h1').textContent,'Мой прогресс');
 await go(w,'task/'+bank[1].tasks[3].id+'/independent');const freshTask=bank[1].tasks[3];freshTask.final.forEach((field,i)=>input(w,'final-'+i,field.answers[0]));w.document.getElementById('final-form').dispatchEvent(new w.Event('submit',{cancelable:true}));w.location.hash='exam/19';await w.ProfilePartTwoApp.render();await settle(w);assert.equal(w.document.querySelector('h1').textContent,'Задачи с параметром');w.close();
});

test('task-bound invalid solved-prefix is preserved without crashing its page',async()=>{
 const task=bank[0].tasks[0],storage=memory(),state=api.create(storage);await state.patch(task.id,s=>{s.solvedSteps=Array.from({length:task.steps.length+1},(_,i)=>i);});
 const raw=storage.getItem(api.PREFIX+task.id),dom=await boot('task/'+task.id+'/guided',[[api.PREFIX+task.id,raw]]),w=dom.window;
 assert(w.document.getElementById('step-form'));assert.equal(w.localStorage.getItem(api.PREFIX+task.id),raw);assert(!w.document.getElementById('save-warning').hidden);w.close();
});

test('solution is disclosed one step at a time and always contaminates independent credit',async()=>{
 const task=bank[0].tasks[3],dom=await boot('task/'+task.id+'/independent'),w=dom.window;
 w.document.getElementById('show-solution').click();await settle(w);
 assert.equal(w.document.querySelectorAll('.solution-list li').length,1);
 for(let i=1;i<task.solution.length;i++){w.document.getElementById('solution-next').click();await settle(w);assert.equal(w.document.querySelectorAll('.solution-list li').length,i+1);}
 assert(!w.document.getElementById('solution-next'));assert(w.ProfilePartTwoApp.store.read(task.id).helped);w.close();
});

test('correct guided step is saved even when learner immediately leaves the task',async()=>{
 const task=bank[0].tasks[0],dom=await boot('task/'+task.id+'/guided'),w=dom.window;
 input(w,'step-answer',task.steps[0].answers[0]);w.document.getElementById('step-form').dispatchEvent(new w.Event('submit',{cancelable:true}));w.location.hash='map';await w.ProfilePartTwoApp.render();await settle(w);
 assert.equal(w.ProfilePartTwoApp.store.read(task.id).solvedSteps.length,1);assert.match(w.document.querySelector('h1').textContent,/Вторая часть/);w.close();
});
