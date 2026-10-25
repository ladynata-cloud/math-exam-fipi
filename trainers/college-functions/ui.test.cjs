'use strict';
// These journeys drive the actual rendered form and events; no app mutations.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const Data=require('./data.js');
const Engine=require('./engine.js');
const STORE='mathExam.collegeFunctions.v1';
const source=Object.fromEntries(['data.js','engine.js','plot.js','app.js'].map(name=>[name,fs.readFileSync(path.join(__dirname,name),'utf8')]));
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');

function open(options={}) {
  const errors=[];
  const vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error));
  const dom=new JSDOM(html,{url:'https://mathexam.space/trainers/college-functions/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
  const w=dom.window;
  w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
  w.confirm=()=>true;
  if(options.saved!==undefined)w.localStorage.setItem(STORE,typeof options.saved==='string'?options.saved:JSON.stringify(options.saved));
  if(options.blockedStorage)Object.defineProperty(w,'localStorage',{get(){throw new w.DOMException('Blocked','SecurityError');}});
  for(const name of ['data.js','engine.js','plot.js','app.js'])w.eval(source[name]+'\n//# sourceURL='+name);
  const api={dom,w,doc:w.document,errors,find(selector){const el=w.document.querySelector(selector);assert.ok(el,'Missing '+selector);return el;},click(selector){api.find(selector).click();},fill(selector,value){const el=api.find(selector);el.value=String(value);el.dispatchEvent(new w.Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));return el;},state(){return w.CollegeFunctionsApp.snapshot();},saved(){return w.localStorage.getItem(STORE);},assertClean(){assert.deepEqual(errors.map(e=>e.message),[]);},close(){dom.window.close();}};
  return api;
}
function selectTask(ui,t){
  if(ui.state().taskId===t.id)return;
  ui.click('[data-family="'+t.family+'"]');
  ui.fill('#task-select',t.id);
  assert.equal(ui.state().taskId,t.id);
}
function submit(ui,answers){
  for(const [name,value]of Object.entries(answers))ui.fill('[data-answer="'+name+'"]',value);
  const prior=ui.state().attempt.stage;
  ui.click('#check-step');
  assert.equal(ui.state().attempt.stage,prior+1,ui.state().taskId+' stage '+prior+': '+ui.doc.querySelector('#feedback').textContent);
}
function complete(ui,t){
  while(ui.state().attempt.stage<8){
    const stage=ui.state().attempt.stage;
    if(stage===0)submit(ui,{domain:Engine.formatSet(t.domain)});
    if(stage===1)submit(ui,Object.fromEntries(t.points.map((p,i)=>['y'+i,Engine.formatNumber(p.y)])));
    if(stage===2){
      for(let i=ui.state().attempt.marked.length;i<t.points.length;i++){
        const p=t.points[i];ui.fill('#plot-x',Engine.formatNumber(p.x));ui.fill('#plot-y',Engine.formatNumber(p.y));ui.click('#place-point');
        assert.equal(ui.state().attempt.marked.length,i+1,t.id+' mark '+i);
      }
      assert.equal(ui.state().attempt.stage,3,t.id+' graph');
    }
    if(stage===3)submit(ui,{range:Engine.formatSet(t.range)});
    if(stage===4)submit(ui,{zeros:t.zeros.length?t.zeros.map(Engine.formatNumber).join('; '):'нет'});
    if(stage===5)submit(ui,{positive:Engine.formatSet(t.positive),negative:Engine.formatSet(t.negative)});
    if(stage===6)submit(ui,{up:Engine.formatIntervals(t.up),down:Engine.formatIntervals(t.down),constant:Engine.formatIntervals(t.constant||[])});
    if(stage===7)submit(ui,{parity:t.parity});
  }
  const result=ui.state().attempt;
  assert.equal(result.completed,true,t.id+' complete');
  assert.equal(result.accepted.length,8,t.id+' retained results');
  assert.equal(ui.doc.querySelectorAll('#history .done-step').length,8);
  assert.match(ui.find('#current-step').textContent,/График исследован/);
}

test('all 40 authored tasks complete through actual DOM inputs, points and eight retained stages',async t=>{
  const ui=open();
  try{
    for(const task of Data.tasks)await t.test(task.id+' '+task.formulaText,()=>{
      selectTask(ui,task);complete(ui,task);
      assert.equal(ui.state().attempt.errors,0);
      ui.assertClean();
    });
    assert.match(ui.find('#progress-detail').textContent,/40 завершённых работ/);
    assert.match(ui.find('#progress-count').textContent,/0 самостоятельно/);
  }finally{ui.close();}
});

test('fresh independent task counts once; repeated clicks and mode selection add no credit',()=>{
  const ui=open();try{
    ui.click('#test-mode');const t=Data.tasks.find(t=>t.id===ui.state().taskId);
    assert.notEqual(t.id,'B1');assert.equal(ui.state().mode,'test');assert.equal(ui.state().attempt.fresh,true);
    assert.equal(ui.doc.querySelector('#toggle-help'),null);
    complete(ui,t);assert.match(ui.find('#progress-count').textContent,/1 самостоятельно/);
    ui.click('#test-mode');assert.match(ui.find('#progress-count').textContent,/1 самостоятельно/);
    const saved=ui.saved();ui.fill('#task-select',t.id);assert.equal(ui.saved(),saved);
    ui.click('#repeat-task');assert.equal(ui.state().attempt.fresh,false);complete(ui,t);
    assert.match(ui.find('#current-step').textContent,/Повторная проверка/);
    assert.match(ui.find('#progress-count').textContent,/1 самостоятельно/);
    ui.assertClean();
  }finally{ui.close();}
});

test('a wrong answer is retained for correction and excludes first-try independent credit',()=>{
  const ui=open();try{
    ui.click('#test-mode');const t=Data.tasks.find(t=>t.id===ui.state().taskId);
    ui.fill('[data-answer="domain"]','R');ui.click('#check-step');
    assert.equal(ui.state().attempt.stage,0);assert.equal(ui.state().attempt.errors,1);
    assert.equal(ui.find('[data-answer="domain"]').value,'R');
    complete(ui,t);assert.match(ui.find('#progress-count').textContent,/0 самостоятельно/);
    assert.match(ui.find('#current-step').textContent,/исправили ошибки/);ui.assertClean();
  }finally{ui.close();}
});

test('hint open/close and deeper hint retain drafts and permanently record assistance',()=>{
  const ui=open();try{
    ui.fill('[data-answer="domain"]','[-2;');ui.click('#toggle-help');
    assert.equal(ui.state().attempt.helpUsed,true);assert.equal(ui.find('[data-answer="domain"]').value,'[-2;');
    ui.click('#more-help');assert.equal(ui.state().attempt.hintLevel,2);
    ui.click('#close-help');assert.equal(ui.state().attempt.hintOpen,false);
    assert.equal(ui.state().attempt.helpUsed,true);assert.equal(ui.find('[data-answer="domain"]').value,'[-2;');
    submit(ui,{domain:'[-2; +∞)'});
    assert.equal(ui.state().attempt.helpUsed,true);assert.equal(ui.state().attempt.hintLevel,0);
    assert.match(ui.find('#assistance').textContent,/подсказкой/);
    complete(ui,Data.tasks[0]);assert.match(ui.find('#current-step').textContent,/с подсказкой/);ui.assertClean();
  }finally{ui.close();}
});

test('reload restores partial table inputs, accepted steps, assistance and marked graph points',()=>{
  let ui=open();
  try{
    submit(ui,{domain:Engine.formatSet(Data.tasks[0].domain)});
    ui.fill('[data-answer="y0"]','0');ui.fill('[data-answer="y1"]','1');ui.click('#toggle-help');
    const saved=ui.saved();ui.close();ui=open({saved});
    assert.equal(ui.state().attempt.stage,1);assert.equal(ui.find('[data-answer="y0"]').value,'0');assert.equal(ui.find('[data-answer="y1"]').value,'1');
    assert.equal(ui.state().attempt.helpUsed,true);assert.equal(ui.doc.querySelectorAll('#history .done-step').length,1);
    submit(ui,Object.fromEntries(Data.tasks[0].points.map((p,i)=>['y'+i,Engine.formatNumber(p.y)])));
    const p=Data.tasks[0].points[0];ui.fill('#plot-x',p.x);ui.fill('#plot-y',p.y);ui.click('#place-point');
    const next=Data.tasks[0].points[1];ui.fill('#plot-x',Engine.formatNumber(next.x));
    const plotted=ui.saved();ui.close();ui=open({saved:plotted});
    assert.equal(ui.state().attempt.stage,2);assert.deepEqual(Array.from(ui.state().attempt.marked),[0]);
    assert.equal(ui.find('#plot-x').value,Engine.formatNumber(next.x),'Unsubmitted coordinate survives reload');
    complete(ui,Data.tasks[0]);ui.assertClean();
  }finally{ui.close();}
});

test('studying a fresh test task with help prevents later independent credit for that same task',()=>{
  const ui=open();try{
    ui.click('#test-mode');const t=Data.tasks.find(t=>t.id===ui.state().taskId);
    assert.equal(ui.state().attempt.fresh,true);
    ui.click('#learn-mode');ui.click('#toggle-help');ui.click('#more-help');
    ui.click('#test-mode');ui.fill('#task-select',t.id);
    complete(ui,t);
    assert.match(ui.find('#progress-count').textContent,/0 самостоятельно/);
    ui.assertClean();
  }finally{ui.close();}
});

test('symbol insertion changes only the selected range and persists the current draft',()=>{
  const ui=open();try{
    const input=ui.fill('[data-answer="domain"]','[-2; )');input.focus();input.setSelectionRange(5,5);
    ui.click('[data-symbol="∞"]');assert.equal(input.value,'[-2; ∞)');
    assert.equal(ui.state().attempt.drafts.domain,'[-2; ∞)');
    input.setSelectionRange(1,3);ui.click('[data-symbol="−"]');
    assert.equal(input.value,'[−; ∞)');assert.equal(ui.state().attempt.stage,0);ui.assertClean();
  }finally{ui.close();}
});

test('invalid JSON, malformed attempt and denied storage leave a working trainer',()=>{
  const samples=[{saved:'not JSON'}, {saved:{attempts:{'learn:B1':{stage:99,drafts:{}}},seen:{},last:{id:'B1',mode:'learn'}}}, {saved:{attempts:'bad',seen:'bad'}}, {blockedStorage:true}];
  for(const options of samples){const ui=open(options);try{
    assert.equal(ui.state().attempt.stage,0);submit(ui,{domain:'[-2; +∞)'});assert.equal(ui.state().attempt.stage,1);ui.assertClean();
    if(options.blockedStorage)assert.match(ui.find('#mode-note').textContent,/не разрешил сохранение/);
  }finally{ui.close();}}
});

test('diagnostic runs all eight questions, recommends missed topic and preserves active task',()=>{
  const ui=open();try{
    ui.fill('[data-answer="domain"]','[-2;');ui.click('#diagnose');
    assert.ok(ui.find('#diagnostic-dialog').hasAttribute('open'));
    for(let i=0;i<Data.diagnostics.length;i++){
      const q=Data.diagnostics[i];const answer=i===1?String((q.correct+1)%q.options.length):q.correctId;
      const buttons=ui.doc.querySelectorAll('[data-diag]');assert.equal(buttons.length,3);
      for(const button of buttons)assert.ok(button.textContent.length>0);
      ui.click('[data-diag="'+answer+'"]');
    }
    assert.match(ui.find('#diagnostic-body').textContent,/7 \/ 8/);
    assert.match(ui.find('#diagnostic-body').textContent,/Логарифм/);
    assert.equal(ui.state().attempt.drafts.domain,'[-2;');
    ui.click('#restart-diagnostic');assert.match(ui.find('#diagnostic-body').textContent,/Вопрос 1 из 8/);
    ui.click('#close-diagnostic');assert.equal(ui.find('[data-answer="domain"]').value,'[-2;');ui.assertClean();
  }finally{ui.close();}
});

test('diagnostic perfect result and recommended practice navigation work',()=>{
  const ui=open();try{
    ui.click('#diagnose');for(const q of Data.diagnostics)ui.click('[data-diag="'+q.correctId+'"]');
    assert.match(ui.find('#diagnostic-body').textContent,/8 \/ 8/);
    assert.match(ui.find('#diagnostic-body').textContent,/Основные правила знакомы/);
    ui.click('#start-recommended');assert.equal(ui.find('#diagnostic-dialog').hasAttribute('open'),false);
    assert.equal(ui.state().mode,'learn');ui.assertClean();
  }finally{ui.close();}
});
