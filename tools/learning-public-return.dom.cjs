'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const source=fs.readFileSync(path.join(__dirname,'../learning/public-practice.js'),'utf8');
function fixture(hash='route'){
  const dom=new JSDOM('<main id="main"></main>',{url:'https://cabinet.example/learning/#'+hash,runScripts:'outside-only'});
  dom.window.eval(source);return dom;
}
test('late-rendered practice links retain the exact cabinet route and work as normal same-tab links',async()=>{
  const dom=fixture('preview=synthetic-pupil'),{window:w}=dom,host=w.document.querySelector('main');
  try{
    host.innerHTML='<a target="_blank" href="https://mathexam.space/trainers/oge-task11-graphs-trainer.html">Графики ↗</a><a href="#attempt=saved">Моё решение</a>';
    await new Promise(resolve=>setImmediate(resolve));
    const link=host.querySelector('a'),params=new w.URLSearchParams(link.hash.slice(1));
    assert.equal(params.get('public-practice'),'/trainers/oge-task11-graphs-trainer.html');
    assert.equal(params.get('return'),'preview=synthetic-pupil');assert.equal(link.target,'');
    assert.equal(link.textContent,'Графики →');assert.equal(host.querySelectorAll('a')[1].hash,'#attempt=saved');
  }finally{w.close();}
});
test('untrusted origins and account-entry routes cannot become iframe or return destinations',()=>{
  const dom=fixture(),{window:w}=dom,api=w.LearningPublicPractice;
  try{
    for(const value of ['https://evil.test/trainers/a.html','https://mathexam.space.evil.test/trainers/a.html','//evil.test/trainers/a.html','javascript:alert(1)','https://u:p@mathexam.space/trainers/a.html','/learning/#quick=secret','/trainers/../learning/'])assert.equal(api.publicPath(value),'',value);
    for(const route of ['quick=secret','invite=secret','login=pupil','https://evil.test','route&quick=secret','public-practice=x'])assert.equal(api.returnRoute(route),'home');
    for(const route of ['home','route','course=oge','program-course=school7','student=synthetic-pupil','preview=synthetic-pupil'])assert.equal(api.returnRoute(route),route);
  }finally{w.close();}
});
test('public frame is isolated, gets no cabinet route, and cleanup leaves no hidden shell',()=>{
  const dom=fixture('preview=synthetic-pupil'),{window:w}=dom,host=w.document.querySelector('main'),api=w.LearningPublicPractice;
  try{
    const cleanup=api.mount(host,api.href('/trainers/task19-trainer.html').slice(1));
    const frame=host.querySelector('iframe');assert.equal(frame.src,'https://mathexam.space/trainers/task19-trainer.html');
    assert.equal(frame.referrerPolicy,'no-referrer');assert(!frame.src.includes('synthetic-pupil'));
    assert(!frame.sandbox?.contains('allow-top-navigation'));assert(!frame.getAttribute('sandbox').includes('allow-top-navigation'));
    assert.equal(host.querySelector('[data-cabinet-return]').hash,'#preview=synthetic-pupil');
    assert(w.document.body.classList.contains('public-practice-open'));cleanup();
    assert(!host.querySelector('iframe'));assert(!w.document.body.classList.contains('public-practice-open'));
    w.LearningTrainerOrigin=w.location.origin;
    api.mount(host,api.href('/trainers/task19-trainer.html').slice(1));assert(!host.querySelector('iframe'));assert(host.querySelector('a'));
  }finally{w.close();}
});
