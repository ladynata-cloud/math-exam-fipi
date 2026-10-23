'use strict';
// Isolated DOM fixtures exercise the actual cabinet entry and routing. No live
// student accounts, browser sessions, or network are used.
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const catalog = require('../learning/catalog');
const source = fs.readFileSync(path.join(__dirname,'../learning/vilenkin6-course.js'),'utf8');
const appSource = fs.readFileSync(path.join(__dirname,'../learning/app.js'),'utf8');
const html = fs.readFileSync(path.join(__dirname,'../learning/index.html'),'utf8');
const tick = () => new Promise(resolve=>setImmediate(resolve));
const expected = [0,1,2,3,4,5,24,6,7,8,9,10,11,12,13,14,15,16,17,25,18,19,20,21,22,23,26].map(id=>'vilenkin6-part1:lesson-'+id);
const learner = {id:'fixture_pupil',name:'Fixture pupil',role:'student',profile:{course:'vilenkin6',focus:'',goal:null,version:1}};
const labels = {started:'Начато',hinted:'Решено с подсказкой',independent:'Решено самостоятельно'};
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};}
function fixture(t, options={}){
 const dom = new JSDOM('<main></main>',{url:'https://cabinet.example/learning/',runScripts:'outside-only'}), w=dom.window,host=w.document.querySelector('main');
 w.eval(source);
 const calls=[],navigations=[],requests=[];
 const ctx={account:options.teacher?{id:'fixture_teacher',role:'teacher'}:learner,catalog,labels,profile:learner.profile,attempts:[],assignments:[],
  api:async url=>{requests.push(url);if(options.api)return options.api(url);return url==='/progress'?{progress:options.progress||[]}:{plan:{items:[]}};},
  navigate:route=>navigations.push(route),openContent:async id=>{calls.push(id);if(options.open)return options.open(id);}};
 const dispose=w.LearningVilenkin6.mount(host,ctx);
 t.after(()=>dom.window.close());
 return{w,host,ctx,dispose,calls,navigations,requests,button:id=>host.querySelector('[data-vilenkin6-open="vilenkin6-part1:lesson-'+id+'"]')};
}
test('all 27 modules preserve course order; rendering creates no work and includes cloud waiting advice',async t=>{
 const f=fixture(t);assert([...f.host.querySelectorAll('[data-vilenkin6-open]')].every(b=>b.disabled));
 await tick();assert.deepEqual([...f.host.querySelectorAll('[data-vilenkin6-open]')].map(b=>b.dataset.vilenkin6Open),expected);
 assert.equal(f.host.querySelectorAll('.catalog-grid .catalog-group').length,3);
 assert.deepEqual(f.calls,[]);assert.deepEqual(f.navigations,[]);assert.match(f.host.textContent,/Открыто 0 из 27/);assert.match(f.host.textContent,/При потере связи/);
 f.button(1).click();await tick();assert.deepEqual(f.calls,['vilenkin6-part1:lesson-1']);
});
test('completed and started modules both resume authoritative exact attempts without creating new work',async t=>{
 const f=fixture(t,{progress:[{trainerId:'vilenkin6-part1',contentId:'lesson-1',completed:true,latest:{id:'completed_saved_work',outcome:'hinted'}},{trainerId:'vilenkin6-part1',contentId:'lesson-2',completed:false,latest:{id:'unfinished_saved_work',outcome:'started'}}]});
 await tick();f.button(1).click();f.button(2).click();assert.deepEqual(f.navigations,['attempt=completed_saved_work','attempt=unfinished_saved_work']);assert.deepEqual(f.calls,[]);
 assert.match(f.host.textContent,/Открыто 2 из 27/);assert.match(f.host.textContent,/Завершённая проверка есть у 1 тем/);assert.match(f.host.textContent,/Решено с подсказкой/);
});
test('failed progress load cannot accidentally start replacement work; retry restores saved attempt',async t=>{
 let attempts=0;const f=fixture(t,{api:async url=>{if(url==='/plan')return{plan:{items:[]}};if(++attempts===1)throw Error('offline');return{progress:[{trainerId:'vilenkin6-part1',contentId:'lesson-4',latest:{id:'after_retry',outcome:'started'}}]};}});
 await tick();f.button(4).click();assert.deepEqual(f.calls,[]);assert.match(f.host.textContent,/Повтори загрузку/);
 f.host.querySelector('[data-vilenkin6-retry]').click();await tick();f.button(4).click();assert.deepEqual(f.navigations,['attempt=after_retry']);assert.deepEqual(f.calls,[]);
});
test('pending opening ignores double clicks and stale progress cannot overwrite a different view',async t=>{
 const opening=deferred(),f=fixture(t,{open:()=>opening.promise});await tick();f.button(3).click();f.button(3).click();assert.equal(f.calls.length,1);opening.resolve();await tick();
 const pending=deferred(),g=fixture(t,{api:()=>pending.promise});g.dispose();g.host.innerHTML='<h1>Another account</h1>';pending.resolve({progress:[],plan:{items:[]}});await tick();assert.equal(g.host.innerHTML,'<h1>Another account</h1>');
});
test('teacher chooses assignment; student recommendations are escaped and reuse saved work',async t=>{
 const teacher=fixture(t,{teacher:true});assert.equal(teacher.requests.length,0);teacher.button(24).click();await tick();assert.deepEqual(teacher.calls,['vilenkin6-part1:lesson-24']);
 const f=fixture(t,{api:async url=>url==='/progress'?{progress:[{trainerId:'vilenkin6-part1',contentId:'lesson-6',latest:{id:'old_note',outcome:'independent'}}]}:{plan:{note:'<img src=x onerror=bad()>',items:[{catalogId:'vilenkin6-part1:lesson-6',reason:'<b>Подсказка</b>'},{catalogId:'path:fractions',reason:'Other course'}]}}});
 await tick();const plan=f.host.querySelector('[data-vilenkin6-plan]');assert(!plan.hidden);assert.equal(plan.querySelectorAll('img,b').length,0);assert.equal(plan.querySelectorAll('button').length,1);plan.querySelector('button').click();assert.deepEqual(f.navigations,['attempt=old_note']);
 const readOnly=f.w.document.createElement('div');readOnly.innerHTML=f.w.LearningVilenkin6.preview(catalog);assert.equal(readOnly.querySelectorAll('ol li').length,27);assert.equal(readOnly.querySelectorAll('button').length,0);
});
function cabinetFixture(t, role='student'){
 const dom=new JSDOM(html,{url:'https://cabinet.example/learning/#home',runScripts:'outside-only'}),w=dom.window,calls=[];
 w.setInterval=()=>0;w.HTMLDialogElement.prototype.close=function(){this.open=false;};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 w.LearningCatalog=catalog;w.eval(source);
 const startup=appSource.lastIndexOf("(async()=>{const revision=authRevision;try{try{const status=await api('/status')");assert(startup>0);
 w.eval(appSource.slice(0,startup)+`window.fixtureApp={set(person,people=[]){account=person;students=people;assignments=[];attempts=[];authReady=false;},render,assignmentDialog,assignmentItems,previewStudent};})();`);
 w.fetch=async (url,options)=>{calls.push({url,options});const result=url.endsWith('/progress')?{progress:[]}:url.endsWith('/profile')?{profile:learner.profile}:url.endsWith('/report')?{report:{student:learner,attempts:[],positions:[]}}:url.endsWith('/ai-drafts')?{drafts:[]}:url.endsWith('/parent-access')?{parentAccess:{exists:false}}:{plan:{items:[]}};return{ok:true,status:200,json:async()=>result};};
 w.fixtureApp.set(role==='teacher'?{id:'fixture_teacher',role:'teacher',name:'Fixture teacher'}:structuredClone(learner),[structuredClone(learner)]);
 t.after(()=>w.close());return{w,calls,main:w.document.getElementById('main'),async go(route){w.history.replaceState(null,'','#'+route);await w.fixtureApp.render();await tick();}};
}
test('actual cabinet home/course/route target Vilenkin and old school route stays unchanged',async t=>{
 const f=cabinetFixture(t);for(const route of ['home','course','route']){await f.go(route);assert(f.main.querySelector('[data-vilenkin6-course]'),route);assert.equal(f.main.querySelectorAll('[data-vilenkin6-open]').length,27);assert(!f.main.textContent.includes('7 класс'));}
 assert(f.calls.every(call=>!call.options?.method||call.options.method==='GET'));
 f.w.fixtureApp.set({...learner,profile:{course:'school'}});await f.go('course');assert.equal(f.main.querySelector('h1').textContent,'Мой курс · 7 класс');assert(f.main.querySelector('#catalog-grid'));
});
test('actual teacher course, assignment filtering, and pupil preview use correct class without account mutations',async t=>{
 const f=cabinetFixture(t,'teacher');await f.go('course');assert(f.main.querySelector('a[href="#course=vilenkin6"]'));
 await f.go('course=vilenkin6');assert(f.main.querySelector('[data-vilenkin6-course]'));
 assert.equal(f.w.fixtureApp.assignmentItems('vilenkin6').length,27);
 f.w.fixtureApp.assignmentDialog({learnerIds:[learner.id]});const form=f.w.document.querySelector('#assignment-form');assert.equal(form.elements.course.value,'vilenkin6');assert.equal(form.elements.content.options.length,27);assert.equal(form.querySelector('[type=submit]').textContent,'Создать черновик');
 f.w.document.querySelector('#modal').close();await f.go('preview='+learner.id);assert(f.main.querySelector('[data-vilenkin6-preview]'));assert.match(f.main.textContent,/6 класс · Виленкин/);
 assert(f.calls.every(call=>!call.options?.method||call.options.method==='GET'));
});
test('teacher profile form supports the new direction and hides exam-only reports',async t=>{
 const f=cabinetFixture(t,'teacher');f.w.eval(fs.readFileSync(path.join(__dirname,'../learning/teaching.js'),'utf8'));
 await f.go('student='+learner.id);await tick();const form=f.main.querySelector('#teaching-profile');assert(form);assert.equal(form.elements.course.value,'vilenkin6');assert.equal(form.querySelector('option[value=vilenkin6]').textContent,'6 класс · Виленкин');assert(f.main.querySelector('[data-ege-positions]').hidden);
});
