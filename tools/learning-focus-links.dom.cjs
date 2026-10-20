'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const ROOT=path.resolve(__dirname,'..');
const catalog=require('../learning/catalog');
const map=require('../learning/preparation-map');
const plan=require('../docs/tasks/VERTICAL_DIVISION_ROUTE.plan.json');
const source=fs.readFileSync(path.join(ROOT,'learning/preparation.js'),'utf8');
const urls=['https://mathexam.space/trainers/rounding-stepwise.html','https://mathexam.space/trainers/task19-trainer.html'];
const focus=`Дополнительная тренировка:\nОкругление: ${urls[0]}\nГеометрические утверждения: ${urls[1]}`;
const tick=()=>new Promise(resolve=>setImmediate(resolve));

function fixture(){
 const dom=new JSDOM('<main></main>',{url:'https://cabinet.example/learning/',runScripts:'outside-only'});
 dom.window.LearningPreparation=map;dom.window.eval(source);return dom;
}
function checkLinks(host){
 const links=[...host.querySelectorAll('[data-focus-practice]')];
 assert.deepEqual(links.map(a=>a.href),urls);
 for(const a of links){assert.equal(a.target,'_blank');assert.equal(a.rel,'noopener noreferrer');assert(!a.hasAttribute('onclick'));assert(!a.hasAttribute('data-prep-start'));}
 assert.match(host.querySelector('[data-focus-practice-note]').textContent,/не входят в прогресс кабинета/);
 return links;
}

test('known public exercises become labelled links while notes and punctuation stay escaped',()=>{
 const dom=fixture(),{window}=dom,host=window.document.querySelector('main');
 try{
  host.innerHTML=window.LearningPreparationUI.focusMarkup(`До практики <b>прочитай</b> & подумай.\n(${urls[0]}).\n${urls[1]}!`);
  checkLinks(host);assert.equal(host.querySelectorAll('b,script,img').length,0);
  const text=host.querySelector('.prep-focus').textContent;
  assert.match(text,/<b>прочитай<\/b> & подумай/);assert.match(text,/\n\(Округление по шагам ↗\)\./);assert.match(text,/утверждения ↗!/);
 }finally{dom.window.close();}
});

test('arbitrary URLs, deceptive hosts, query strings and HTML remain inert text',()=>{
 const dom=fixture(),{window}=dom,host=window.document.querySelector('main');
 const unsafe=[
  'javascript:alert(1)', 'data:text/html,<script>alert(1)</script>',
  'http://mathexam.space/trainers/task19-trainer.html',
  'https://mathexam.space.evil.test/trainers/task19-trainer.html',
  'https://mathexam.space@evil.test/trainers/task19-trainer.html',
  'https://evil.test/?next='+urls[1],
  urls[1]+'?next=https://evil.test/',urls[1]+'#payload',urls[1]+'.evil',
  '<img src=x onerror=alert(1)>', 'https://other.example/lesson'
 ].join('\n');
 try{
  host.innerHTML=window.LearningPreparationUI.focusMarkup(unsafe);
  assert.equal(host.querySelectorAll('a,img,script,[onerror]').length,0);
  assert.equal(host.querySelector('.prep-focus').textContent,unsafe);
  assert.equal(host.querySelector('[data-focus-practice-note]'),null);
 }finally{dom.window.close();}
});

test('empty and plain notes preserve the previous plain-text behavior',()=>{
 const dom=fixture(),{window}=dom,host=window.document.querySelector('main');
 try{
  for(const value of ['',null,undefined])assert.equal(window.LearningPreparationUI.focusMarkup(value),'');
  const note='Повтори сложение.\n<em>Это текст</em>';
  host.innerHTML=window.LearningPreparationUI.focusMarkup(note);
  assert.equal(host.querySelector('.prep-focus').textContent,note);assert.equal(host.querySelectorAll('a,em').length,0);
 }finally{dom.window.close();}
});

test('student home and route keep all 26 managed steps and public practice never creates work',async()=>{
 for(const page of ['home','route']){
  const dom=fixture(),{window}=dom,host=window.document.querySelector('main'),calls=[],opened=[];
  try{
   window.LearningPreparationUI.mountRoute(host,{account:{id:'fixture',role:'student'},profile:{course:'oge',goal:'pass',focus},page,catalog,labels:{},attempts:[],assignments:[],
    api:async route=>{calls.push(route);if(route==='/plan')return plan;if(route==='/progress')return {progress:[]};return {totalPoints:0,pointsWithinLevel:0,level:1,nextLevelAt:100,uniqueCompleted:0,badges:[]};},
    openContent:async(...args)=>opened.push(args)});
   await tick();checkLinks(host);
   assert.deepEqual([...host.querySelectorAll('.prep-route-step')].map(x=>x.dataset.prepItem),plan.items.map(x=>x.catalogId));
   assert.deepEqual(calls.sort(),['/plan','/progress','/rewards']);assert.deepEqual(opened,[]);
   assert.equal(host.querySelectorAll('[aria-current="step"]').length,1);
  }finally{dom.window.close();}
 }
});

test('actual teacher preview shares links, with escaped fallback for a cached older helper',async()=>{
 for(const legacyHelper of [false,true]){
 const html=fs.readFileSync(path.join(ROOT,'learning/index.html'),'utf8');
 const dom=new JSDOM(html,{url:'https://cabinet.example/learning/?role=teacher#preview=fixture',runScripts:'outside-only'});
 const {window}=dom,calls=[];
 const teacher={id:'fixture-teacher',name:'Преподаватель',login:'fixture-teacher',role:'teacher'};
 const profile={course:'oge',goal:'pass',focus,version:1};
 const student={id:'fixture',name:'Проверочный ученик',login:'fixture-pupil',role:'student',profile};
 window.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
 window.LearningCatalog=catalog;
 window.fetch=async(url,options={})=>{
  const route=url.replace('/api/learning','');calls.push({route,method:options.method||'GET'});
  const responses={
   '/status':{},'/session':{account:teacher},'/attempts':{attempts:[]},'/assignments':{assignments:[]},'/lessons':{lessons:[]},
   '/teacher/students':{students:[student]},'/teacher/students/fixture/report':{student,attempts:[]},
   '/teacher/students/fixture/profile':{profile},'/teacher/students/fixture/plan':plan
  };
  assert(Object.hasOwn(responses,route),'Unexpected API route '+route);
  return {ok:true,status:200,json:async()=>structuredClone(responses[route])};
 };
 try{
  window.eval(source);
  if(legacyHelper)delete window.LearningPreparationUI.focusMarkup;
  window.eval(fs.readFileSync(path.join(ROOT,'learning/app.js'),'utf8'));
  for(let i=0;i<10&&!window.document.querySelector('.preview-banner');i++)await tick();
  const main=window.document.querySelector('#main');assert(main.querySelector('.preview-banner'));
  if(legacyHelper){assert.equal(main.querySelectorAll('[data-focus-practice]').length,0);assert(main.textContent.includes(focus));}
  else checkLinks(main);
  assert.equal(main.querySelectorAll('ol li').length,26);assert.equal(main.querySelectorAll('[data-prep-start]').length,0);
  assert(calls.every(call=>call.method==='GET'));assert.equal(profile.focus,focus);assert.equal(plan.items.length,26);
 }finally{dom.window.close();}
 }
});
