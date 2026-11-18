'use strict';
const {resolvePublicScript} = require('./public-page-script.cjs');
const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const {question}=require('../ege-profil/start/task-first.js');
const lessons=['geometry','algebra','stereo','probability','equations','functions','applied', 'finance','readiness'].flatMap(n=>require('../ege-profil/start/'+n+'-data.js'));
test('Every existing task names the sought value from its own condition, never an intermediate answer',()=>{
  assert.equal(lessons.length,81);assert.equal(lessons.flatMap(l=>l.tasks).length,486);
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

for(const offline of [false,true])test(`Optional opposite-vector check ${offline?'in the standalone download':'online'} gives feedback after a choice and preserves an unfinished attempt`,()=>{
  const {JSDOM}=require('jsdom'),path=require('node:path');
  const start=path.resolve('ege-profil/start');
  const source=offline?'downloads/trainers/ege-profil-start/ege-profil-start.html':path.join(start,'index.html');
  const dom=new JSDOM(fs.readFileSync(source,'utf8'),{url:'https://mathexam.space/ege-profil/start/#lesson/vec-basics-equality',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
  const api=require('../ege-profil/start/state.js'),vectors=require('../ege-profil/start/vector-basics-data.js');
  const values=new Map(),storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
  const saved=api.create(vectors,storage);const attempt=saved.start('vec-basics-equality','guided');
  attempt.draft='BA';saved.persist();
  for(const [key,value] of values)w.localStorage.setItem(key,value);
  try{
    if(offline){
      assert.equal(w.document.querySelectorAll('script[src]').length,0,'No remote scripts in the standalone download');
      for(const name of ['app','vector-basics-data','geometry-data','stereo-data']){
        const embedded=w.document.querySelector(`script[data-inline-source="/ege-profil/start/${name}.js"]`);
        assert(embedded);assert.equal(embedded.textContent.trim(),fs.readFileSync(path.join(start,name+'.js'),'utf8').replace(/<\/script/gi,'<\\/script').trim(),'The actual combined source is embedded: '+name);
      }
    }
    for(const script of w.document.scripts){
      if(script.type&&script.type!=='text/javascript')continue;
      w.eval(script.src?fs.readFileSync(resolvePublicScript(path.resolve(__dirname,'..'),start,script.getAttribute('src')),'utf8'):script.textContent);
    }
    const d=w.document,box=d.querySelector('#opposite-vector-check');assert(box);assert.equal(box.open,false);
    const snapshot=()=>JSON.stringify(Object.entries(w.localStorage).sort());const before=snapshot();
    const feedback=box.querySelector('[data-opposite-direction-feedback]'),length=box.querySelector('[data-opposite-length-step]');
    assert.equal(feedback.textContent,'');assert(length.hidden);assert(box.querySelector('[data-opposite-hint-text]').hidden);
    box.open=true;box.querySelector('[data-opposite-direction="AB"]').click();assert.match(feedback.textContent,/Попробуй ещё раз/);assert(length.hidden);
    const hint=box.querySelector('[data-opposite-hint]');hint.click();assert.equal(hint.getAttribute('aria-expanded'),'true');assert(!box.querySelector('[data-opposite-hint-text]').hidden);hint.click();assert.equal(hint.getAttribute('aria-expanded'),'false');
    box.querySelector('[data-opposite-direction="BA"]').click();assert.match(feedback.textContent,/Верно: BA/);assert(!length.hidden);
    const lengthFeedback=box.querySelector('[data-opposite-length-feedback]');assert.equal(lengthFeedback.textContent,'');
    box.querySelector('[data-opposite-length="longer"]').click();assert.match(lengthFeedback.textContent,/попробуй ещё раз/);
    box.querySelector('[data-opposite-length="same"]').click();assert.match(lengthFeedback.textContent,/длина сохранилась/);
    assert.equal(snapshot(),before,'Optional practice never writes task answers, progress or help flags');
    assert.equal(JSON.parse(w.localStorage.getItem('mathexam.profileStart2027.v1')).sessions['vec-basics-equality:guided'].draft,'BA');
    assert.equal(vectors.flatMap(l=>l.tasks).length,54);
  }finally{w.close();}
});

test('All 68 lesson families keep the real task, answer, diagram and nested help mounted across collapse',()=>{
  const {JSDOM}=require('jsdom'),path=require('node:path');
  const start=path.resolve('ege-profil/start');
  const html=fs.readFileSync(path.join(start,'index.html'),'utf8');
  for(const lesson of lessons){
    const dom=new JSDOM(html,{url:'https://mathexam.space/ege-profil/start/#practice/'+lesson.id+'/independent',runScripts:'outside-only',pretendToBeVisual:true});
    const w=dom.window;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
    try{
      for(const script of w.document.querySelectorAll('script[src]'))w.eval(fs.readFileSync(resolvePublicScript(path.resolve(__dirname, '..'), start, script.getAttribute('src')),'utf8'));
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
