'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const {question}=require('../ege-profil/start/task-first.js');
const lessons=['geometry','algebra','stereo','probability','equations','functions','applied','readiness'].flatMap(n=>require('../ege-profil/start/'+n+'-data.js'));
test('Every existing task names the sought value from its own condition, never an intermediate answer',()=>{
  assert.equal(lessons.length,68);assert.equal(lessons.flatMap(l=>l.tasks).length,408);
  for(const l of lessons)for(const task of l.tasks){
    const text=question(task);
    assert(text.trim(),l.id+': nonempty authored instruction');
    assert(!text.includes('<svg')&&!text.includes('<figure'),task.id+': drawings not duplicated in input label');
    assert(task.prompt.includes(text),task.id+': exact authored question remains authoritative');
    assert(!/^Найдите ответ\.?$/.test(text),task.id+': no generic instruction');
  }
  const get=id=>lessons.find(l=>l.id===id).tasks[0];
  assert.equal(question(get('geo-right')),'Найди гипотенузу.');
  assert.match(question(get('eq-quadratic')),/больший корень/);
  assert.match(question(get('stereo-cylinder')),/делённый на π/);
  assert.match(question(get('applied-motion')),/более быстрого.*км\/ч/);
  assert.match(question(get('trig-angle')),/только число k/);
  assert(!question(get('geo-right')).includes('225'),'No answer-bearing intermediate step used as instruction');
});
test('HTML loads the presentation helper before the learner engine',()=>{
  const html=fs.readFileSync('ege-profil/start/index.html','utf8');
  assert(html.indexOf('task-first.js')<html.indexOf('src="app.js'));
  assert.match(html,/ЕГЭ профиль 2027/);
});

test('All 68 lesson families keep the real task, answer, diagram and nested help mounted across collapse',()=>{
  const {JSDOM}=require('jsdom'),path=require('node:path');
  const repo=path.resolve(__dirname,'..'),start=path.join(repo,'ege-profil/start');
  const html=fs.readFileSync(path.join(start,'index.html'),'utf8');
  for(const lesson of lessons){
    const dom=new JSDOM(html,{url:'https://mathexam.space/ege-profil/start/#practice/'+lesson.id+'/independent',runScripts:'outside-only',pretendToBeVisual:true});
    const w=dom.window;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
    try{
      for(const script of w.document.querySelectorAll('script[src]')){
        const url=new URL(script.getAttribute('src'),w.location.href);
        assert.equal(url.origin,w.location.origin,'Declared scripts must be same-origin site resources');
        const pathname=decodeURIComponent(url.pathname);
        assert(!/[\\\0]/.test(pathname),'Invalid local script path');
        const filename=path.resolve(repo,'.'+pathname);
        assert(filename.startsWith(repo+path.sep),'Declared scripts must stay inside the site');
        assert(fs.existsSync(filename),'Every declared script exists: '+script.getAttribute('src'));
        w.eval(fs.readFileSync(filename,'utf8'));
      }
      const d=w.document,input=d.querySelector('#answer'),hint=d.querySelector('#hint'),box=d.querySelector('#hint-box'),model=d.querySelector('#task-model');
      assert(input&&hint&&box,lesson.id+': task is ready');assert.equal(box.hidden,true);
      const read=()=>JSON.parse(w.localStorage.getItem('mathexam.profileStart2027.v1')).sessions[lesson.id+':independent'];
      const retain=s=>JSON.stringify({taskId:s.taskId,started:s.started,step:s.step,draft:s.draft,answers:s.answers,done:s.done,wrong:s.wrong});
      input.value='1/7';input.dispatchEvent(new w.Event('input',{bubbles:true}));const before=retain(read());
      const condition=d.querySelector('.condition-panel .task-condition').innerHTML;
      hint.click();assert.equal(box.hidden,false);assert.equal(hint.getAttribute('aria-expanded'),'true');assert.equal(read().assisted,true);
      const detailed=d.querySelector('#task-solution [data-solution-open]');let count=0;
      if(detailed){detailed.click();d.querySelector('#task-solution [data-solution-next]').click();count=d.querySelectorAll('#task-solution [data-solution-step]').length;assert.equal(count,2);}
      box.querySelector('.task-foundation>summary').click();assert.equal(box.querySelector('.task-foundation').open,true);
      hint.click();assert.equal(box.hidden,true);assert.equal(hint.textContent,'Хочешь подсказку?');
      assert.equal(d.querySelector('#answer'),input);assert.equal(d.querySelector('#task-model'),model);assert.equal(input.value,'1/7');assert.equal(retain(read()),before);
      assert.equal(d.querySelector('.condition-panel .task-condition').innerHTML,condition);assert.equal(read().assisted,true);
      hint.click();assert.equal(box.querySelector('.task-foundation').open,true);assert.equal(d.querySelectorAll('#task-solution [data-solution-step]').length,count);
    }finally{w.close();}
  }
});
