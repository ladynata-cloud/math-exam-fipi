'use strict';
// Synthetic account and DOM checks only. The public frame is never loaded.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
const attached=require('../learning/attached-course'),catalog=require('../learning/catalog');
const course='https://mathexam.space/school/peterson6/',line='https://mathexam.space/trainers/maxim-peterson6/';
const focus=`Прежнее замечание.\nКурс: ${course}\nТренировка: ${line}`;
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function settle(){for(let i=0;i<25;i++)await tick();}
test('only the two exact teacher-selected references activate the paired cabinet',()=>{
 for(const value of [focus,`${course}\n(${line}).`])assert.equal(attached.selected({course:'foundations',focus:value}).id,'peterson6-pair');
 for(const value of ['',course,line,`${course}?x=1\n${line}`,`${course}\n${line}#x`,`${course}\nhttps://mathexam.space.evil.test/trainers/maxim-peterson6/`,`https://evil.test/?next=${course}\n${line}`])assert.equal(attached.selected({course:'foundations',focus:value}),null,value);
 assert.equal(attached.selected({course:'foundations',focus:attached.withNumberTheoryOnly(focus,true)}).id,'grade6-number-theory-only');
 for(const value of ['peterson-course&preview=someone','peterson-line&x=1','peterson-course=evil','https://evil.test/','__proto__'])assert.equal(attached.publicCourse(value),null,value);
});
async function fixture({role='student',route='home',selected=true,trainerOrigin='https://mathexam.space'}={}){
 const dom=new JSDOM(read('learning/index.html'),{url:`https://cabinet.example/learning/?role=${role}#${route}`,runScripts:'outside-only'}),{window}=dom,calls=[],helpers=[];
 window.setInterval=()=>0;
 window.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
 window.LearningCatalog=catalog;
 window.LearningAssistant={mount(_host,options){helpers.push(options);return()=>{};}};
 const profile={course:'foundations',goal:null,focus:selected?focus:'Прежние темы.',version:1};
 const pupil={id:'fixture-pupil',name:'Проверочный ученик',role:'student',profile};
 const teacher={id:'fixture-teacher',name:'Преподаватель',role:'teacher'};
 const work={id:'fixture-work',learnerId:pupil.id,trainerId:'ege-path',contentId:'triangle',outcome:'started',updatedAt:'2026-01-01T00:00:00Z'};
 window.fetch=async(target,options={})=>{
  const request=String(target).replace('/api/learning','');calls.push({request,method:options.method||'GET'});
  const data={'/status':{trainerOrigin},'/session':{account:role==='teacher'?teacher:pupil,csrfToken:'synthetic-csrf'},'/profile':{profile},'/attempts':{attempts:[work]},'/assignments':{assignments:[]},'/lessons':{lessons:[]},'/teacher/students':{students:[pupil]},'/teacher/students/fixture-pupil/report':{student:pupil,attempts:[work]},'/teacher/students/fixture-pupil/profile':{profile},'/teacher/students/fixture-pupil/plan':{items:[],note:'Прежний план'}};
  assert(Object.hasOwn(data,request),'Unexpected API '+request);return{ok:true,status:200,json:async()=>structuredClone(data[request])};
 };
 window.eval(read('learning/attached-course.js'));window.eval(read('learning/app.js'));await settle();
 return{window,main:window.document.querySelector('#main'),calls,helpers,profile,async go(route){const changed=new Promise(resolve=>window.addEventListener('hashchange',resolve,{once:true}));window.location.hash=route;await changed;await settle();},close(){window.close();}};
}
test('paired home, route and course show both cards without starting work or losing existing attempts',async()=>{
 for(const route of ['home','route','course']){
  const f=await fixture({route});try{
   assert.equal(f.main.querySelectorAll('[data-peterson-course]').length,2,route);
   assert.deepEqual([...f.main.querySelectorAll('[data-attached-course-open]')].map(a=>a.getAttribute('href')),['#peterson-course','#peterson-line']);
   assert(f.main.querySelector('a[href="#attempt=fixture-work"]'));
   assert.match(f.main.querySelector('[data-attached-course-storage]').textContent,/отдельно от истории кабинета/);
   assert.equal(f.main.querySelector('iframe'),null);assert(f.calls.every(x=>x.method==='GET'));assert.equal(f.profile.focus,focus);
  }finally{f.close();}
 }
});
test('both student routes load only isolated public frames and dispose them on navigation',async()=>{
 for(const [route,url] of [['peterson-course',course],['peterson-line',line]]){
  const f=await fixture({route});try{
   const frame=f.main.querySelector('iframe');assert(frame,route);
   assert.equal(frame.src,url+'?cabinet=peterson-helper');assert.equal(frame.referrerPolicy,'no-referrer');
   assert.equal(frame.getAttribute('sandbox'),'allow-scripts allow-same-origin allow-downloads allow-modals');
   assert(!frame.src.includes('fixture'));assert(!frame.src.includes('csrf'));assert.equal(f.helpers.length,0,'No duplicate cabinet assistant under source helper');
   assert(f.calls.every(x=>x.method==='GET'));
   await f.go('home');assert.equal(frame.isConnected,false);assert.equal(f.main.querySelectorAll('[data-peterson-course]').length,2);
  }finally{f.close();}
 }
});
test('unselected, forged and teacher routes cannot mount a public work frame',async()=>{
 for(const options of [{selected:false,route:'peterson-course'},{route:'peterson-course&preview=fixture-pupil'},{route:'peterson-line&x=1'},{role:'teacher',route:'peterson-course'},{role:'teacher',route:'peterson-line'}]){
  const f=await fixture(options);try{assert.equal(f.main.querySelector('iframe'),null,JSON.stringify(options));assert(f.calls.every(x=>x.method==='GET'));}finally{f.close();}
 }
});
test('teacher preview exposes public material links, never active pupil work',async()=>{
 const f=await fixture({role:'teacher',route:'preview=fixture-pupil'});try{
  assert.equal(f.main.querySelectorAll('[data-peterson-course]').length,2);assert.equal(f.main.querySelector('iframe'),null);
  const links=[...f.main.querySelectorAll('[data-attached-course-open]')];assert.deepEqual(links.map(a=>a.href),[course,line]);
  assert(links.every(a=>a.target==='_blank'&&a.rel==='noopener noreferrer'));assert(f.main.querySelector('[data-peterson-preview]'));
  assert(f.calls.every(x=>x.method==='GET'));assert.equal(f.helpers.length,0);
 }finally{f.close();}
});
test('public origin cannot become the authenticated cabinet origin',async()=>{
 const f=await fixture({route:'peterson-course',trainerOrigin:'https://cabinet.example'});try{assert.equal(f.main.querySelector('iframe'),null);assert.match(f.main.textContent,/Не удалось открыть работу/);}finally{f.close();}
});
