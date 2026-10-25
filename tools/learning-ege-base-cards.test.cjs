'use strict';

// Synthetic profiles only. Exercise the actual cabinet routing and read-only
// preview; no production pupil, authentication value or request is used here.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const ROOT = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(ROOT, name), 'utf8');
const attached = require('../learning/attached-course');
const catalog = require('../learning/catalog');
const ids = ['box', 'roundbody'];
const url = id => 'https://mathexam.space/ege-baza/path/index.html#lesson=' + id;
const focus = 'Задачи №11 и №13. Сначала попробуй самостоятельно.\n' + ids.map(url).join('\n');
const tick = () => new Promise(resolve => setImmediate(resolve));

test('only both exact lesson references in the base EGE direction select the two-card route', () => {
  for (const value of [focus, ids.map(id => '(' + url(id) + ').').join('\n'), focus + '\n' + url('box')]) {
    const profile = Object.freeze({course:'ege',focus:value});
    assert.equal(attached.selected(profile)?.id, 'ege-base-11-13');
    assert.equal(profile.focus, value);
  }
  const alter = [
    value => 'prefix' + value,
    value => 'https://elsewhere.example/?next=' + value,
    value => value + '&next=elsewhere',
    value => value + '/extra',
    value => value + '.evil',
    value => value.replace('https:', 'http:'),
    value => value.replace('mathexam.space', 'mathexam.space.evil.example'),
    value => value.replace('mathexam.space', 'mathexam.space@evil.example'),
    value => value.replace('/ege-baza/', '/%65ge-baza/'),
    value => value.replace('/ege-baza/', '/trainers/../ege-baza/'),
    value => value.replace('#lesson=', '?lesson='),
    value => value.replace('#lesson=', '#other=')
  ];
  for (const item of ids) {
    assert.equal(attached.selected({course:'ege',focus:url(item)}), null, 'one topic alone is not a two-topic route');
    for (const change of alter) {
      const value = ids.map(id => id === item ? change(url(id)) : url(id)).join('\n');
      assert.equal(attached.selected({course:'ege',focus:value}), null, value);
    }
  }
  for (const course of ['school','oge','foundations','ege-profile',undefined]) {
    assert.equal(attached.selected({course,focus}), null, 'other direction stays unchanged');
  }
  for (const value of ['',null,undefined,'ЕГЭ база №11 и №13']) {
    assert.equal(attached.selected({course:'ege',focus:value}), null);
  }
});

function checkCards(main, teacher = false) {
  const cards = [...main.querySelectorAll('[data-ege-base-position]')];
  assert.deepEqual(cards.map(card => card.dataset.egeBasePosition), ['11','13']);
  cards.forEach((card,index) => {
    assert.equal(card.querySelector('[data-attached-course-open]').href, url(ids[index]));
    const board = card.querySelector('[data-attached-course-board]');
    if (teacher) {
      const link = new URL(board.href);
      assert.equal(link.origin,'https://mathexam.space');
      assert.equal(link.pathname,'/trainers/trainer-board.html');
      assert.deepEqual([...link.searchParams],[['trainer','/ege-baza/path/index.html#lesson='+ids[index]]]);
    } else assert.equal(board,null,'pupil joins teacher room instead of creating another room');
    assert.equal(card.querySelector('button,form,[data-prep-start]'),null);
    for (const link of card.querySelectorAll('a')) {
      assert.equal(link.target,'_blank');
      assert.equal(link.rel,'noopener noreferrer');
    }
  });
  assert.equal(main.querySelector('[data-ege-base-full-course]').href,'https://mathexam.space/ege-baza/');
  assert.match(main.querySelector('[data-ege-base-room]').textContent,/ссылку.*комнаты/);
  assert.match(main.querySelector('[data-attached-course-storage]').textContent,/не записывается как самостоятельное решение/);
  assert.equal(main.querySelectorAll('img,script,[onerror]').length,0);
}

async function fixture({role='student',route='home',selected=true,allowSave=false}={}) {
  const dom = new JSDOM(read('learning/index.html'),{url:`https://cabinet.example/learning/?role=${role}#${route}`,runScripts:'outside-only'});
  const {window} = dom,calls=[];
  const profile = {course:'ege',goal:null,focus:selected?focus:'Повторить выбранную тему.',version:1};
  const pupil = {id:'fixture-pupil',role:'student',name:'Проверочный ученик',login:'fixture-pupil',profile};
  const teacher = {id:'fixture-teacher',role:'teacher',name:'Преподаватель',login:'fixture-teacher'};
  const own = {id:'fixture-work',learnerId:pupil.id,trainerId:'ege-path',contentId:'triangle',title:'Сохранённая работа',outcome:'started',updatedAt:'2026-01-01T00:00:00Z'};
  const attempts=[own,{...own,id:'peer-work',learnerId:'fixture-peer'}];
  window.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
  window.LearningCatalog=catalog;
  window.LearningRoute={mount(host){host.innerHTML='<h1 data-original-route>Прежний маршрут</h1>';return()=>{};}};
  window.MathExamWelcome={maybeOpen(){},cleanup(){}};
  window.fetch=async(target,options={})=>{
    const request=String(target).replace('/api/learning','');
    calls.push({request,method:options.method||'GET'});
    if(options.method==='POST'){
      assert(allowSave&&request==='/teacher/students/fixture-pupil/profile','Unexpected write');
      const body=JSON.parse(options.body);
      assert.equal(body.expectedVersion,profile.version);
      assert.equal(body.course,'ege');assert.equal(body.goal,null);
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
  for(const file of ['attached-course','vilenkin6-course','preparation','teaching','app']) window.eval(read('learning/'+file+'.js'));
  for(let i=0;i<25;i++)await tick();
  return {dom,window,main:window.document.getElementById('main'),calls,profile,attempts};
}

test('actual pupil home, course and route use latest course URLs and retain prior personal work',async()=>{
  for(const route of ['home','course','route']){
    const f=await fixture({route});
    try{
      checkCards(f.main);
      assert.equal(f.main.querySelector('h1').textContent,'ЕГЭ база · №11 и №13');
      assert(f.main.querySelector('[data-attached-prior-work] a[href="#attempt=fixture-work"]'));
      assert.equal(f.main.querySelector('a[href="#attempt=peer-work"]'),null);
      assert(f.calls.every(call=>call.method==='GET'));
      assert.equal(f.profile.focus,focus);assert.equal(f.profile.version,1);
      assert.equal(f.attempts.length,2);assert.equal(catalog.items.length,378);
    }finally{f.dom.window.close();}
  }
});

test('teacher roster, preview and profile card display the correct course without starting attempts',async()=>{
  for(const route of ['students','preview=fixture-pupil','student=fixture-pupil']){
    const f=await fixture({role:'teacher',route});
    try{
      assert(f.main.textContent.includes('ЕГЭ база · №11 и №13'));
      if(route==='students')assert.equal(f.main.querySelector('.student-goal').textContent,'ЕГЭ база · №11 и №13');
      else checkCards(f.main,route.startsWith('student='));
      assert(f.calls.every(call=>call.method==='GET'));
      assert.equal(f.profile.focus,focus);assert.equal(f.profile.version,1);
    }finally{f.dom.window.close();}
  }
});

test('removing either reference restores ordinary route; saving the pair refreshes the teacher card',async()=>{
  const f=await fixture({role:'teacher',route:'student=fixture-pupil',allowSave:true});
  try{
    const form=f.main.querySelector('#teaching-profile');
    async function save(value){
      form.elements.focus.value=value;
      form.elements.focus.dispatchEvent(new f.window.Event('input',{bubbles:true}));
      form.dispatchEvent(new f.window.Event('submit',{bubbles:true,cancelable:true}));
      for(let i=0;i<20;i++)await tick();
      assert.match(form.querySelector('[data-profile-status]').textContent,/сохранены/);
    }
    checkCards(f.main,true);
    await save(url('box'));
    assert.equal(f.main.querySelector('[data-attached-course]'),null);
    await save(focus+'\n<img src=x onerror=alert(1)>');
    checkCards(f.main,true);
    assert.equal(form.elements.course.value,'ege');
    assert.equal(f.profile.version,3);
    assert.equal(f.attempts.length,2);
    assert.deepEqual(f.calls.filter(call=>call.method==='POST').map(call=>call.request),[
      '/teacher/students/fixture-pupil/profile','/teacher/students/fixture-pupil/profile'
    ]);
  }finally{f.dom.window.close();}
});
