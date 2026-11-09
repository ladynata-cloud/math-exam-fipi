'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),KEY='mathexam.makarychev8.2024.v1';
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const now=1794222000000,day=86400000;
function boot(makeState=()=>null,{route=true,hash='#home'}={}){
  const dom=new JSDOM(read('school/makarychev8/index.html'),{url:'https://example.test/school/makarychev8/'+hash,runScripts:'outside-only'});
  const w=dom.window;w.scrollTo=()=>{};w.Date.now=()=>now;
  for(const file of ['school/peterson6/math.js','school/makarychev8/check.js','school/makarychev8/data.js'])w.eval(read(file));
  const lessons=w.MakarychevCourse.lessons,state=makeState(lessons);
  if(state)w.localStorage.setItem(KEY,JSON.stringify(state));
  const before=w.localStorage.getItem(KEY);
  if(route)for(const file of ['school/shared/learning-route.js','school/shared/learning-route-progress.js'])w.eval(read(file));
  w.eval(read('school/makarychev8/app.js'));
  return {w,doc:w.document,lessons,before,close:()=>w.close(),state:()=>JSON.parse(JSON.stringify(w.MakarychevApp.getState()))};
}
function blank(){return {version:1,tasks:{},practice:{},last:null,origin:null};}
function result(task,at,{assisted=false}={}){
  return {value:task.answer,attempts:1,correct:true,independent:!assisted,assisted,
    completion:{attempts:1,independent:!assisted,assisted,...(at?{at}:{})}};
}
function fixture(lessons,{timestamps=true,third=false,helped=false}={}){
  const s=blank(),first=lessons[0],second=lessons[1];
  assert(first.tasks.length>=4);
  s.tasks[first.tasks[0].id]=result(first.tasks[0],timestamps?now-4*day:null);
  s.tasks[first.tasks[1].id]=result(first.tasks[1],timestamps?now-4*day+1000:null,{assisted:helped});
  if(third)s.tasks[first.tasks[2].id]=result(first.tasks[2],now);
  s.tasks[second.tasks[0].id]={value:'123,45',note:'Сохрани мой черновик'};
  s.last={hash:'#lesson/'+second.id+'/0'};
  return s;
}
test('one route replaces duplicate home maps and remains read-only',()=>{
  const f=boot();try{
    assert.equal(f.doc.querySelectorAll('.lr-route').length,1);
    assert.equal(f.doc.querySelectorAll('.lr-topic').length,51);
    assert.equal(f.doc.querySelectorAll('.hero,.lesson-card').length,0);
    assert.equal(f.w.localStorage.getItem(KEY),null);
    assert.equal(f.doc.querySelectorAll('#course-number-search').length,1);
    assert.match(f.doc.querySelector('.lr-assessment-summary').textContent,/0 из/);
  }finally{f.close();}
});
test('draft continuation remains primary while delayed new-task practice is separate',()=>{
  const f=boot(l=>fixture(l));try{
    const [first,second]=f.lessons;
    assert.equal(f.doc.querySelector('.lr-primary').getAttribute('href'),'#lesson/'+second.id+'/0');
    assert.equal(f.doc.querySelector('.lr-practice a').getAttribute('href'),'#lesson/'+first.id+'/2');
    assert.match(f.doc.querySelector('.lr-practice').textContent,/Повторить/);
    assert.match(f.doc.querySelector('.lr-topic .lr-assessment-label').textContent,/Пора повторить/);
    assert.match(f.doc.querySelector('.lr-course-progress').textContent,/2самостоятельно/);
    assert.match(f.doc.querySelector('.lr-confirmed-count').textContent,/0 из 51/);
    assert.equal(f.state().tasks[second.tasks[0].id].note,'Сохрани мой черновик');
    assert.equal(f.state().tasks[first.tasks[0].id].completion.at,now-4*day);
    assert.equal(f.w.localStorage.getItem(KEY),f.before,'map viewing cannot rewrite legacy records');
  }finally{f.close();}
});
test('third distinct result after delay confirms review without declaring all tasks complete',()=>{
  const f=boot(l=>fixture(l,{third:true}));try{
    assert.match(f.doc.querySelector('.lr-topic .lr-assessment-label').textContent,/Подтверждено повторением/);
    assert.match(f.doc.querySelector('.lr-confirmed-count').textContent,/0 из 51/);
    assert.equal(f.doc.querySelector('.lr-topic').classList.contains('lr-topic-confirmed'),false);
    assert.doesNotMatch(f.doc.querySelector('.lr-practice').textContent,/Повторить/);
  }finally{f.close();}
});
test('unknown old completion times never invent a review deadline and assistance never counts twice',()=>{
  for(const options of [{timestamps:false},{helped:true}]){
    const f=boot(l=>fixture(l,options));try{
      assert.doesNotMatch(f.doc.querySelector('.lr-topic .lr-assessment-label')?.textContent||'',/Пора повторить|Подтверждено повторением/);
      if(options.helped)assert.match(f.doc.querySelector('.lr-assessment-summary').textContent,/0 из/);
      assert.equal(f.w.localStorage.getItem(KEY),f.before);
    }finally{f.close();}
  }
});
test('a new answer records its time and survives a route reload',()=>{
  const f=boot(()=>null,{hash:'#lesson/p01/0'});try{
    const task=f.lessons[0].tasks[0],input=f.doc.querySelector('#final-answer');
    assert(input,'fixture must be an actual numeric answer');
    input.value=task.answer;input.dispatchEvent(new f.w.Event('input',{bubbles:true}));
    f.doc.querySelector('#answer-form').dispatchEvent(new f.w.Event('submit',{bubbles:true,cancelable:true}));
    assert.equal(f.state().tasks[task.id].completion.at,now);
    const saved=f.state(),again=boot(()=>saved);try{assert.equal(again.state().tasks[task.id].completion.at,now);}finally{again.close();}
  }finally{f.close();}
});
test('failed route resources retain the earlier mastery home as fallback',()=>{
  const f=boot(l=>fixture(l),{route:false});try{
    assert.equal(f.doc.querySelectorAll('.lr-route').length,0);
    assert.equal(f.doc.querySelectorAll('.lesson-card').length,51);
    assert.match(f.doc.querySelector('#main').textContent,/Пора повторить/);
    assert.equal(f.doc.querySelectorAll('#course-number-search').length,1);
  }finally{f.close();}
});
