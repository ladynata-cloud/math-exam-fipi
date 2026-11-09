'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'../..');
const bundle=require('../../stereo-course/merzlyak-10-base/data/course.json');
const exact=bundle.lessons.find(item=>item.answer?.mode==='exact');
const exactPeers=bundle.lessons.filter(item=>item.source.collection===exact.source.collection&&item.source.exercise?.startsWith('2.')&&item.answer?.mode==='exact'&&item.id!==exact.id);
const manual=bundle.lessons.find(item=>item.source.collection==='main'&&item.answer?.mode==='manual');
const first=bundle.lessons.find(item=>item.id==='merz-theory-01');
// Use real authored cards, keeping tests small; schema-runtime and board suite cover all 989.
const chosen=new Set([exact.id,...exactPeers.map(item=>item.id),'research-sections-001','merz-project-1',manual.id,...bundle.lessons.filter(item=>item.kind==='theory'&&item.source.subpart==='обзор').map(item=>item.id),...bundle.lessons.filter(item=>item.source.collection==='main'&&item.source.exercise.startsWith('1.')).slice(0,2).map(item=>item.id)]);
const sample={...bundle,catalog:{...bundle.catalog,entries:bundle.catalog.entries.filter(item=>chosen.has(item.id))},lessons:bundle.lessons.filter(item=>chosen.has(item.id))};
const key=lesson=>'mathExamTextbook.v1:'+bundle.catalog.book.id+':'+lesson.id+':r'+lesson.revision;
const resumeKey='mathExamTextbook.route.v1:'+bundle.catalog.book.id;
const copy=value=>JSON.parse(JSON.stringify(value));
function boot(saved={},board=false){
 const dom=new JSDOM('<nav class="course-nav"><a href="/">Курсы</a></nav><div id="app"></div>',{url:'https://example.test/'+(board?'trainers/merzlyak-10-base.html':'stereo-course/merzlyak-10-base/'),runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,doc=w.document,scrolls=[];w.TextEncoder=TextEncoder;w.scrollTo=(...args)=>scrolls.push(args);
 for(const [k,v]of Object.entries(saved))w.localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v));
 w.TaskSceneViewer={mount(element,model,options={}){const svg=doc.createElement('svg'),live=doc.createElement('p');live.className='am-sr-only';element.append(svg,live);const camera=model.planar?{yaw:0,pitch:-Math.PI/2}:options.savedCamera||{yaw:.6,pitch:.4};svg.dataset.view='neutral';return {getState:()=>camera,setView:view=>{svg.dataset.view=view;},destroy:()=>element.replaceChildren()};}};
 for(const file of ['stereo-course/assets/math-text.js','stereo-course/merzlyak-10-base/assets/engine.js'])w.eval(fs.readFileSync(path.join(root,file),'utf8'));
 let app,session;
 if(board){doc.body.dataset.merzlyakBoard='true';w.MathExamBoard={register:()=>({destroy(){}})};w.eval(fs.readFileSync(path.join(root,'stereo-course/merzlyak-10-base/assets/board-session.js'),'utf8'));({app,session}=w.MerzlyakBoard.boot(w.JSON.parse(JSON.stringify(sample)),doc.getElementById('app')));}
 else app=w.StereoTextbook.createApp(doc.getElementById('app'),copy(sample));
 return {w,doc,app,scrolls,state:lesson=>JSON.parse(w.localStorage.getItem(key(lesson))),close(){session?.destroy();app.destroy();w.close();}};
}
function answer(f,value){const input=f.doc.querySelector('#final-answer');input.value=value;input.dispatchEvent(new f.w.Event('input',{bubbles:true}));f.doc.querySelector('[data-final-form]').dispatchEvent(new f.w.Event('submit',{bubbles:true,cancelable:true}));}
const tick=()=>new Promise(resolve=>setTimeout(resolve,5));
test('19 topic route keeps full catalog and does not mark reading as mastery',()=>{
 const f=boot();try{assert.equal(f.doc.querySelectorAll('[data-route-point]').length,19);assert.equal(f.doc.querySelectorAll('[data-route-point] progress').length,19);assert.equal(f.doc.querySelector('[data-route-point] progress').value,0);assert(f.doc.querySelector('#catalog-search'));assert(f.doc.querySelector('[data-start-route]'));assert.match(f.doc.querySelector('[data-learning-journey]').textContent,/не означают освоения темы/);f.app.open(first.id);assert.equal(f.state(first),null);f.app.home();assert.match(f.doc.querySelector('[data-route-point="1"]').textContent,/Можно начать/);assert.equal(f.doc.querySelector('[data-resume]').dataset.resume,first.id);}finally{f.close();}
});
test('wrong answer followed by self correction is not recorded as help; first answer survives reload',()=>{
 const f=boot();let saved;try{f.app.open(exact.id);answer(f,'неверный ответ');assert.equal(f.state(exact).assisted,false);assert.equal(f.state(exact).attempts,1);saved=copy({...f.w.localStorage});}finally{f.close();}
 const g=boot(saved);try{g.doc.querySelector('[data-resume]').click();assert.equal(g.doc.querySelector('#final-answer').value,'неверный ответ');answer(g,exact.answer.accepted[0]);assert.equal(g.state(exact).outcome,'corrected');assert.equal(g.state(exact).firstAnswer,'неверный ответ');assert.equal(g.state(exact).assisted,false);assert.match(g.doc.querySelector('[data-work-status]').textContent,/Исправил самостоятельно/);answer(g,exact.answer.accepted[0]);assert.equal(g.state(exact).attempts,2,'repeat submit does not create a fresh attempt');g.app.home();assert.match(g.doc.querySelector('.journey-stats').textContent,/Исправил сам: 1/);}finally{g.close();}
});
test('a new correct answer on first attempt is separate from self correction',()=>{const f=boot();try{f.app.open(exact.id);answer(f,exact.answer.accepted[0]);assert.equal(f.state(exact).outcome,'first');assert.equal(f.state(exact).attempts,1);}finally{f.close();}});
test('actual help remains sticky after reload and cannot become independent',async()=>{
 const f=boot();let saved;try{f.app.open(exact.id);f.doc.querySelector('[data-main-help]>summary').click();await tick();assert.equal(f.state(exact).assisted,true);saved=copy({...f.w.localStorage});}finally{f.close();}
 const g=boot(saved);try{g.app.open(exact.id);answer(g,exact.answer.accepted[0]);assert.equal(g.state(exact).outcome,'assisted');g.app.home();assert.match(g.doc.querySelector('.journey-stats').textContent,/С помощью: 1/);}finally{g.close();}
});
test('legacy checked data stays unknown rather than gaining independent credit',()=>{
 const old={draft:exact.answer.accepted[0],stepDrafts:{},revealed:0,assisted:false,checked:true,camera:null};
 const f=boot({[key(exact)]:old});try{assert.match(f.doc.querySelector('[data-learning-journey]').textContent,/Прежних совпавших ответов: 1/);f.app.open(exact.id);answer(f,exact.answer.accepted[0]);assert.equal(f.state(exact).outcome,'legacy');assert.match(f.doc.querySelector('[data-work-status]').textContent,/самостоятельность не определена/);}finally{f.close();}
});
test('legacy incomplete drafts preserve text and cannot invent a first try',()=>{
 const old={draft:'Старые вычисления',stepDrafts:{},revealed:0,assisted:false,checked:false,camera:null};
 const f=boot({[key(exact)]:old});try{f.app.open(exact.id);assert.equal(f.doc.querySelector('#final-answer').value,'Старые вычисления');answer(f,exact.answer.accepted[0]);assert.equal(f.state(exact).outcome,'legacy');}finally{f.close();}
});
test('manual proof requires nonempty explicit saving and stays pending review',()=>{
 const f=boot();try{f.app.open(manual.id);answer(f,'');assert.equal(f.state(manual).manualSaved,false);answer(f,'Точки A и B лежат в плоскости, поэтому вся прямая AB лежит в ней.');assert.equal(f.state(manual).manualSaved,true);assert.equal(f.state(manual).checked,false);f.app.home();assert.equal(f.doc.querySelector('[data-route-point="1"] progress').value,1);assert.match(f.doc.querySelector('.journey-stats').textContent,/Рассуждений на проверку: 1/);assert.match(f.doc.querySelector('[data-route-point="1"]').textContent,/Рассуждений на проверку: 1/);}finally{f.close();}
});
test('next task belongs to same paragraph, manual saving does not close topic',()=>{
 const f=boot();try{f.app.open(first.id);const next=f.doc.querySelector('[data-next-practice]');assert(next);next.click();assert.equal(f.doc.querySelector('h1').textContent,manual.title);assert(f.doc.querySelector('[data-next-theory]'));assert.equal(f.doc.querySelector('[data-next-topic]').dataset.nextTopic,'merz-theory-02');}finally{f.close();}
});
test('a stale or malformed resume pointer safely falls back to the first topic',()=>{const f=boot({[resumeKey]:'<invalid>'});try{assert(f.doc.querySelector('[data-start-route]'));assert.equal(f.doc.querySelector('[data-resume]'),null);}finally{f.close();}});
test('shared-room snapshot keeps exact original fields and cannot read or write personal journey',()=>{
 const saved={[key(exact)]:{draft:'Личная запись',checked:true,assisted:false},[resumeKey]:exact.id};
 const f=boot(saved,true);try{const before=JSON.stringify({...f.w.localStorage});assert.equal(f.doc.querySelector('[data-learning-journey]'),null);f.app.open(exact.id);assert.equal(f.doc.querySelector('#final-answer').value,'');answer(f,exact.answer.accepted[0]);const snapshot=f.w.__merzlyakBoard.getState();assert(f.w.__merzlyakBoard.validateState(f.w.JSON.parse(JSON.stringify(snapshot))));assert.deepEqual(Object.keys(snapshot.work).sort(),['assisted','camera','checked','draft','revealed','stepDrafts']);assert.equal(JSON.stringify({...f.w.localStorage}),before);assert.equal(f.doc.querySelector('[data-next-practice]'),null);}finally{f.close();}
});

test('empty manual answer retains identical shared-room feedback after snapshot hydration',()=>{
 const a=boot({},true),b=boot({},true);try{a.app.open(manual.id);answer(a,'');const snapshot=a.w.__merzlyakBoard.getState(),wire=b.w.JSON.parse(JSON.stringify(snapshot));assert(b.w.__merzlyakBoard.validateState(wire));b.w.__merzlyakBoard.applyState(wire);assert.equal(snapshot.view.feedback.final,'manual');assert.equal(a.doc.querySelector('[data-final-feedback]').textContent,b.doc.querySelector('[data-final-feedback]').textContent);assert.match(b.doc.querySelector('[data-final-feedback]').textContent,/Рассуждение сохранено/);assert.equal(a.doc.querySelector('#final-answer').value,b.doc.querySelector('#final-answer').value);}finally{a.close();b.close();}
});

test('restoring legacy open help leaves stored work byte-identical until a real edit',async()=>{
 const old={draft:'Личная работа до обновления',stepDrafts:{},revealed:1,assisted:true,checked:false,camera:{yaw:.4,pitch:.2}},raw=JSON.stringify(old,null,2);
 const f=boot({[key(exact)]:raw});try{f.app.open(exact.id);assert.equal(f.doc.querySelector('#final-answer').value,old.draft);assert.equal(f.doc.querySelectorAll('[data-step]').length,1);assert.equal(f.doc.querySelector('[data-main-help]').open,true);await tick();assert.equal(f.w.localStorage.getItem(key(exact)),raw,'queued restoration toggle must not migrate legacy storage');f.app.home();f.app.open(exact.id);await tick();assert.equal(f.w.localStorage.getItem(key(exact)),raw,'reopening is still read-only for stored work');answer(f,exact.answer.accepted[0]);assert.equal(f.state(exact).recordVersion,2,'an actual user response persists new metadata');assert.equal(f.state(exact).historyKnown,false);assert.equal(f.state(exact).outcome,'legacy','old work never acquires fresh independent credit');assert.equal(f.state(exact).assisted,true);}finally{f.close();}
});

test('standalone navigation starts at the top while shared-room navigation leaves scrolling alone',()=>{
 const f=boot();try{assert.deepEqual(f.scrolls,[[0,0]],'initial personal route starts at the top');f.scrolls.length=0;f.doc.querySelector('[data-start-route]').click();assert.deepEqual(f.scrolls,[[0,0]],'opening theory starts at the top');f.scrolls.length=0;f.doc.querySelector('[data-next-practice]').click();assert.deepEqual(f.scrolls,[[0,0]],'bottom-of-theory practice link must reveal the new condition');f.scrolls.length=0;f.doc.querySelector('main>header>button').click();assert.deepEqual(f.scrolls,[[0,0]],'return to course reveals its next-step controls');}finally{f.close();}
 const board=boot({},true);try{board.app.open(manual.id);board.app.home();assert.deepEqual(board.scrolls,[],'room navigation must not move either participant viewport');}finally{board.close();}
});

test('personal plan survives reload as a plan, without a checked answer or assistance',()=>{
 const f=boot();let saved;try{f.app.open(exact.id);const plan=f.doc.querySelector('[data-personal-plan]');plan.value='Попробую сначала запретить четыре точки.';plan.dispatchEvent(new f.w.Event('input',{bubbles:true}));assert.match(f.doc.querySelector('[data-work-status]').textContent,/План сохранён/);assert.equal(f.state(exact).assisted,false);assert.equal(f.state(exact).checked,false);assert.equal(f.state(exact).attempts,0);assert.equal(f.state(exact).manualSaved,false);saved=copy({...f.w.localStorage});f.app.home();assert.equal(f.doc.querySelector('[data-route-point="2"] progress').value,0);assert.equal(f.doc.querySelector('[data-resume]').dataset.resume,exact.id);}finally{f.close();}
 const g=boot(saved);try{g.doc.querySelector('[data-resume]').click();assert.equal(g.doc.querySelector('[data-personal-plan]').value,'Попробую сначала запретить четыре точки.');assert.equal(g.doc.querySelector('#final-answer').value,'');}finally{g.close();}
});

test('blank responses never count as attempts; two nonempty errors offer one voluntary step',async()=>{
 const f=boot();try{f.app.open(exact.id);answer(f,'  ');assert.equal(f.state(exact).attempts,0);assert.equal(f.state(exact).firstAnswer,null);answer(f,'4');assert.equal(f.state(exact).attempts,1);assert.equal(f.doc.querySelector('[data-hint-offer]').hidden,true);assert.match(f.doc.querySelector('[data-final-feedback]').textContent,/исправить.*сам/);answer(f,'5');assert.equal(f.state(exact).attempts,2);assert.equal(f.doc.querySelector('[data-hint-offer]').hidden,false);assert.equal(f.doc.querySelector('[data-main-help]').open,false);assert.equal(f.doc.querySelectorAll('[data-step]').length,0);assert.equal(f.state(exact).assisted,false);f.doc.querySelector('[data-hint-offer]').click();await tick();assert.equal(f.doc.querySelectorAll('[data-step]').length,1);assert.equal(f.doc.querySelector('[data-step-explanation]').open,false);assert.equal(f.state(exact).assisted,true);assert.equal(f.state(exact).revealed,1);assert.match(f.doc.querySelector('[data-work-status]').textContent,/с помощью/);}finally{f.close();}
});

test('authored prompts reveal sequentially and explicit explanations remain open after reload without hydration writes',async()=>{
 const f=boot();let saved,raw;try{f.app.open(exact.id);f.doc.querySelector('[data-step-hint]').click();assert.equal(f.doc.querySelectorAll('[data-step]').length,1);assert.equal(f.doc.querySelector('[data-step-explanation]').open,false);f.doc.querySelector('[data-step-explanation]>summary').click();assert.equal(f.doc.querySelector('[data-step-explanation]').open,true);f.doc.querySelector('[data-step-hint]').click();assert.equal(f.doc.querySelectorAll('[data-step]').length,2);assert.equal(f.doc.querySelectorAll('[data-step-explanation][open]').length,1);raw=f.w.localStorage.getItem(key(exact));saved=copy({...f.w.localStorage});}finally{f.close();}
 const g=boot(saved);try{g.app.open(exact.id);await tick();assert.equal(g.doc.querySelectorAll('[data-step]').length,2);assert.equal(g.doc.querySelector('[data-step-explanation]').open,true);assert.equal(g.doc.querySelectorAll('[data-step-explanation]')[1].open,false);assert.equal(g.w.localStorage.getItem(key(exact)),raw);answer(g,exact.answer.accepted[0]);assert.equal(g.state(exact).outcome,'assisted');}finally{g.close();}
});

test('neutral model inspection and bibliography do not count as help; try action focuses the answer',async()=>{
 const f=boot();try{f.app.open(exact.id);f.doc.querySelector('[data-inspect-model]').click();assert.equal(f.doc.querySelector('#model-guide').hidden,false);assert.equal(f.state(exact),null);f.doc.querySelector('.textbook-help>details:last-child>summary').click();await tick();f.doc.querySelector('[data-try-answer]').click();assert.equal(f.doc.activeElement,f.doc.querySelector('#final-answer'));answer(f,exact.answer.accepted[0]);assert.equal(f.state(exact).assisted,false);assert.equal(f.state(exact).outcome,'first');}finally{f.close();}
});

test('three proof checks persist as self assessment and never create a saved or checked proof',()=>{
 const f=boot();let saved;try{f.app.open(manual.id);const checks=[...f.doc.querySelectorAll('[data-proof-check]')];assert.equal(checks.length,3);for(const check of checks)check.click();assert.deepEqual(f.state(manual).proofChecks,[true,true,true]);assert.equal(f.state(manual).checked,false);assert.equal(f.state(manual).manualSaved,false);assert.equal(f.state(manual).assisted,false);assert.match(f.doc.querySelector('.merzlyak-proof-checks').textContent,/не автоматическая проверка/);saved=copy({...f.w.localStorage});f.app.home();assert.equal(f.doc.querySelector('[data-route-point="1"] progress').value,0);}finally{f.close();}
 const g=boot(saved);try{g.app.open(manual.id);assert([...g.doc.querySelectorAll('[data-proof-check]')].every(node=>node.checked));answer(g,'Каждый шаг объясняю свойствами из условия.');assert.equal(g.state(manual).manualSaved,true);assert.equal(g.state(manual).checked,false);}finally{g.close();}
});

test('fresh practice offers a different untouched condition, skipping a saved plan and retaining earlier work',()=>{
 const firstPeer=exactPeers[0],secondPeer=exactPeers[1],planState={draft:'',plan:'Уже начал план',recordVersion:2,historyKnown:true};const f=boot({[key(firstPeer)]:planState});try{f.app.open(exact.id);answer(f,'4');f.doc.querySelector('[data-step-hint]').click();const next=f.doc.querySelector('[data-fresh-task]');assert.equal(next.dataset.freshTask,secondPeer.id);assert.equal(secondPeer.source.collection,exact.source.collection);assert.equal(secondPeer.answer.mode,exact.answer.mode);assert.notEqual(secondPeer.statement.text,exact.statement.text);const old=copy(f.state(exact));next.click();assert.equal(f.doc.querySelector('#final-answer').value,'');assert.equal(f.doc.querySelectorAll('[data-step]').length,0);assert.equal(f.state(secondPeer),null);assert.deepEqual(f.state(exact),old);f.app.open(exact.id);assert.equal(f.doc.querySelector('#final-answer').value,'4');assert.equal(f.doc.querySelectorAll('[data-step]').length,1);}finally{f.close();}
});

test('exhausted same-topic bank honestly offers topic return without resetting history',()=>{
 const saved=Object.fromEntries(exactPeers.map((lesson,index)=>[key(lesson),{draft:index?'':'Старый черновик',plan:index?'Мой план':'',checked:false}]));const f=boot(saved);try{f.app.open(exact.id);answer(f,exact.answer.accepted[0]);const old=copy(f.state(exact));assert.equal(f.doc.querySelector('[data-fresh-task]'),null);assert.match(f.doc.querySelector('[data-fresh-offer]').textContent,/Другой ещё не начатой задачи.*нет/);assert(f.doc.querySelector('[data-fresh-topic]'));assert.deepEqual(f.state(exact),old);assert.equal(old.outcome,'first');}finally{f.close();}
});

test('plan conflict preserves both stored work and a copyable local plan; proof checks lock too',()=>{
 const f=boot();try{f.app.open(manual.id);const plan=f.doc.querySelector('[data-personal-plan]');plan.value='Мой первый план';plan.dispatchEvent(new f.w.Event('input',{bubbles:true}));const remote=JSON.stringify({...f.state(manual),plan:'Новая запись в другом окне'});f.w.localStorage.setItem(key(manual),remote);plan.value='Мой несохранённый план';plan.dispatchEvent(new f.w.Event('input',{bubbles:true}));assert.equal(f.w.localStorage.getItem(key(manual)),remote);assert.match(f.doc.querySelector('.course-conflict textarea').value,/Мой несохранённый план/);assert([...f.doc.querySelectorAll('[data-proof-check]')].every(node=>node.disabled));assert.equal(plan.readOnly,true);assert.equal(f.doc.querySelector('[data-step-hint]').disabled,true);}finally{f.close();}
});

test('compact personal controls and additive fields stay entirely outside shared rooms',()=>{
 const saved={[key(exact)]:{draft:'Личный ответ',plan:'Личный план',proofChecks:[true,true,true],explanations:['step-1'],revealed:1,assisted:true}};
 const f=boot(saved,true);try{const before=JSON.stringify({...f.w.localStorage});f.app.open(exact.id);assert.equal(f.doc.querySelector('.merzlyak-navigation'),null);assert.equal(f.doc.querySelector('.merzlyak-personal'),null);assert.equal(f.doc.querySelector('[data-personal-plan]'),null);assert.equal(f.doc.querySelector('[data-step-hint]'),null);assert.equal(f.doc.querySelector('[data-proof-check]'),null);f.doc.querySelector('[data-main-help]>summary').click();f.doc.querySelector('[data-steps]+button').click();const snapshot=f.w.__merzlyakBoard.getState();assert.deepEqual(Object.keys(snapshot.work).sort(),['assisted','camera','checked','draft','revealed','stepDrafts']);assert.equal(JSON.stringify({...f.w.localStorage}),before);}finally{f.close();}
 const g=boot();try{g.app.open(exact.id);assert(g.doc.querySelector('.merzlyak-personal'));assert(g.doc.querySelector('.merzlyak-navigation'));g.app.home();assert.equal(g.doc.querySelector('.merzlyak-personal'),null);assert.equal(g.doc.body.classList.contains('merzlyak-task-active'),false);}finally{g.close();}
});

test('clearing a saved proof removes the pending proof count immediately and on blank submit',()=>{
 const f=boot();try{f.app.open(manual.id);answer(f,'Обоснование по свойству прямой и плоскости.');assert.equal(f.state(manual).manualSaved,true);answer(f,'   ');assert.equal(f.state(manual).manualSaved,false);assert.equal(f.state(manual).checked,false);assert.doesNotMatch(f.doc.querySelector('[data-work-status]').textContent,/Рассуждение сохранено/);f.app.home();assert.equal(f.doc.querySelector('[data-route-point="1"] progress').value,0);assert.match(f.doc.querySelector('.journey-stats').textContent,/Рассуждений на проверку: 0/);}finally{f.close();}
});

test('fresh practice is rechecked at click time when another window starts the proposed card',()=>{
 const f=boot();try{f.app.open(exact.id);f.doc.querySelector('[data-step-hint]').click();const proposed=f.doc.querySelector('[data-fresh-task]');assert.equal(proposed.dataset.freshTask,exactPeers[0].id);const elsewhere=JSON.stringify({draft:'Работа другого окна',plan:'Сохранённый план'});f.w.localStorage.setItem(key(exactPeers[0]),elsewhere);proposed.click();assert.equal(f.doc.querySelector('h1').textContent,exact.title);assert.equal(f.doc.querySelector('[data-fresh-task]').dataset.freshTask,exactPeers[1].id);assert.equal(f.w.localStorage.getItem(key(exactPeers[0])),elsewhere);assert.match(f.doc.querySelector('.course-alerts').textContent,/уже начата в другом окне/);}finally{f.close();}
});

test('research cards without a known paragraph never propose an unrelated project as same-topic practice',()=>{
 const f=boot();try{f.app.open('research-sections-001');answer(f,'Записал план сечения.');assert.equal(f.doc.querySelector('[data-fresh-task]'),null);assert.match(f.doc.querySelector('[data-fresh-offer]').textContent,/нет отдельной задачи с подтверждённой привязкой/);assert.doesNotMatch(f.doc.querySelector('[data-fresh-offer]').textContent,/периодической решётки/);}finally{f.close();}
});
