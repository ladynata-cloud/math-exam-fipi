'use strict';
// Synthetic learners and mocked HTTP responses only. Opening an attached course
// must not create managed attempts, persist a profile or claim personal credit.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),read=name=>fs.readFileSync(path.join(root,name),'utf8');
const attached=require('../learning/attached-course'),catalog=require('../learning/catalog');
const url='https://mathexam.space/trainers/college-functions/';
const focus='Курс: '+url+'\nСначала попробуй сам. <b>Подсказки</b> доступны.';
const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('only the exact canonical focus URL attaches the college course',()=>{
  for(const value of [url,'Курс: '+url,'('+url+').',focus]){
    const profile=Object.freeze({course:'school',focus:value});
    assert.equal(attached.selected(profile).id,'college-functions');
    assert.equal(profile.focus,value);
  }
  for(const value of ['',null,undefined,'Колледж · Графики функций',url+'?next=elsewhere',url+'#B1',url+'.evil',url+'index.html',
    url.replace('https:','http:'),url.replace('mathexam.space','mathexam.space.evil.example'),url.replace('mathexam.space','mathexam.space@evil.example'),
    'https://evil.example/?next='+url,'prefix'+url,url.replace('/trainers/','/%74rainers/'),'<img src=x onerror=alert(1)>']){
    assert.equal(attached.selected({course:'school',focus:value}),null,String(value));
    assert.equal(attached.markup({course:'school',focus:value}),'',String(value));
  }
  const marked=attached.withNumberTheoryOnly(url,true);
  assert.equal(attached.selected({course:'school',focus:marked}).id,'grade6-number-theory-only','explicit existing route marker retains priority');
});

function checkCard(main,teacher=false){
  assert.equal(main.querySelectorAll('[data-attached-course="college-functions"]').length,1);
  assert.equal(main.querySelector('[data-attached-course-open]').href,url);
  const board=main.querySelector('[data-attached-course-board]');
  if(teacher){
    const link=new URL(board.href);
    assert.equal(link.origin,'https://mathexam.space');
    assert.equal(link.pathname,'/trainers/trainer-board.html');
    assert.deepEqual([...link.searchParams],[['trainer','/trainers/college-functions/index.html']]);
  }else assert.equal(board,null,'pupil joins the teacher room instead of opening a separate board');
  for(const link of main.querySelectorAll('[data-attached-course] a')){
    assert.equal(link.target,'_blank');assert.equal(link.rel,'noopener noreferrer');
  }
  assert.match(main.querySelector('[data-college-functions-room]').textContent,/ссылку.*комнаты/);
  assert.match(main.querySelector('[data-attached-course-storage]').textContent,/не записывается как самостоятельное решение/);
  assert.equal(main.querySelector('[data-attached-course] button,[data-attached-course] form'),null);
}

test('picker, attached teacher card and server registry resolve the same explicit HTML route',()=>{
  const picker=JSON.parse(read('trainers/board-picker-data.json')).entries.filter(e=>e.href.includes('/college-functions/'));
  assert.equal(picker.length,1);assert.equal(picker[0].href,'/trainers/college-functions/index.html');
  const sandbox={window:{},location:new URL('https://mathexam.space/trainers/trainer-board.html'),URL};
  vm.runInNewContext(read('trainers/board-picker.js'),sandbox);
  assert.equal(sandbox.window.BoardPicker.normalize(picker[0].href),picker[0].href);
  const registry=require('../board-server/trainer-registry').loadTrainerRegistry({env:{}});
  assert.equal(registry.loaded,true);
  assert.deepEqual(registry.entries.find(e=>e.trainerId==='college-functions'),{
    trainerId:'college-functions',file:'trainers/college-functions/index.html',version:'1.0.0',
    stateSchemaVersion:1,bridgeProtocolVersion:1,allowLegacyHtml:false
  });
  assert.equal(registry.progressEntries.some(e=>e.trainerId==='college-functions'),false);
});

async function fixture({role='student',route='home',selected=true,allowSave=false}={}){
  const dom=new JSDOM(read('learning/index.html'),{url:`https://cabinet.example/learning/?role=${role}#${route}`,runScripts:'outside-only'});
  const {window}=dom,calls=[];
  const profile={course:'school',goal:null,focus:selected?focus:'Повторить выбранную тему.',version:1};
  const pupil={id:'fixture-pupil',role:'student',name:'Проверочный ученик',login:'fixture-pupil',profile};
  const teacher={id:'fixture-teacher',role:'teacher',name:'Преподаватель',login:'fixture-teacher'};
  const own={id:'fixture-work',learnerId:pupil.id,trainerId:'ege-path',contentId:'triangle',title:'Сохранённая работа',outcome:'started',updatedAt:'2026-01-01T00:00:00Z'};
  const attempts=[own,{...own,id:'peer-work',learnerId:'fixture-peer'}];
  window.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
  window.LearningCatalog=catalog;
  window.LearningRoute={mount(host){host.innerHTML='<h1 data-original-route>Прежний маршрут</h1>';return()=>{};}};
  window.MathExamWelcome={maybeOpen(){},cleanup(){}};
  window.fetch=async(target,options={})=>{
    const request=String(target).replace('/api/learning','');calls.push({request,method:options.method||'GET'});
    if(options.method==='POST'){
      assert(allowSave&&request==='/teacher/students/fixture-pupil/profile','Unexpected write');
      const body=JSON.parse(options.body);assert.equal(body.expectedVersion,profile.version);
      assert.equal(body.course,'school');assert.equal(body.goal,null);
      Object.assign(profile,{focus:body.focus.trim(),version:profile.version+1});
    }
    const responses={
      '/status':{},'/session':{account:role==='teacher'?teacher:pupil},'/profile':{profile},
      '/attempts':{attempts},'/assignments':{assignments:[]},'/lessons':{lessons:[]},
      '/teacher/students':{students:[pupil]},'/teacher/students/fixture-pupil/report':{student:pupil,attempts,counts:{}},
      '/teacher/students/fixture-pupil/profile':{profile},'/teacher/students/fixture-pupil/plan':{items:[]},
      '/teacher/students/fixture-pupil/ai-drafts':{drafts:[]},'/teacher/students/fixture-pupil/parent-access':{parentAccess:{exists:false}}
    };
    assert(Object.hasOwn(responses,request),'Unexpected API '+request);
    return {ok:true,status:200,json:async()=>structuredClone(responses[request])};
  };
  for(const file of ['attached-course','vilenkin6-course','preparation','teaching','app'])window.eval(read('learning/'+file+'.js'));
  for(let i=0;i<25;i++)await tick();
  return {dom,window,main:window.document.getElementById('main'),calls,profile,attempts};
}

test('pupil home, course and route show college entry and preserve only the pupil prior work',async()=>{
  for(const route of ['home','course','route']){
    const f=await fixture({route});
    try{
      checkCard(f.main);
      assert.equal(f.main.querySelector('h1').textContent,'Колледж · Графики функций');
      assert(!f.main.textContent.includes('7 класс'));
      assert(f.main.textContent.includes('<b>Подсказки</b>'));
      assert.equal(f.main.querySelectorAll('script,img,[onerror]').length,0);
      assert(f.main.querySelector('[data-attached-prior-work] a[href="#attempt=fixture-work"]'));
      assert.equal(f.main.querySelector('a[href="#attempt=peer-work"]'),null);
      assert(f.calls.every(c=>c.method==='GET'));assert.equal(f.profile.focus,focus);assert.equal(f.attempts.length,2);
    }finally{f.dom.window.close();}
  }
});

test('teacher roster and cards use the attached title while preview stays read-only',async()=>{
  for(const route of ['students','preview=fixture-pupil','student=fixture-pupil']){
    const f=await fixture({role:'teacher',route});
    try{
      assert(f.main.textContent.includes('Колледж · Графики функций'));
      if(route==='students')assert.equal(f.main.querySelector('.student-goal').textContent,'Колледж · Графики функций');
      else checkCard(f.main,route.startsWith('student='));
      if(route.startsWith('preview'))assert(f.main.querySelector('.preview-banner'));
      if(route.startsWith('student='))assert.equal(f.main.querySelector('[name=course]').value,'school');
      assert(f.calls.every(c=>c.method==='GET'));assert.equal(f.profile.focus,focus);
    }finally{f.dom.window.close();}
  }
});

test('saving the canonical course in the existing teacher form updates only that profile',async()=>{
  const f=await fixture({role:'teacher',route:'student=fixture-pupil',selected:false,allowSave:true});
  try{
    assert.equal(f.main.querySelector('[data-attached-course]'),null);
    const form=f.main.querySelector('#teaching-profile');form.elements.focus.value=focus;
    form.dispatchEvent(new f.window.Event('submit',{bubbles:true,cancelable:true}));
    for(let i=0;i<25;i++)await tick();
    checkCard(f.main,true);
    assert.equal(f.profile.version,2);assert.equal(f.profile.focus,focus);
    assert.deepEqual(f.calls.filter(c=>c.method!=='GET').map(c=>c.request),['/teacher/students/fixture-pupil/profile']);
    assert.equal(f.attempts.length,2);
  }finally{f.dom.window.close();}
});
