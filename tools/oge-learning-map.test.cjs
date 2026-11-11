'use strict';
// Public navigation reads synthetic progress only; never real pupil records.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const KEY='mathExamCourseProgress.v1';
const NAV='mathexam.oge.course-navigation.v1';
const model=require('../oge/learning-map.js');
const registry=require('../oge/registry.js');
function fractionSession(cat='bank'){
 const source=read('trainers/oge-task6-fractions.html').match(/const TASKS = (\[.*?\]);/s);
 assert(source,'Published fraction bank is available');
 const tasks=JSON.parse(source[1]);
 const order=tasks.flatMap((task,index)=>cat==='all'||task.cat===cat?[index]:[]);
 assert(order.length,'Published category has tasks: '+cat);
 return {v:1,cat,order,pos:0,records:{}};
}
function storage(seed={}){
 const values=new Map(Object.entries(seed).map(([k,v])=>[k,typeof v==='string'?v:JSON.stringify(v)]));
 return {values,getItem:k=>values.get(k)??null,setItem(){throw Error('Progress model must not write');},removeItem(){throw Error('Progress model must not remove');}};
}
function step(snapshot,pathname){
 const found=snapshot.steps.find(s=>new URL(s.href,'https://mathexam.space').pathname===pathname);
 assert(found,'Course has '+pathname);return found;
}
function page(seed={},blocked=false){
 const dom=new JSDOM(read('trainers/oge-course/index.html'),{url:'https://mathexam.space/trainers/oge-course/',runScripts:'outside-only'});
 const w=dom.window;
 for(const [k,v] of Object.entries(seed))w.localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v));
 if(blocked)Object.defineProperty(w,'localStorage',{get(){throw new w.DOMException('Storage unavailable','SecurityError');}});
 for(const f of ['oge/registry.js','oge/learning-map.js','oge/learning-map-view.js'])w.eval(read(f));
 w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 return dom;
}
test('seven learning lines cover every published OGE number with unique, existing destinations',()=>{
 assert.equal(model.tracks.length,7);
 assert.equal(new Set(model.tracks.map(t=>t.id)).size,7);
 const all=model.tracks.flatMap(t=>t.steps);
 assert.equal(new Set(all.map(s=>s.id)).size,all.length);
 for(const s of all){
  assert(s.title&&s.href.startsWith('/'));
  const u=new URL(s.href,'https://mathexam.space');
  assert.equal(u.origin,'https://mathexam.space');
  const file=u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname;
  assert(fs.existsSync(path.join(root,file.slice(1))),s.href+' exists');
 }
 const snap=model.snapshot(storage());
 for(const pathname of [
  '/trainers/oge-task6-fractions.html','/trainers/oge-task7-number-line.html',
  '/trainers/oge-task8-powers-roots.html','/trainers/oge-task9-equations.html',
  '/trainers/oge-task10-probability.html','/trainers/oge-task11-graphs-trainer.html',
  '/trainers/oge-task12-formulas-trainer.html','/trainers/oge13-inequalities-series.html',
  '/trainers/oge-task14-progressions.html','/trainers/oge-task15-triangles.html',
  '/trainers/oge-task16-circle.html','/trainers/oge-task17-quadrilaterals.html',
  '/trainers/oge-task18-grid.html','/trainers/task19-trainer.html',
  '/trainers/oge-task20-equations.html','/trainers/oge-task21-word-problems.html',
  '/trainers/oge-task22-functions-graphs.html','/trainers/oge-task23-geometry-calculations.html',
  '/trainers/oge-task24-proofs.html','/trainers/oge-task25-geometry.html'])step(snap,pathname);
 assert.equal(all.filter(s=>s.href.includes('/oge-1-5-trainers/practice-1-5-')).length,8);
 assert.equal(snap.totals.started,0);
 assert(snap.steps.every(s=>!s.started&&s.status==='new'));
});
test('read-only model uses current side keys for 6, 13, 19, 20, 21 and 22',()=>{
 const data={
  [KEY]:{oge13InequalitiesSeries:{solved:5,correct:3,streak:1,history:[1,0,1]},'oge-t13-neravenstva':{solvedByType:{fake:999}}},
  'mathExam.oge6.practice.v1':{...fractionSession(),pos:1,records:{0:{status:'solved-first',wrongAttempts:0,answerWasRevealed:false},1:{status:'revealed',wrongAttempts:0,answerWasRevealed:true},2:{status:'skipped',wrongAttempts:0,answerWasRevealed:false}}},
  'mathExam.task19.visualHints.v1':{version:1,records:{'prev-000':{attempts:2,correct:1,needsReview:true}}},
  'mathExam.oge20.practice.v1':{A:{solved:3,streak:1}},
  'oge21_prog':{t1:2,t9:1},
  'mathExam.oge22.practice.v1':{m1:{solved:2,tries:4}}
 };
 const store=storage(data),before=JSON.stringify([...store.values]);
 const snap=model.snapshot(store);
 for(const p of ['oge-task6-fractions.html','oge13-inequalities-series.html','task19-trainer.html','oge-task20-equations.html','oge-task21-word-problems.html','oge-task22-functions-graphs.html']){
  const s=step(snap,'/trainers/'+p);assert(s.started,p);assert(s.activity>0,p+' recorded activity');
  assert.doesNotMatch(s.label,/освоен|самостоятельно подтвержд|готов к экзамену/i);
 }
 assert.equal(JSON.stringify([...store.values]),before,'Every stored byte retained');
});
test('fractions accept complete published category orders and reject sessions the trainer cannot restore',()=>{
 const key='mathExam.oge6.practice.v1';
 const goodRecord={status:'solved-first',wrongAttempts:0,answerWasRevealed:false};
 const source=read('trainers/oge-task6-fractions.html').match(/const TASKS = (\[.*?\]);/s);
 const categories=['all',...new Set(JSON.parse(source[1]).map(task=>task.cat))];
 for(const cat of categories){
  const valid=fractionSession(cat);
  valid.order.reverse(); // Shuffle is allowed, but every category index must appear exactly once.
  valid.pos=valid.order.length;
  valid.records[valid.order[0]]=goodRecord;
  const snap=model.snapshot(storage({[key]:valid}));
  assert.equal(step(snap,'/trainers/oge-task6-fractions.html').activity,1,cat+' reads the current bank');
  assert.equal(snap.invalidData,false,cat+' is a restorable session');
 }
 const valid=fractionSession();
 valid.records[valid.order[0]]=goodRecord;
 for(const bad of [
  {...valid,v:2}, {...valid,cat:'invented'}, {...valid,order:valid.order.slice(1)},
  {...valid,order:[...valid.order.slice(1),valid.order[1]]},
  {...valid,order:[...valid.order.slice(1),99999]}, {...valid,pos:-1},
  {...valid,pos:valid.order.length+1}, {...valid,pos:0.5}
 ]){
  const snap=model.snapshot(storage({[key]:bad}));
  const item=step(snap,'/trainers/oge-task6-fractions.html');
  assert.equal(item.started,false,'Invalid selection is not progress');
  assert.equal(item.activity,0);
  assert.equal(snap.invalidData,true);
 }
 for(const badRecord of [{status:'solved-first'},{...goodRecord,wrongAttempts:-1},{...goodRecord,status:'mastered'}]){
  const snap=model.snapshot(storage({[key]:{...valid,records:{0:goodRecord,1:badRecord,99999:goodRecord}}}));
  assert.equal(step(snap,'/trainers/oge-task6-fractions.html').activity,1,'Only a restorable record contributes');
  assert.equal(snap.invalidData,true);
 }
});
test('saved-data fixtures remain tied to published producer keys and module IDs',()=>{
 for(const [file,key] of [
  ['trainers/oge-task6-fractions.html','mathExam.oge6.practice.v1'],
  ['trainers/oge13-inequalities-series.html','oge13InequalitiesSeries'],
  ['trainers/task19-visual-app.js','mathExam.task19.visualHints.v1'],
  ['trainers/oge-task20-equations.html','mathExam.oge20.practice.v1'],
  ['trainers/oge-task21-word-problems.html','oge21_prog'],
  ['trainers/oge-task22-functions-graphs.html','mathExam.oge22.practice.v1']
 ])assert(read(file).includes(key),file+' still writes the reviewed key');
 const order20=read('trainers/oge-task20-equations.html').match(/var ORDER=\[([^\]]+)\]/);
 assert(order20,'Published module order is available');
 const ids20=[...order20[1].matchAll(/'([^']+)'/g)].map(m=>m[1]);
 assert.deepEqual([...registry.typesOf('oge-t20-algebra')].sort(),ids20.sort(),'Task20 registry reads the actual module keys');
 const ids21=[...read('trainers/oge-task21-word-problems.html').matchAll(/key:'(t\d+)'/g)].map(m=>m[1]);
 assert.deepEqual([...registry.typesOf('oge-t21-tekst')].sort(),[...new Set(ids21)].sort(),'Task21 registry reads the actual module keys');
});
test('statement progress recognizes the published bank and deduplicates aliases exactly like the trainer',()=>{
 const cards=require('../trainers/task19-visual-data.js').cards;
 const key='mathExam.task19.visualHints.v1';
 const records=Object.fromEntries(cards.map(c=>[c.id,{attempts:1,correct:1,needsReview:false}]));
 records['invented-statement']={attempts:9999,correct:9999};
 let s=step(model.snapshot(storage({[key]:{version:1,records}})),'/trainers/task19-trainer.html');
 assert.equal(s.activity,cards.length,'Unknown statement IDs contribute no answers');
 const card=cards.find(c=>(c.aliases||[]).some(a=>a!==c.id));
 assert(card,'Published bank supplies an alias case');
 const alias=card.aliases.find(a=>a!==card.id);
 for(const entries of [
  [[alias,{attempts:2,correct:2}],[card.id,{attempts:1,correct:1}]],
  [[card.id,{attempts:1,correct:1}],[alias,{attempts:2,correct:2}]]
 ]){
  s=step(model.snapshot(storage({[key]:{version:1,records:Object.fromEntries(entries)}})),'/trainers/task19-trainer.html');
  assert.equal(s.activity,entries[1][1].correct,'Last saved record for a canonical statement wins');
 }
});
test('type coverage ignores unknown types and legacy successful checks never prove mastery',()=>{
 const store=storage({[KEY]:{
  'oge-t7-pryamaya':{v:1,solvedByType:{'ris/one':2,'frac/betint':1,unknown:10000},passed:true,best:8,total:10},
  practiceTiresTrainer:{solved:5,total:5,mastered:true}
 }});
 const snap=model.snapshot(store),s=step(snap,'/trainers/oge-task7-number-line.html');
 assert(s.started);assert(s.coverage);assert(s.coverage.value<=s.coverage.total);
 assert.equal(s.activity,3,'Only the two known types contribute their three correct answers');
 assert.equal(s.coverage.value,2,'Coverage counts different types, not attempts');
 for(const line of snap.tracks)for(const part of line.steps)assert.doesNotMatch(part.label,/освоен|готов к экзамену|подтверждено повторением/i);
});
test('corrupt or unavailable storage is safe and never renders data as HTML',()=>{
 for(const raw of ['{','null','[]','"text"','{"oge-t7-pryamaya":{"solvedByType":{"ris/one":"<img src=x onerror=1>"},"best":-3}}']){
  const s=model.snapshot(storage({[KEY]:raw}));
  assert.equal(s.steps.length,model.tracks.flatMap(t=>t.steps).length);
  for(const p of s.steps){assert(Number.isFinite(p.activity));assert(p.activity>=0);assert.doesNotMatch(p.label,/NaN|Infinity|<img/);}
 }
 const blocked=model.snapshot({getItem(){throw Error('Storage blocked');}});
 assert.equal(blocked.storageAvailable,false);assert.equal(blocked.totals.started,0);
});
test('recommendation follows valid fresh activity or an allowlisted selection, never a stored URL',()=>{
 const now=Date.now();
 const snap=model.snapshot(storage({[KEY]:{'oge-t7-pryamaya':{solvedByType:{'ris/one':1},updatedAt:now-1000}}}));
 const numbered=step(snap,'/trainers/oge-task7-number-line.html');
 assert.equal(model.recommend(snap,null).step.id,numbered.id);
 const other=step(snap,'/trainers/oge-task11-graphs-trainer.html');
 assert.equal(model.recommend(snap,{stepId:other.id,at:now}).step.id,other.id);
 for(const cursor of [{stepId:'https://evil.invalid/',at:now},{stepId:'__proto__',at:now},{stepId:other.id,at:Infinity},{stepId:other.id,at:'tomorrow'}]){
  const r=model.recommend(snap,cursor);assert(snap.steps.some(s=>s.id===r.step.id));assert.equal(r.step.id,numbered.id);
 }
});
test('plain HTML keeps seven learning lines and exam-number navigation usable without JavaScript',()=>{
 const d=new JSDOM(read('trainers/oge-course/index.html'),{url:'https://mathexam.space/trainers/oge-course/'}).window.document;
 assert(d.querySelector('#learning-map'));
 assert(d.querySelectorAll('#course-track-list a[href]').length>=7);
 assert(d.querySelector('#course-continue[href]'));
 for(let n=6;n<=25;n++)assert([...d.querySelectorAll('h3 a')].some(a=>a.textContent.trim()==='Задание '+n));
 const ids=[...d.querySelectorAll('[id]')].map(n=>n.id);assert.equal(new Set(ids).size,ids.length);
});
test('view renders current results, refreshes after storage events, and leaves trainer records untouched',()=>{
 const seed={[KEY]:{'oge-t7-pryamaya':{solvedByType:{'ris/one':2},updatedAt:Date.now()-1000}}};
 const dom=page(seed),w=dom.window,d=w.document;
 assert.equal(d.querySelectorAll('#course-track-list [data-track-id]').length,7);
 assert.equal(d.querySelectorAll('#course-track-list [data-course-step]').length,model.tracks.flatMap(t=>t.steps).length);
 assert.equal(new URL(d.querySelector('#course-continue').href).pathname,'/trainers/oge-task7-number-line.html');
 const before=w.localStorage.getItem(KEY),summary=d.querySelector('#course-progress-summary').textContent;
 assert.equal(before,JSON.stringify(seed[KEY]));
 assert.equal(w.localStorage.getItem(NAV),null,'Rendering does not invent a selection');
 const changed={...seed[KEY],'oge-t10-veroyatnost':{solvedByType:{one:1},best:3,total:10,updatedAt:Date.now()}};
 w.localStorage.setItem(KEY,JSON.stringify(changed));
 w.dispatchEvent(new w.StorageEvent('storage',{key:KEY,newValue:JSON.stringify(changed)}));
 assert.notEqual(d.querySelector('#course-progress-summary').textContent,summary);
 assert.equal(w.localStorage.getItem(KEY),JSON.stringify(changed));
 assert.equal(d.querySelectorAll('#course-track-list [data-track-id]').length,7,'Refresh does not duplicate tracks');
 dom.window.close();
});
test('view survives denied storage, and malicious navigation cannot replace the continue destination',()=>{
 for(const dom of [page({},true),page({[NAV]:{stepId:'javascript:alert(1)',at:Date.now(),href:'https://evil.invalid'}})]){
  const d=dom.window.document;
  assert.equal(d.querySelectorAll('#course-track-list [data-track-id]').length,7);
  const u=new URL(d.querySelector('#course-continue').href);assert.equal(u.origin,'https://mathexam.space');
  assert(!d.querySelector('#learning-map script'));
  dom.window.close();
 }
});
test('view explains partially unreadable progress and preserves the original records',()=>{
 const seed={[KEY]:{'oge-t7-pryamaya':{solvedByType:{'ris/one':1}}},'mathExam.oge6.practice.v1':'{'};
 const dom=page(seed),w=dom.window,d=w.document;
 const note=d.querySelector('#course-storage-note').textContent;
 assert.match(note,/Часть сохранённых результатов не удалось прочитать/);
 assert.match(note,/доступные данные/);
 assert.match(d.querySelector('#course-progress-summary').textContent,/Начато 1 из/);
 assert.equal(w.localStorage.getItem('mathExam.oge6.practice.v1'),'{','Unreadable bytes are retained');
 assert.equal(w.localStorage.getItem(KEY),JSON.stringify(seed[KEY]));
 dom.window.close();
});
test('refresh retains keyboard focus on continue, an expanded track, and its step',()=>{
 const dom=page(),w=dom.window,d=w.document;
 const refresh=()=>w.dispatchEvent(new w.StorageEvent('storage',{key:KEY}));
 const continueLink=d.querySelector('#course-continue');
 continueLink.focus();
 refresh();
 assert.equal(d.activeElement.id,'course-continue','Continue is not replaced by its hidden duplicate inside a closed track');
 const track=d.querySelector('[data-track-id="geometry"]');
 track.open=true;
 track.querySelector('summary').focus();
 refresh();
 assert.equal(d.activeElement.tagName,'SUMMARY');
 assert.equal(d.activeElement.parentElement.dataset.trackId,'geometry');
 assert.equal(d.activeElement.parentElement.open,true);
 d.querySelector('[data-course-step="task-25"]').focus();
 refresh();
 assert.equal(d.activeElement.dataset.courseStep,'task-25');
 assert.equal(d.activeElement.closest('details').open,true);
 dom.window.close();
});
