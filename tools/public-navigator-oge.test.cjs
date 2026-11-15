'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const ROOT=path.resolve(__dirname,'..');
const widget=fs.readFileSync(path.join(ROOT,'assets/assistant/navigator-widget.js'),'utf8');
function boot(route,nav='<nav class="oge-wayfinding"><a href="/trainers/oge-course/">Все темы ОГЭ</a></nav>') {
 const dom=new JSDOM('<!doctype html><body>'+nav+'<main><input id="answer" value="мой ответ"><button>Проверить</button></main></body>',{url:'https://mathexam.space'+route,runScripts:'outside-only'});
 const w=dom.window;
 w.MathExamPublicAssistantData={welcome:()=>({text:'Выберите тему'}),respond:()=>({text:'Материал найден',links:[]})};
 Object.defineProperty(w,'localStorage',{get(){throw Error('Navigation must not access learner storage');}});
 w.eval(widget);w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 return dom;
}
test('OGE navigation uses its own place after the return bar without inspecting or modifying answers',()=>{
 for(const route of ['/trainers/oge-task11-graphs-trainer.html','/trainers/oge-task22-functions-graphs.html','/trainers/oge-task24-proofs.html','/trainers/oge13-inequalities-series.html','/trainers/task19-trainer.html','/trainers/oge-1-5-trainers/practice-1-5-apartments.html']){
  const dom=boot(route),w=dom.window,d=w.document;
  try {
   const host=d.getElementById('maxexam-public-assistant');
   assert.equal(host.dataset.courseNavigation,'true',route);
   assert.equal(host.previousElementSibling,d.querySelector('nav.oge-wayfinding'));
   assert.equal(d.getElementById('answer').value,'мой ответ');
   const launcher=host.shadowRoot.querySelector('.launcher'),panel=host.shadowRoot.querySelector('.panel');
   launcher.click();assert.equal(panel.hidden,false);
   host.shadowRoot.querySelector('.icon-button').click();assert.equal(panel.hidden,true);
   assert.equal(host.shadowRoot.activeElement,launcher);
   assert.equal(d.getElementById('answer').value,'мой ответ');
   assert.equal(d.querySelectorAll('#maxexam-public-assistant').length,1);
  } finally {w.close();}
 }
});
test('unrelated pages and a missing or hidden OGE bar keep their established placement',()=>{
 for(const [route,nav] of [['/school/makarychev8/','<nav class="oge-wayfinding">Unrelated page</nav>'],['/trainers/oge-task11-graphs-trainer.html',''],['/trainers/oge-task11-graphs-trainer.html','<nav class="oge-wayfinding" hidden></nav>']]) {
  const dom=boot(route,nav);
  try {assert.equal(dom.window.document.getElementById('maxexam-public-assistant').hasAttribute('data-course-navigation'),false);}
  finally {dom.window.close();}
 }
});
test('excluded private routes are still excluded',()=>{
 for(const route of ['/learning/','/trainers/trainer-board.html']) {
  const dom=boot(route);
  try {assert.equal(dom.window.document.getElementById('maxexam-public-assistant'),null);}
  finally {dom.window.close();}
 }
});
