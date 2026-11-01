'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom'),{makeBoot}=require('../ege-profil/tests/boot.js');
const root=path.resolve(__dirname,'..'),KEY='mathexam.profileStart2027.v1',DIAG='mathexam.profileReadinessDiagnostic.v1';
function start(hash,entries=[]){const file=path.join(root,'ege-profil/start/index.html'),dom=new JSDOM(fs.readFileSync(file,'utf8'),{url:'https://mathexam.space/ege-profil/start/index.html#'+hash,runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};for(const [key,value]of entries)w.localStorage.setItem(key,value);for(const script of w.document.querySelectorAll('script[src]'))w.eval(fs.readFileSync(path.resolve(path.dirname(file),script.getAttribute('src').split(/[?#]/)[0]),'utf8'));return dom;}
function storage(w){return Object.keys(w.localStorage).sort().map(key=>[key,w.localStorage.getItem(key)]);}
function input(w,value){const e=w.document.getElementById('answer');e.value=String(value);e.dispatchEvent(new w.Event('input',{bubbles:true}));}
const flush=()=>new Promise(r=>setImmediate(r));

test('diagnostic draft, accepted first answer and recommendations survive a page recreation; malformed save is retained',async()=>{
 let dom=start('diagnostic'),w=dom.window;input(w,'0,75');let saved=storage(w);w.close();dom=start('diagnostic',saved);w=dom.window;assert.equal(w.document.getElementById('answer').value,'0,75');
 input(w,w.ProfileReadiness.checks[0].answer);w.document.getElementById('diagnostic-form').dispatchEvent(new w.Event('submit',{cancelable:true}));saved=storage(w);w.close();dom=start('diagnostic',saved);w=dom.window;assert(w.document.getElementById('answer').disabled);assert(!w.document.getElementById('diagnostic-next').hidden);
 for(let i=1;i<12;i++){w.document.getElementById('diagnostic-next').click();input(w,w.ProfileReadiness.checks[i].answer);w.document.getElementById('diagnostic-form').dispatchEvent(new w.Event('submit',{cancelable:true}));}
 w.document.getElementById('diagnostic-next').click();await flush();saved=storage(w);w.close();dom=start('readiness',saved);w=dom.window;assert.match(w.document.getElementById('diagnostic-result').textContent,/12 из 12/);w.close();
 dom=start('diagnostic',[[DIAG,'{broken']]);w=dom.window;input(w,12);assert.equal(w.localStorage.getItem(DIAG),'{broken');assert.match(w.document.getElementById('storage-warning').textContent,/Сохранение проверки основы/);w.close();
});

test('home keeps the next unmastered topic after one mastery, while clean recovery is explicitly labelled in the report',()=>{
 let dom=start('home'),w=dom.window;const first=w.ProfileLessons[0],second=w.ProfileLessons[1],record={version:1,records:{[first.id]:{guided:[],independent:first.tasks.slice(-3,-1).map(t=>t.id),attempts:2},[second.id]:{guided:[second.tasks[0].id],independent:[],attempts:1}},seen:{},sessions:{}};w.close();
 dom=start('home',[[KEY,JSON.stringify(record)]]);w=dom.window;const button=w.document.querySelector('.hero .actions a');assert.match(button.textContent,/Мой следующий урок/);assert.equal(button.getAttribute('href'),'#lesson/'+second.id);w.close();
 record.records[second.id].recovered=second.tasks.slice(-3,-1).map(t=>t.id);dom=start('progress',[[KEY,JSON.stringify(record)]]);w=dom.window;assert.match(w.document.getElementById('main').textContent,/Закреплено на знакомых задачах/);assert.match(w.document.getElementById('export').textContent,/полный отчёт/);w.close();
});

test('a complete guided solution preserves all accepted steps; reasons and result explanations open only on request',()=>{
 const dom=start('practice/prob-count/guided'),w=dom.window,d=w.document;
 const l=w.ProfileLessons.find(l=>l.id==='prob-count'),session=JSON.parse(w.localStorage.getItem(KEY)).sessions[l.id+':guided'],task=l.tasks.find(t=>t.id===session.taskId);
 for(const step of task.steps){input(w,step.answer);d.getElementById('answer-form').dispatchEvent(new w.Event('submit',{cancelable:true}));assert.match(d.getElementById('feedback').textContent,/Верно/);d.getElementById('next').click();}
 assert(d.querySelector('.result-panel'));assert.equal(d.querySelectorAll('#solution-history [data-step]').length,task.steps.length);assert.equal(d.querySelectorAll('#solution-history .earned-explanation[open]').length,0);
 const saved=w.localStorage.getItem(KEY),count=w.ProfileSolutions.steps(task).length;
 assert.equal(d.querySelectorAll('#result-solution [data-solution-step]').length,0);d.querySelector('#result-solution [data-solution-open]').click();
 for(let i=1;i<count;i++){assert.equal(d.querySelectorAll('#result-solution [data-solution-step]').length,i);d.querySelector('#result-solution [data-solution-next]').click();}
 assert.equal(d.querySelectorAll('#result-solution [data-solution-step]').length,count);assert.equal(w.localStorage.getItem(KEY),saved,'requesting all explanations changes no completed work');w.close();
});

test('clean familiar feedback distinguishes recovery from a corrected mistake without claiming a new success',()=>{
 const lesson=require('../ege-profil/start/probability-data.js').find(l=>l.id==='prob-count');
 for(const wrong of [false,true]){
  const seed={version:1,records:{},seen:Object.fromEntries(lesson.tasks.slice(-3).map(t=>[t.id,1])),sessions:{}},dom=start('practice/prob-count/independent',[[KEY,JSON.stringify(seed)]]),w=dom.window,d=w.document;
  const taskId=JSON.parse(w.localStorage.getItem(KEY)).sessions['prob-count:independent'].taskId,task=lesson.tasks.find(t=>t.id===taskId);
  const submit=value=>{input(w,value);d.getElementById('answer-form').dispatchEvent(new w.Event('submit',{cancelable:true}));};
  if(wrong)submit(task.answer+17);submit(task.answer);d.getElementById('next').click();
  const lead=d.querySelector('.result-panel .lead').textContent,record=JSON.parse(w.localStorage.getItem(KEY)).records[lesson.id];
  assert.equal(/Повтор решён без подсказок/.test(lead),!wrong);assert.match(lead,/повтор знакомой задачи/);assert.equal(record.independent.length,0);assert.equal((record.recovered||[]).length,wrong?0:1);w.close();
 }
});

test('teacher full-file import is read-only and review includes retained course mistakes without touching legacy errors',async()=>{
 const errors=[],boot=makeBoot(errors),l=require('../ege-profil/start/probability-data.js')[0];
 const course={version:1,records:{[l.id]:{guided:[],independent:[],recovered:l.tasks.slice(-3,-1).map(t=>t.id),mistakes:[l.tasks[3].id],attempts:4}},seen:{},sessions:{}};
 const legacy='{"student":{"name":"Keep learner"},"mistakes":{"existing":true}}',seed=w=>{w.localStorage.setItem(KEY,JSON.stringify(course));w.localStorage.setItem('mathExamCourseProgress.v1',legacy);};
 let w=boot('teacher.html',seed);const before=JSON.stringify(storage(w)),report=w.PROGRESS_CODE.fullReport(null,w.ProfileLessons);report.legacy.student.name='Imported learner';
 const file=w.document.getElementById('fullReportFile');Object.defineProperty(file,'files',{value:[{size:1000,text:()=>Promise.resolve(JSON.stringify(report))}]});file.dispatchEvent(new w.Event('change'));await flush();
 assert.match(w.document.getElementById('inStatus').textContent,/Полный отчёт открыт/);assert.match(w.document.getElementById('profileCourseReport').textContent,/Закреплено на знакомых задачах/);assert.match(w.document.getElementById('sourceLine').textContent,/Imported learner/);const remaining=w.document.querySelector('#profileCourseReport > .profile-other-topics');assert(remaining&&!remaining.open,'unstarted topics are collapsed');assert.equal(remaining.querySelectorAll(':scope > details').length,w.ProfileLessons.length-1);assert.equal(w.document.querySelectorAll('#profileCourseReport > details:not(.profile-other-topics)').length,1,'the worked topic stays visible');assert.equal(JSON.stringify(storage(w)),before);
 w.document.getElementById('mineBtn').click();assert.match(w.document.getElementById('sourceLine').textContent,/Keep learner/);assert.equal(JSON.stringify(storage(w)),before);w.close();
 w=boot('review.html',seed);assert.match(w.document.getElementById('profileCourseMistakes').textContent,/Закреплено на знакомых задачах/);assert.match(w.document.querySelector('#summaryCard h2').textContent,/В прежних подборках ошибок пока нет/);assert.equal(w.localStorage.getItem('mathExamCourseProgress.v1'),legacy);w.close();assert.deepEqual(errors,[]);
});
