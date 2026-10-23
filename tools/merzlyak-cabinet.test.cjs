'use strict';
// Synthetic profiles and mocked read-only HTTP responses; no real accounts.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const attached = require('../learning/attached-course');
const catalog = require('../learning/catalog');
const url = 'https://mathexam.space/stereo-course/merzlyak-10-base/';
const focus = `10 класс. Геометрия, базовый уровень.\nКурс: ${url}\nСначала повтори <b>определения</b>.`;
const tick = () => new Promise(resolve => setImmediate(resolve));

test('only the exact canonical course token attaches; deceptive URLs never select a course', () => {
  for (const value of [url, `Курс: ${url}`, `(${url}).`, focus]) {
    const profile = Object.freeze({course:'school', focus:value});
    assert.equal(attached.selected(profile).id, 'merzlyak-10-base');
    assert.equal(profile.focus, value);
  }
  for (const value of ['', null, undefined, url+'?next=elsewhere', url+'#ex-1-001', url+'.evil',
    url.replace('https:', 'http:'), url.replace('mathexam.space', 'mathexam.space.evil.test'),
    url.replace('mathexam.space', 'mathexam.space@evil.test'), 'https://evil.test/?next='+url,
    'prefix'+url, '<img src=x onerror=alert(1)>', 'Мерзляк 10 класс']) {
    assert.equal(attached.selected({course:'school', focus:value}), null, String(value));
    assert.equal(attached.markup({focus:value}), '', String(value));
  }
});

async function fixture({role='student', route='home', selected=true, helper=true, prior=true, saveProfile=false}={}) {
  const dom = new JSDOM(read('learning/index.html'), {url:`https://cabinet.example/learning/?role=${role}#${route}`, runScripts:'outside-only'});
  const {window} = dom, calls=[];
  const profile={course:'school',goal:null,focus:selected?focus:'Повтори школьные темы.',version:1};
  const student={id:'fixture-pupil',role:'student',name:'Проверочный ученик',login:'fixture-pupil',profile};
  const teacher={id:'fixture-teacher',role:'teacher',name:'Преподаватель',login:'fixture-teacher'};
  const old={id:'fixture-work',learnerId:student.id,trainerId:'ege-path',contentId:'triangle',title:'Сохранённая работа',outcome:'started',updatedAt:'2026-01-01T00:00:00Z'};
  const peer={...old,id:'peer-work',learnerId:'fixture-peer'};
  const rows=prior?[old,peer]:[];
  window.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
  window.LearningCatalog=catalog;
  window.LearningRoute={mount(host){host.innerHTML='<h1 data-original-school-route>Школьный маршрут</h1>';return()=>{};}};
  window.MathExamWelcome={maybeOpen(){calls.push({route:'welcome',method:'VIEW'});},cleanup(){}};
  window.fetch=async (target, options={})=>{
    const route=String(target).replace('/api/learning','');calls.push({route,method:options.method||'GET'});
    if(options.method==='POST'){
      assert(saveProfile&&route==='/teacher/students/fixture-pupil/profile','Unexpected write');
      const body=JSON.parse(options.body);assert.equal(body.expectedVersion,profile.version);
      assert.equal(body.course,'school');assert.equal(body.goal,null);
      Object.assign(profile,{focus:body.focus.trim(),version:profile.version+1});
    }
    const responses={
      '/status':{},'/session':{account:role==='teacher'?teacher:student},'/profile':{profile},
      '/attempts':{attempts:rows},'/assignments':{assignments:[]},'/lessons':{lessons:[]},
      '/teacher/students':{students:[student]},'/teacher/students/fixture-pupil/report':{student,attempts:rows,counts:{}},
      '/teacher/students/fixture-pupil/profile':{profile},'/teacher/students/fixture-pupil/plan':{items:[]},
      '/teacher/students/fixture-pupil/ai-drafts':{drafts:[]},'/teacher/students/fixture-pupil/parent-access':{parentAccess:{exists:false}}
    };
    assert(Object.hasOwn(responses,route),'Unexpected API route '+route);
    return {ok:true,status:200,json:async()=>structuredClone(responses[route])};
  };
  if(helper)window.eval(read('learning/attached-course.js'));
  window.eval(read('learning/preparation.js'));
  window.eval(read('learning/teaching.js'));
  window.eval(read('learning/app.js'));
  for(let n=0;n<25;n++)await tick();
  return {dom,window,main:window.document.getElementById('main'),calls,profile,rows};
}

function checkEntry(main) {
  assert.equal(main.querySelectorAll('[data-attached-course]').length,1);
  assert.equal(main.querySelector('[data-attached-course-open]').href,url);
  const board=new URL(main.querySelector('[data-attached-course-board]').href);
  assert.equal(board.origin,'https://mathexam.space');
  assert.equal(board.pathname,'/trainers/trainer-board.html');
  assert.deepEqual([...board.searchParams], [['trainer','/trainers/merzlyak-10-base.html']]);
  assert.match(main.querySelector('[data-attached-course-storage]').textContent,/сохраняются в браузере/);
  assert.match(main.querySelector('[data-attached-course-storage]').textContent,/не записывается как самостоятельное/);
}

test('actual pupil home, course and route prioritize grade 10 and retain only own previous work', async()=>{
  for(const route of ['home','course','route']){
    const f=await fixture({route});
    try{
      checkEntry(f.main);
      assert.equal(f.main.querySelector('h1').textContent,'10 класс · Геометрия Мерзляк');
      assert(!f.main.textContent.includes('7 класс'));
      assert(f.main.textContent.includes('<b>определения</b>'));
      assert.equal(f.main.querySelectorAll('script,img,[onerror]').length,0);
      assert(f.main.querySelector('[data-attached-prior-work] a[href="#attempt=fixture-work"]'));
      assert.equal(f.main.querySelector('a[href="#attempt=peer-work"]'),null);
      assert.equal(f.main.querySelector('details a[href="#division-course"]').textContent,'Умножение и деление');
      assert.equal(f.window.document.querySelector('#navigation [data-nav="division-course"]'),null);
      assert(f.calls.every(call=>call.method==='GET'));
      assert.equal(f.profile.focus,focus);assert.equal(f.rows.length,2);
    }finally{f.dom.window.close();}
  }
});

test('the teacher roster, preview and student card use the attached course without profile mutations',async()=>{
  for(const route of ['students','preview=fixture-pupil','student=fixture-pupil']){
    const f=await fixture({role:'teacher',route});
    try{
      assert(f.main.textContent.includes('10 класс · Геометрия Мерзляк'));
      if(route==='students')assert.equal(f.main.querySelector('.student-goal').textContent,'10 класс · Геометрия Мерзляк');
      else checkEntry(f.main);
      if(route.startsWith('preview'))assert(f.main.querySelector('.preview-banner'));
      if(route.startsWith('student=')){
        assert.equal(f.main.querySelector('[name=course]').value,'school');
        assert.equal(f.main.querySelector('[name=focus]').value,focus);
      }
      assert(f.calls.every(call=>call.method==='GET'));
      assert.equal(f.profile.course,'school');assert.equal(f.profile.version,1);
    }finally{f.dom.window.close();}
  }
});

test('other pupils and a cached older helper keep their existing routes and work',async()=>{
  for(const options of [{selected:false,route:'home'},{selected:false,route:'course'},{selected:false,route:'route'},{helper:false,route:'home'}]){
    const f=await fixture(options);
    try{
      assert.equal(f.main.querySelector('[data-attached-course]'),null);
      assert(f.window.document.querySelector('#navigation [data-nav="division-course"]'));
      if(options.route==='route')assert(f.main.querySelector('[data-original-school-route]'));
      if(options.route==='course')assert.equal(f.main.querySelector('h1').textContent,'Мой курс · 7 класс');
      assert(f.calls.every(call=>['GET','VIEW'].includes(call.method)));
    }finally{f.dom.window.close();}
  }
});

test('saving or removing the course note immediately refreshes the teacher card without changing the direction',async()=>{
  const f=await fixture({role:'teacher',route:'student=fixture-pupil',saveProfile:true});
  try{
    const form=f.main.querySelector('#teaching-profile');
    async function save(note){
      form.elements.focus.value=note;
      form.elements.focus.dispatchEvent(new f.window.Event('input',{bubbles:true}));
      form.dispatchEvent(new f.window.Event('submit',{bubbles:true,cancelable:true}));
      for(let n=0;n<20;n++)await tick();
      assert.match(form.querySelector('[data-profile-status]').textContent,/сохранены/);
    }
    checkEntry(f.main);
    await save('Другой план на следующий урок.');
    assert.equal(f.main.querySelector('[data-attached-course]'),null);
    assert.equal(form.elements.course.selectedOptions[0].textContent,'7 класс');
    await save(focus);
    checkEntry(f.main);
    assert.equal(form.elements.course.selectedOptions[0].textContent,'Другие материалы: 7 класс');
    assert.equal(f.profile.course,'school');assert.equal(f.profile.version,3);
    assert.deepEqual(f.calls.filter(call=>call.method==='POST').map(call=>call.route),['/teacher/students/fixture-pupil/profile','/teacher/students/fixture-pupil/profile']);
  }finally{f.dom.window.close();}
});
