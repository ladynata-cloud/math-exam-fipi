'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const html=fs.readFileSync(path.join(__dirname,'../trainers/oge-task11-graphs-trainer.html'),'utf8');
const KEY='mathExamCourseProgress.v1';
function boot(options={}){
  const errors=[]; const console=new VirtualConsole();console.on('jsdomError',e=>errors.push(e.message));
  const dom=new JSDOM(html,{url:'https://example.test/trainers/oge-task11-graphs-trainer.html'+(options.query||''),runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:console,beforeParse(w){w.scrollTo=()=>{};if(options.storage)w.localStorage.setItem(KEY,JSON.stringify(options.storage));if(options.blocked)Object.defineProperty(w,'localStorage',{get(){throw Error('blocked');}});}});
  const {window:w}=dom;const el=id=>w.document.getElementById(id);
  return {dom,w,el,errors,run:s=>w.eval(s),saved:()=>JSON.parse(w.localStorage.getItem(KEY)||'{}'),answer(code){el('m4-answer').value=code;el('m4-answer').dispatchEvent(new w.Event('input',{bubbles:true}));el('m4-check').click();}};
}
function plain(v){return JSON.parse(JSON.stringify(v));}

test('first screen asks for a match; lab, solution and secondary modes are opt-in',()=>{
 const t=boot();try{
  assert.deepEqual(t.errors,[]);assert(t.el('m4').classList.contains('active'));assert(!t.el('m1').classList.contains('active'));
  assert.equal(t.el('m4-graphs').children.length,3);assert.equal(t.el('m4-desc').children.length,3);
  assert.equal(t.el('m4-hint').textContent,'Хочешь подсказку?');assert(t.el('m4-hintbox').hidden);assert(t.el('m4-show').hidden);
  assert(!t.el('task11-settings').open);assert(!t.el('task11-more').open);
  assert.equal(t.el('m4-good').textContent,'');assert.equal(t.el('m4-razbor').textContent,'');
  const families=t.run('Array.from({length:80},()=>{m4New();return M4.task.type})');assert(families.every(f=>f!=='t41'));
  t.run('M4.type="t41";m4New()');
  assert.equal(t.el('m4-taskline').innerHTML,t.run('M4.task.taskline'),'Coefficient questions retain their defining quadratic formula before help');
  assert(t.el('m4-taskline').querySelector('sup'),'The quadratic term is visible in the condition');
  assert(t.el('m4-hintbox').hidden);
 }finally{t.dom.window.close();}
});

test('help explores independently and preserves entered answer, task and stored progress',()=>{
 const before={'another-trainer':{v:1,solvedByType:{a:4}}};const t=boot({storage:before});try{
  t.el('m4-answer').value='123';t.el('m4-answer').dispatchEvent(new t.w.Event('input'));
  const key=plain(t.run('M4.task.key'));
  t.el('m4-hint').click();assert(!t.el('m4-hintbox').hidden);assert.equal(t.el('m4-hint').getAttribute('aria-expanded'),'true');
  for(const family of ['lin','par','hyp','root','constant']){
   t.el('m4-hintbox').querySelector('[data-family="'+family+'"]').click();
   const input=t.el('m4-hintbox').querySelector('input[type=range]');const old=t.el('lab-graph').innerHTML;
   input.value=input.max;input.dispatchEvent(new t.w.Event('input'));
   assert.notEqual(t.el('lab-graph').innerHTML,old,family+' responds');assert(t.el('lab-readout').textContent.length>30);
   assert.equal(t.el('m4-answer').value,'123');assert.deepEqual(plain(t.run('M4.task.key')),key);assert.deepEqual(t.saved(),before);
   assert(!t.el('m4-good').classList.contains('show'));assert(t.el('m4-show').hidden);
  }
  t.el('m4-hint').click();assert(t.el('m4-hintbox').hidden);
  t.el('m4-next').click();assert(t.el('m4-hintbox').hidden);assert.equal(t.el('m4-hint').textContent,'Хочешь подсказку?');assert.equal(t.el('m4-answer').value,'');
  assert.deepEqual(t.errors,[]);
 }finally{t.dom.window.close();}
});

test('a learner can correct an error with optional help; duplicate submissions cannot inflate progress',()=>{
 const t=boot();try{
  const key=plain(t.run('M4.task.key'));const type=t.run('M4.task.type');
  t.answer('111');assert.match(t.el('m4-soft').textContent,/один раз/);assert.equal(t.run('M4.attempts'),0);
  t.answer([key[1],key[0],key[2]].join(''));assert.match(t.el('m4-soft').textContent,/Верно 1 из 3/);assert(!t.el('m4-show').hidden);
  t.el('m4-check').click();assert.equal(t.run('M4.attempts'),1);
  t.el('m4-hint').click();t.answer(key.join(''));
  assert.equal(t.saved()['oge-t11-grafiki'].solvedByType[type],1);assert.match(t.el('m4-good').textContent,/Верно/);
  assert(t.el('m4-answer').disabled);t.el('m4-check').click();assert.equal(t.saved()['oge-t11-grafiki'].solvedByType[type],1);
  assert.deepEqual(t.errors,[]);
 }finally{t.dom.window.close();}
});

test('shown solution is never recorded as solved and does not leak the other two matches',()=>{
 const t=boot();try{
  const key=plain(t.run('M4.task.key'));t.answer([key[1],key[0],key[2]].join(''));t.el('m4-show').click();
  assert.match(t.el('m4-razbor').textContent,/А →/);assert.doesNotMatch(t.el('m4-razbor').textContent,/Б →|Ответ:/);
  t.answer(key.join(''));assert.deepEqual(t.saved()['oge-t11-grafiki'].solvedByType,{});
 }finally{t.dom.window.close();}
});

test('review still selects open types and three clean answers close the error',()=>{
 const t=boot({query:'?mode=review',storage:{mistakes:{'oge-t11-grafiki|t44':{w:1,r:0},'other|x':{w:1,r:0}}}});try{
  for(let i=0;i<3;i++){assert.equal(t.run('M4.task.type'),'t44');t.answer(t.run('M4.task.key.join("")'));t.el('m4-next').click();}
  assert.deepEqual(plain(t.run('CP.openTypes()')),[]);assert.deepEqual(t.saved().mistakes['other|x'],{w:1,r:0});
 }finally{t.dom.window.close();}
});

test('blocked storage does not prevent matching, lab or feedback',()=>{
 const t=boot({blocked:true});try{t.el('m4-hint').click();t.answer(t.run('M4.task.key.join("")'));assert.match(t.el('m4-good').textContent,/Верно/);assert.deepEqual(t.errors,[]);}finally{t.dom.window.close();}
});
