'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'../..'),dir=path.join(root,'geometry-course/textbook');
const bundle=JSON.parse(fs.readFileSync(path.join(dir,'data/course.json'),'utf8'));
function setup(){
 const dom=new JSDOM('<div id="app"></div>',{url:'https://example.test/geometry-course/textbook/',runScripts:'outside-only'});
 for(const file of [path.join(dir,'assets/math-text.js'),path.join(dir,'assets/planar-viewer.js'),path.join(dir,'assets/engine.js')])dom.window.eval(fs.readFileSync(file,'utf8'));
 const {window:w}=dom,d=w.document,app=w.GeometryTextbook.createApp(d.getElementById('app'),{...bundle,allowInReview:true});
 return {dom,w,d,app};
}
const sample=bundle.lessons.find(l=>l.kind==='exercise'&&l.steps.length>2);
const key='mathExamTextbook.v1:'+sample.source.bookId+':'+sample.id+':r'+sample.revision;
let checks=0;
{
 const {dom,w,d,app}=setup();assert(app.open(sample.id));
 const input=d.getElementById('final-answer');input.value='Доказательство с обоснованием';input.dispatchEvent(new w.Event('input',{bubbles:true}));
 const next=[...d.querySelectorAll('button')].find(b=>b.textContent==='Разобрать по шагам');next.click();next.click();
 assert.equal(d.querySelectorAll('[data-step]').length,2);assert.equal(JSON.parse(w.localStorage.getItem(key)).assisted,true);
 app.home();app.open(sample.id);assert.equal(d.getElementById('final-answer').value,'Доказательство с обоснованием');assert.equal(d.querySelectorAll('[data-step]').length,2);
 assert.equal(d.querySelector('[data-main-model] svg').dataset.view,'step-2');
 d.querySelector('[data-final-form]').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 assert.match(d.querySelector('[data-final-feedback]').textContent,/обсудить с учителем/);assert.equal(JSON.parse(w.localStorage.getItem(key)).checked,false);
 checks+=4;app.destroy();dom.window.close();
}
{
 const {dom,w,d,app}=setup();app.open(sample.id);
 const input=d.getElementById('final-answer');input.value='Запись, которую нельзя потерять';input.dispatchEvent(new w.Event('input',{bubbles:true}));
 w.localStorage.setItem(key,JSON.stringify({draft:'Работа из другого окна',revealed:0}));
 input.value='Новый текст прежнего окна';input.dispatchEvent(new w.Event('input',{bubbles:true}));
 assert(d.querySelector('.course-conflict'));assert.equal(JSON.parse(w.localStorage.getItem(key)).draft,'Работа из другого окна');
 assert.match(d.querySelector('.course-conflict textarea').value,/Новый текст прежнего окна/);assert.equal(input.readOnly,true);
 checks++;app.destroy();dom.window.close();
}
{
 const {dom,w,d,app}=setup();app.open(sample.id);
 const original=w.Storage.prototype.setItem;w.Storage.prototype.setItem=function(){throw new w.DOMException('Quota','QuotaExceededError');};
 const input=d.getElementById('final-answer');input.value='Не потерять после ошибки сохранения';input.dispatchEvent(new w.Event('input',{bubbles:true}));
 app.home();app.open(sample.id);assert.equal(d.getElementById('final-answer').value,'Не потерять после ошибки сохранения');assert.match(d.querySelector('.course-alerts').textContent,/Не удалось сохранить/);
 d.querySelector('[data-final-form]').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.match(d.querySelector('[data-final-feedback]').textContent,/только в открытой странице/);assert.doesNotMatch(d.querySelector('[data-final-feedback]').textContent,/Рассуждение сохранено/);
 w.Storage.prototype.setItem=original;checks+=2;app.destroy();dom.window.close();
}
{
 const {dom,w,d,app}=setup();app.destroy();
 const publicApp=w.GeometryTextbook.createApp(d.getElementById('app'),bundle);
 const approved=bundle.lessons.filter(l=>l.status==='reviewed');
 assert.equal(publicApp.coverage.available,approved.length);
 for(const lesson of bundle.lessons)assert.equal(publicApp.open(lesson.id),lesson.status==='reviewed','Public chapter boundary '+lesson.id);
 assert.equal(d.querySelector('[data-preview-notice]'),null);
 checks++;publicApp.destroy();dom.window.close();
}
{
 const {dom,w,d,app}=setup();app.destroy();
 Object.defineProperty(w,'localStorage',{configurable:true,get(){throw new w.DOMException('Blocked','SecurityError');}});
 const memoryApp=w.GeometryTextbook.createApp(d.getElementById('app'),{...bundle,allowInReview:true});assert(memoryApp.open(sample.id));assert.match(d.querySelector('.course-alerts').textContent,/Сохранение в браузере недоступно/);
 const input=d.getElementById('final-answer');input.value='Работа без доступа к хранилищу';input.dispatchEvent(new w.Event('input',{bubbles:true}));d.querySelector('[data-final-form]').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 assert.match(d.querySelector('[data-final-feedback]').textContent,/только в открытой странице/);assert.doesNotMatch(d.querySelector('[data-final-feedback]').textContent,/Рассуждение сохранено/);memoryApp.home();memoryApp.open(sample.id);assert.equal(d.getElementById('final-answer').value,'Работа без доступа к хранилищу');assert.match(d.querySelector('.course-alerts').textContent,/Скопируй их перед закрытием/);
 checks++;memoryApp.destroy();dom.window.close();
}
{
 const {dom,w,d,app}=setup();app.open(sample.id);const input=d.getElementById('final-answer');input.value='Не переписывать неизменённую работу';input.dispatchEvent(new w.Event('input',{bubbles:true}));
 let writes=0;const original=w.Storage.prototype.setItem;w.Storage.prototype.setItem=function(...args){writes++;return original.apply(this,args);};d.querySelector('[data-final-form]').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(writes,0,'An unchanged save must not rewrite a stale renderer cache');assert.match(d.querySelector('[data-final-feedback]').textContent,/Рассуждение сохранено/);w.Storage.prototype.setItem=original;
 checks++;app.destroy();dom.window.close();
}
{
 const {dom,w,d,app}=setup();
 const chapters=bundle.build.chapters.map(chapter=>chapter.chapterLabel);
 const questions=chapters.map(chapter=>bundle.lessons.find(l=>l.source.chapter===chapter&&l.source.collection==='selfcheck'&&l.source.exercise==='1'));
 assert(questions.every(Boolean),'Every chapter review question must exist');assert.equal(new Set(questions.map(question=>question.id)).size,chapters.length);
 for(let i=0;i<questions.length;i++){app.open(questions[i].id);const input=d.getElementById('final-answer');input.value='Отдельный черновик главы '+i;input.dispatchEvent(new w.Event('input',{bubbles:true}));}
 for(let i=0;i<questions.length;i++){app.open(questions[i].id);assert.equal(d.getElementById('final-answer').value,'Отдельный черновик главы '+i,'Restarted question numbers must not overwrite learner work');}
 for(const chapter of chapters.slice(1)){
  const exercise=bundle.lessons.find(l=>l.source.chapter===chapter&&l.source.collection==='main'&&l.help.some(h=>h.theoryIds?.some(id=>bundle.lessons.find(t=>t.id===id)?.source.chapter===chapter)));
  assert(exercise,'Chapter '+chapter+' exercises link to its theory');app.open(exercise.id);
  const draft='Рассуждение по главе '+chapter,input=d.getElementById('final-answer');input.value=draft;input.dispatchEvent(new w.Event('input',{bubbles:true}));
  const theoryId=exercise.help.flatMap(h=>h.theoryIds||[]).find(id=>bundle.lessons.find(t=>t.id===id)?.source.chapter===chapter),theory=bundle.lessons.find(l=>l.id===theoryId);
  const button=[...d.querySelectorAll('button')].find(b=>b.textContent==='Почему? '+theory.title);assert(button);button.click();
  assert.equal(d.querySelector('dialog').dataset.theory,theoryId);d.querySelector('dialog>button').click();
  assert.equal(d.querySelector('dialog'),null);assert.equal(d.getElementById('final-answer').value,draft);
  checks+=2;
 }
 checks++;app.destroy();dom.window.close();
}
console.log('ATANASYAN_7_9_RETAINED_WORK_OK '+JSON.stringify({checks}));
