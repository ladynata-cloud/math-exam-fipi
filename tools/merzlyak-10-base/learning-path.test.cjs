'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'../..');
const bundle=require('../../stereo-course/merzlyak-10-base/data/course.json');
const exact=bundle.lessons.find(item=>item.answer?.mode==='exact');
const manual=bundle.lessons.find(item=>item.source.collection==='main'&&item.answer?.mode==='manual');
const first=bundle.lessons.find(item=>item.id==='merz-theory-01');
// Use real authored cards, keeping tests small; schema-runtime and board suite cover all 989.
const chosen=new Set([exact.id,manual.id,...bundle.lessons.filter(item=>item.kind==='theory'&&item.source.subpart==='обзор').map(item=>item.id),...bundle.lessons.filter(item=>item.source.collection==='main'&&item.source.exercise.startsWith('1.')).slice(0,2).map(item=>item.id)]);
const sample={...bundle,catalog:{...bundle.catalog,entries:bundle.catalog.entries.filter(item=>chosen.has(item.id))},lessons:bundle.lessons.filter(item=>chosen.has(item.id))};
const key=lesson=>'mathExamTextbook.v1:'+bundle.catalog.book.id+':'+lesson.id+':r'+lesson.revision;
const resumeKey='mathExamTextbook.route.v1:'+bundle.catalog.book.id;
const copy=value=>JSON.parse(JSON.stringify(value));
function boot(saved={},board=false){
 const dom=new JSDOM('<div id="app"></div>',{url:'https://example.test/'+(board?'trainers/merzlyak-10-base.html':'stereo-course/merzlyak-10-base/'),runScripts:'outside-only',pretendToBeVisual:true});
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
