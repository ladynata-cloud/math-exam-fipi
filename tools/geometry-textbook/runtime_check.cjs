'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const {expectedTitle}=require('./caption_expectations.cjs');
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
 const {dom,w,d,app}=setup();
 function open(number,part=1){app.open('atanasyan-7-9-main-'+number+'-part-'+part);}
 function submit(text){
  const input=d.getElementById('final-answer');input.value=text;input.dispatchEvent(new w.Event('input',{bubbles:true}));
  d.querySelector('[data-quantity-check]').click();
  return d.querySelector('[data-quantity-feedback]').textContent;
 }
 // Independently computed quantities, indexed by textbook subpart. A null is
 // a construction, a symbolic result or another form outside this checker.
 const answers={
  41:['10,5 см','1,5 см'],51:['121°',null],52:['48°'],53:['85°'],55:['60°'],62:['69°','90°','165°'],
  78:['8 см','16 см'],95:['75 см'],114:['8 см'],117:['50°'],228:['58°','26°',null,null],
  255:['7 см','8 см','10 см'],261:['17,6 см'],264:['18 см'],276:['5 см'],279:['8 см'],
  286:['3 см'],344:['7 см'],357:['4 см'],371:['60 см'],391:['18,1 см'],463:['540°','720°','1440°'],
  545:['1,44 см²','9/16 дм²','18 м²'],546:['4 см','1,5 дм',null],547:['2400 мм²','0,24 дм²'],
  553:['12 м'],555:['180 см²','4 см','18 см',null],556:['156 см²'],557:['84 см²'],558:['18 см²'],
  559:['56,7 см²'],564:['38,5 см²',null,'5,4 см',null],565:['8 см'],566:['5,625 см'],
  567:['22 см²','1,8 дм²'],578:['133 см²','24 см²','72 см²'],585:['15 см'],597:['168/25 см','120/17 см'],
  598:['10/3 см'],599:['60 см','40 см'],600:['5 см','18 см'],629:['30 см²'],651:['4,5 м'],
  672:['10 см'],673:['5 см'],674:['42 см'],751:['4 см'],752:['16 см']
 };
 let numericCards=0;
 for(const [number,parts] of Object.entries(answers))for(const [index,answer] of parts.entries()){
  open(number,index+1);
  if(answer===null){assert.equal(d.querySelector('[data-quantity-check]'),null);continue;}
  numericCards++;assert.match(submit(answer),/Численный ответ верен/,number+' part '+(index+1));
 }
 assert.equal(numericCards,70);
 open(545,2); // Square with side 3/4 dm. Area = 9/16 dm².
 for(const answer of ['9/16','Мой способ.\nОтвет: 0,5625 дм².','56.25 см^2','0,5625 дм^²','0,5625 дм ^ ²','5625 мм2']){
  assert.match(submit(answer),/Численный ответ верен/);
 }
 for(const answer of ['9/16 см²','0,56251 дм²','9/16 дм','9/0','0,56 дм²','9/16 или 1','-9/16','']){
  assert.doesNotMatch(submit(answer),/Численный ответ верен/);
 }
 open(547,1);assert.match(submit('24 см²'),/в единицах, указанных в задании/);assert.match(submit('2400'),/Численный ответ верен/);
 open(597,2);assert.match(submit('240/34 см'),/Численный ответ верен/);assert.doesNotMatch(submit('7,06 см'),/Численный ответ верен/);
 open(228);assert.match(submit('116/2°'),/Численный ответ верен/);assert.doesNotMatch(submit('58 см'),/Численный ответ верен/);
 open(751);assert.match(submit('0,04 м'),/Численный ответ верен/);
 const key='mathExamTextbook.v1:atanasyan-2023-7-9:atanasyan-7-9-main-751-part-1:r1';
 assert.equal(JSON.parse(w.localStorage.getItem(key)).checked,false);assert.equal(JSON.parse(w.localStorage.getItem(key)).assisted,false);
 const input=d.getElementById('final-answer');input.value='Обоснование записано отдельно.\n4 см';input.dispatchEvent(new w.Event('input',{bubbles:true}));
 assert.equal(d.querySelector('[data-quantity-feedback]').textContent,'');app.home();open(751);assert.equal(d.getElementById('final-answer').value,input.value);
 open(46);assert.equal(d.querySelector('[data-quantity-check]'),null,'Construction needs more than the given angle');
 open(228,3);assert.equal(d.querySelector('[data-quantity-check]'),null,'Symbolic dependence is not a single number');
 checks++;app.destroy();dom.window.close();
}

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
  const button=[...d.querySelectorAll('button')].find(b=>b.textContent==='Почему? '+expectedTitle(theory));assert(button);button.click();
  assert.equal(d.querySelector('dialog').dataset.theory,theoryId);d.querySelector('dialog>button').click();
  assert.equal(d.querySelector('dialog'),null);assert.equal(d.getElementById('final-answer').value,draft);
  checks+=2;
 }
 checks++;app.destroy();dom.window.close();
}
console.log('ATANASYAN_7_9_RETAINED_WORK_OK '+JSON.stringify({checks}));
