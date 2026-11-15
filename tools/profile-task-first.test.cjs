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

function helpFixture(taskId,mode){
  const {JSDOM}=require('jsdom'),path=require('node:path');
  const State=require('../ege-profil/start/state.js'),root=path.resolve(__dirname,'..'),start=path.join(root,'ege-profil/start');
  const lesson=lessons.find(l=>l.tasks.some(t=>t.id===taskId)),task=lesson.tasks.find(t=>t.id===taskId);
  const dom=new JSDOM(fs.readFileSync(path.join(start,'index.html'),'utf8'),{url:'https://mathexam.space/ege-profil/start/#practice/'+lesson.id+'/'+mode,runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
  // Resume a valid saved task in each supported mode, independent of its pool order.
  const state=State.create(lessons,w.localStorage,{publicAttempts:true}),session=state.start(lesson.id,mode);
  session.taskId=taskId;session.submissions.taskId=taskId;state.persist();
  try{
    for(const script of w.document.querySelectorAll('script[src]'))w.eval(fs.readFileSync(resolvePublicScript(root,start,script.getAttribute('src')),'utf8'));
  }catch(error){w.close();throw error;}
  const snapshot=()=>JSON.parse(w.localStorage.getItem(State.KEY));
  const current=()=>snapshot().sessions[lesson.id+':'+mode];
  const draft=value=>{const input=w.document.querySelector('#answer');input.value=value;input.dispatchEvent(new w.Event('input',{bubbles:true}));};
  const submit=value=>{draft(value);w.document.querySelector('#answer-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));};
  return {w,task,lesson,snapshot,current,draft,submit};
}
function retainedAttempt(session){
  const {taskId,started,step,draft,answers,done,wrong}=session;
  return JSON.stringify({taskId,started,step,draft,answers,done,wrong,submissions:session.submissions?.steps});
}
const contextualHelpCases=[
  ['expr-powers-4',[/умнож|перемнож/iu,/слож|склады/iu,/числител/iu,/дел/iu,/выч/iu,/знаменател/iu]],
  ['eq-rational-4',[/Знаменатель\s+3x\s*[−-]\s*4\s+не должен равняться нулю/iu,/исключить/iu,/3x\s*[−-]\s*4\s*=\s*0/u]],
  ['expr-fractions-4',[/Знаменатель\s+x\s*\+\s*6\s+не должен равняться нулю/iu,/запрещено/iu,/x\s*\+\s*6\s*=\s*0/u]],
  ['eq-root-4',[/Для корня нужно\s+4x\s*[−-]\s*7\s*≥\s*0/iu,/При каком x.*равно нулю/iu]],
  ['calc-extreme-5',[/f′\(x\)\s*=\s*2\(x\s*[−-]\s*4\)/u,/производная равна нулю/iu]]
];
for(const mode of ['independent','plan'])for(const [taskId,meaning] of contextualHelpCases){
  test('Contextual help keeps the mathematical operation in '+mode+': '+taskId,()=>{
    const f=helpFixture(taskId,mode),d=f.w.document;
    try{
      f.draft('1/7');const before=retainedAttempt(f.current());
      d.querySelector('#hint').click();assert.equal(d.querySelector('#hint-box').hidden,false);
      const text=d.querySelector('.short-hint').textContent.replace(/\s+/gu,' ').trim();
      for(const required of meaning)assert.match(text,required,taskId+': visible help retains the mathematical context');
      assert.equal(retainedAttempt(f.current()),before);assert.equal(f.current().assisted,true);
      d.querySelector('#hint').click();d.querySelector('#hint').click();
      assert.equal(d.querySelector('#answer').value,'1/7');assert.equal(retainedAttempt(f.current()),before);
      f.submit(String(f.task.answer));assert.match(d.querySelector('#feedback').textContent,/^Верно\./u);
      d.querySelector('#next').click();assert.equal(f.current().done,true);assert.equal(f.current().wrong,false);
      assert.deepEqual(f.snapshot().records[f.lesson.id].independent,[],taskId+': using help cannot earn an independent success');
    }finally{f.w.close();}
  });
}
test('Guided powers help follows the current operation and preserves the earlier answer and draft',()=>{
  const f=helpFixture('expr-powers-4','guided'),d=f.w.document;
  try{
    d.querySelector('#hint').click();assert.match(d.querySelector('.short-hint').textContent,/При умножении/iu);
    f.submit('5');assert.match(d.querySelector('#feedback').textContent,/^Верно\./u);d.querySelector('#next').click();
    assert.equal(f.current().step,1);assert.deepEqual(f.current().answers,['5']);
    f.draft('2');const before=retainedAttempt(f.current());d.querySelector('#hint').click();
    const text=d.querySelector('.short-hint').textContent;
    assert.match(text,/При делении.*показатели вычитаются/iu);assert.doesNotMatch(text,/складыва|сложи/iu);
    assert.equal(retainedAttempt(f.current()),before);assert.equal(d.querySelector('#answer').value,'2');
    assert.equal(d.querySelectorAll('#solution-history [data-step]').length,1);
    assert.deepEqual(f.current().answers,['5']);assert.equal(f.current().assisted,true);
  }finally{f.w.close();}
});
