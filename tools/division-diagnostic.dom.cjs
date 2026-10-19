'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {test} = require('node:test');
const {JSDOM} = require('jsdom');
const root = path.resolve(__dirname,'..');
const dir = 'trainers/oge-basics/multiplication-division/';
const C = require('../'+dir+'division-diagnostic-core.js');
const KEY = 'mathExam.divisionDiagnostic.tab.v1';
function mount(saved, suffix = '', blocked = false) {
  const dom = new JSDOM(fs.readFileSync(path.join(root,dir,'division-diagnostic.html'),'utf8'), {url:'https://mathexam.space/'+dir+'division-diagnostic.html'+suffix,runScripts:'outside-only'});
  const w=dom.window;
  if(saved!==undefined)w.sessionStorage.setItem(KEY,saved);
  if(blocked)Object.defineProperty(w,'sessionStorage',{get(){throw Error('blocked');}});
  w.localStorage.setItem('old-course-attempt','preserve');
  for(const file of ['division-lab-core.js','division-diagnostic-core.js','division-diagnostic.js'])w.eval(fs.readFileSync(path.join(root,dir,file),'utf8'));
  const host=w.document.getElementById('diagnostic');
  const click=action=>{const button=host.querySelector('[data-do="'+action+'"]');assert(button,action+' button exists');button.click();};
  const snapshot=()=>JSON.parse(w.sessionStorage.getItem(KEY));
  function answer(q,value=q.answer){
    if(q.kind==='selection')for(let n=0;n<Number(value);n++)click('more');
    else{const input=host.querySelector('#answer');assert(input);input.value=value;input.dispatchEvent(new w.Event('input',{bubbles:true}));}
    host.querySelector('#answer-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  }
  return {dom,w,host,click,answer,snapshot};
}
test('one answer per question; selection is deliberate; correction does not poison subsequent arithmetic',()=>{
  const f=mount(), model=C.build();f.click('start');
  assert.match(f.host.textContent,/Сколько первых цифр/);
  f.host.querySelector('#answer-form').dispatchEvent(new f.w.Event('submit',{bubbles:true,cancelable:true}));
  assert.equal(f.snapshot().records.length,0);assert.equal(f.host.querySelector('#input-error').hidden,false);
  f.click('more');f.click('more');f.click('less');
  assert.equal(f.snapshot().records.length,0,'Moving arrows is not an attempted answer');
  f.host.querySelector('#answer-form').dispatchEvent(new f.w.Event('submit',{bubbles:true,cancelable:true}));
  assert.equal(f.snapshot().records.length,1);f.click('next');
  f.answer(model.questions[1],'9');
  assert.equal(f.snapshot().records.at(-1).correct,false);
  assert.match(f.host.querySelector('.quotient').textContent,/2/,'Canonical digit replaces an incorrect answer');
  f.click('next');
  assert.match(f.host.querySelector('h1').textContent,/4 × 2/);
  f.answer(model.questions[2]);assert.equal(f.snapshot().records.at(-1).correct,true);
  assert.equal(f.w.localStorage.getItem('old-course-attempt'),'preserve');
  assert.equal(f.w.localStorage.length,1);f.dom.window.close();
});
test('complete two variants, keep notebook history, and show no future partial answer',()=>{
  const f=mount();
  for(let variant=0;variant<2;variant++){
    const model=C.build(variant);f.click('start');
    for(const q of model.questions){
      if(q.kind==='partial'){
        const paper=f.host.querySelector('.notebook');
        assert(paper);const rows=[...paper.querySelectorAll('.numrow')].map(r=>r.textContent.replace(/\s/g,''));
        assert(!rows.includes(q.answer),'Pending combined partial must not appear in the notebook');
      }
      f.answer(q);f.click('next');
    }
    assert.equal(f.snapshot().screen,'report');assert.equal(f.snapshot().records.length,18);
    assert.match(f.host.textContent,/Можно начать с самостоятельного деления/);
    assert.equal(f.host.querySelectorAll('.status.observed').length,8);
    assert.equal(f.host.querySelectorAll('details .notebook').length,2);
    if(variant===0)f.click('restart');
  }
  f.dom.window.close();
});
test('isolated subtraction trouble yields one targeted confirmation and a specific first route',()=>{
  const f=mount(),model=C.build();f.click('start');
  for(const q of model.questions){f.answer(q,q.skill==='subtract'?'99':q.answer);f.click('next');}
  assert.match(f.host.textContent,/Уточним трудный шаг/);
  f.answer(C.confirmation('subtract'),'99');f.click('next');
  assert.equal(f.snapshot().records.length,19);
  assert.match(f.host.querySelector('.start-here a').href,/arithmetic-foundations\.html#sub-borrow$/);
  assert.equal(f.host.querySelectorAll('.status.focus').length,1);
  assert.equal(f.host.querySelectorAll('.status.observed').length,7);
  assert.match(f.host.textContent,/Десятичные дроби.*ещё не проверялись/);f.dom.window.close();
});
test('all skips produce bounded confirmations and no invented successes',()=>{
  const f=mount();f.click('start');let count=0;
  while(f.snapshot().screen==='test'){
    assert(!f.host.querySelector('.notebook')?.textContent.includes('undefined'));
    f.click('skip');f.click('next');assert(++count<=26);
  }
  assert.equal(count,26);assert.equal(f.host.querySelectorAll('.status.observed').length,0);
  assert.equal(f.host.querySelectorAll('.status.focus').length,8);
  assert.equal(f.host.querySelectorAll('.recommendation').length,2);f.dom.window.close();
});
test('keyboard arrows keep focus at both selection bounds',()=>{
  const f=mount();f.click('start');
  const key=k=>f.w.document.activeElement.dispatchEvent(new f.w.KeyboardEvent('keydown',{key:k,bubbles:true,cancelable:true}));
  for(let i=0;i<3;i++)key('ArrowRight');assert.equal(f.snapshot().selection,3);
  assert(f.host.contains(f.w.document.activeElement));
  key('ArrowLeft');assert.equal(f.snapshot().selection,2);key('ArrowLeft');assert.equal(f.snapshot().selection,1);
  assert(f.host.contains(f.w.document.activeElement));key('ArrowRight');assert.equal(f.snapshot().selection,2);f.dom.window.close();
});
test('draft, accepted action and report survive reload; stored correctness is recomputed',()=>{
  let f=mount();f.click('start');f.answer(C.build().questions[0]);
  let saved=f.snapshot();saved.records[0].correct=false;f.dom.window.close();
  f=mount(JSON.stringify(saved));assert.equal(f.host.querySelector('.feedback').classList.contains('correct'),true);
  f.click('next');const input=f.host.querySelector('#answer');input.value='7';input.dispatchEvent(new f.w.Event('input',{bubbles:true}));saved=f.snapshot();f.dom.window.close();
  f=mount(JSON.stringify(saved));assert.equal(f.host.querySelector('#answer').value,'7');
  f.click('finish');assert.match(f.host.textContent,/промежуточный результат/);
  assert.equal(f.host.querySelectorAll('.status.untested').length,7);saved=f.snapshot();f.dom.window.close();
  f=mount(JSON.stringify(saved));assert.equal(f.host.querySelectorAll('.status.untested').length,7);f.click('resume');assert.match(f.host.querySelector('h1').textContent,/8 : 4/);f.dom.window.close();
});
test('storage failures and invalid records remain usable without touching managed progress',()=>{
  for(const saved of ['not json',JSON.stringify({version:1,variant:0,screen:'test',records:[{id:'<script>',value:'8',skipped:false}],accepted:false,draft:'',selection:0})]){
    const f=mount(saved);assert.match(f.host.textContent,/С чего мне начать/);assert.match(f.w.document.getElementById('save-note').textContent,/прочитать не удалось/);f.click('start');f.click('skip');f.click('next');assert(f.host.querySelector('h1'));assert.equal(f.w.localStorage.getItem('old-course-attempt'),'preserve');f.dom.window.close();
  }
  const f=mount(undefined,'',true);f.click('start');f.click('skip');f.click('next');assert(f.host.querySelector('h1'));f.dom.window.close();
});
test('cabinet return is fixed, links are safe, and new tests are wired into CI',()=>{
  const f=mount(undefined,'?from=cabinet');assert.equal(f.w.document.getElementById('course-return').href,'https://mathexam-board-ladynata.msk1.amvera.tech/learning/#division-course');f.click('start');f.click('skip');f.click('finish');
  for(const a of f.host.querySelectorAll('a[target="_blank"]')){assert(a.rel.includes('noopener'));assert(a.href.startsWith('https://mathexam.space/'));}
  const workflow=fs.readFileSync(path.join(root,'.github/workflows/learning-quality.yml'),'utf8');
  assert(workflow.includes('node tools/division-diagnostic.test.cjs'));assert(workflow.includes('node tools/division-diagnostic.dom.cjs'));
  f.dom.window.close();
});
