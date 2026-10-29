'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const ROOT = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(ROOT, name), 'utf8');
function fixture(html='<body></body>', url='https://course.example/') {
  const dom = new JSDOM(html, { url, runScripts:'outside-only', pretendToBeVisual:true });
  dom.window.scrollTo=()=>{};
  dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
  dom.window.eval(read('trainers/peterson-assistant.js'));
  return dom;
}
function course(name, hash) {
  const file=name==='peterson'?'school/peterson6/index.html':'trainers/maxim-peterson6/index.html';
  const dom=fixture(read(file),'https://course.example/'+path.dirname(file)+'/'+hash),w=dom.window;
  if(name==='peterson')for(const part of ['math.js','models.js','data.js','app.js'])w.eval(read('school/peterson6/'+part));
  else w.eval([...read(file).matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].find(match=>!/\bsrc=/.test(match[1]))[2]);
  return dom;
}
function task(id='one') { return {id,title:'Тест',condition:'<img src=x onerror=alert(1)> {{frac:1:2}}',stepIndex:0,
  steps:[{title:'Сложи',hint:'Первый совет',explanation:'Первое объяснение',answer:'2'},
    {title:'Умножь',hint:'Второй совет',explanation:'Второе объяснение',answer:'4'}],onHelp:()=>true}; }
const click=(w,selector)=>{const element=w.document.querySelector(selector);assert(element,selector);element.click();return element;};
test('closed initially, source text is safe, Escape and close restore launcher focus',()=>{
  const dom=fixture(),w=dom.window;
  try{
    w.PetersonTaskHelp.mount({getTask:()=>task()});
    assert.equal(w.document.querySelector('.peterson-help-panel').hidden,true);
    click(w,'.peterson-help-launcher');
    assert.equal(w.document.activeElement.className,'peterson-help-close');
    assert.equal(w.document.querySelector('.peterson-help-condition img'),null);
    assert.equal(w.document.querySelector('.peterson-help-fraction').textContent,'12');
    w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
    assert.equal(w.document.querySelector('.peterson-help-panel').hidden,true);
    assert.equal(w.document.activeElement.className,'peterson-help-launcher');
    click(w,'.peterson-help-launcher');click(w,'.peterson-help-close');
    assert.equal(w.document.activeElement.className,'peterson-help-launcher');
  }finally{w.close();}
});
test('assistance precedes source disclosure and prior hints remain until task changes',()=>{
  const dom=fixture(),w=dom.window;let current=task(),before=[];
  try{
    current.onHelp=()=>{before.push(w.document.querySelectorAll('.peterson-help-answer').length);return true;};
    const help=w.PetersonTaskHelp.mount({getTask:()=>current});click(w,'.peterson-help-launcher');
    click(w,'[data-peterson-help=hint]');current.stepIndex=1;help.sync();click(w,'[data-peterson-help=hint]');
    assert.deepEqual(before,[0,1]);
    assert.equal(w.document.querySelectorAll('.peterson-help-answer').length,2);
    assert.match(w.document.querySelector('.peterson-help-log').textContent,/Первый совет[\s\S]*Второй совет/);
    click(w,'[data-peterson-help=hint]');assert.equal(before.length,2);
    current=task('two');help.sync();assert.equal(w.document.querySelectorAll('.peterson-help-answer').length,0);
  }finally{w.close();}
});
test('revoked or rejected task marking cannot show an answer; unavailable task clears transcript',()=>{
  const dom=fixture(),w=dom.window;let current=task();
  try{
    const help=w.PetersonTaskHelp.mount({getTask:()=>current});
    current.onHelp=()=>false;click(w,'[data-peterson-help=hint]');
    assert.equal(w.document.querySelectorAll('.peterson-help-answer').length,0);
    current.onHelp=()=>{current=task('changed');return true;};click(w,'[data-peterson-help=full]');
    assert.equal(w.document.querySelectorAll('.peterson-help-answer').length,0);
    click(w,'[data-peterson-help=hint]');assert.equal(w.document.querySelectorAll('.peterson-help-answer').length,1);
    current=null;help.sync();assert.equal(w.document.querySelectorAll('.peterson-help-answer').length,0);
    assert(w.document.querySelector('[data-peterson-help=hint]').disabled);
  }finally{w.close();}
});
test('empty step list falls back to authored task hint and explanation without inventing content',()=>{
  const dom=fixture(),w=dom.window;const current={...task(),steps:[],hint:'Подсказка задачи',explanation:'Разбор задачи'};
  try{
    w.PetersonTaskHelp.mount({getTask:()=>current});click(w,'[data-peterson-help=hint]');click(w,'[data-peterson-help=full]');
    const log=w.document.querySelector('.peterson-help-log').textContent;
    assert.match(log,/Подсказка задачи/);assert.match(log,/Разбор задачи/);assert.doesNotMatch(log,/undefined|NaN/);
  }finally{w.close();}
});
for(const name of ['peterson','maxim'])test(name+' real runtime retains draft, stores assistance and clears new-task help',()=>{
  const dom=course(name,name==='peterson'?'#practice/decimal-add/1':'#river-units'),w=dom.window,isPeterson=name==='peterson';
  try{
    const input=w.document.querySelector(isPeterson?'#final-answer':'#answer-input');input.value='12,345';input.dispatchEvent(new w.Event('input',{bubbles:true}));
    click(w,'.peterson-help-launcher');click(w,'[data-peterson-help=hint]');click(w,'[data-peterson-help=simpler]');click(w,'[data-peterson-help=full]');
    assert.equal(w.document.querySelector(isPeterson?'#final-answer':'#answer-input').value,'12,345');
    assert.equal(w.document.querySelectorAll('.peterson-help-answer').length,3);
    if(isPeterson)assert(Object.values(w.PetersonApp.getState().tasks).some(value=>value.assisted));
    else assert(JSON.parse(w.localStorage.getItem(w.TrainerCore.storageKey)).metrics['river-units'].hints>0);
    click(w,isPeterson?'[data-action=new]':'#another');
    assert.equal(w.document.querySelectorAll('.peterson-help-answer').length,0);
  }finally{w.close();}
});
test('Peterson completed independent result stays unchanged when reviewing help',()=>{
  const dom=course('peterson','#practice/decimal-add/1'),w=dom.window;
  try{
    const source=w.PetersonMath.generate('decimal-add',1,1),input=w.document.querySelector('#final-answer');
    input.value=String(source.answer);input.dispatchEvent(new w.Event('input',{bubbles:true}));
    w.document.querySelector('#answer-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
    const before=JSON.stringify(w.PetersonApp.getState());
    assert(Object.values(w.PetersonApp.getState().tasks).some(value=>value.correct&&value.independent));
    click(w,'.peterson-help-launcher');click(w,'[data-peterson-help=full]');
    assert.equal(JSON.stringify(w.PetersonApp.getState()),before);
  }finally{w.close();}
});
test('helper has no transport or separate progress and board guard outranks cabinet opt-in',()=>{
  const helper=read('trainers/peterson-assistant.js');
  assert.doesNotMatch(helper,/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(|\.\s*(?:sendBeacon|postMessage)\s*\(|localStorage|sessionStorage/);
  const app=read('school/peterson6/app.js');
  assert.match(app,/taskHelp=!boardSession&&\(window\.self===window\.top\|\|new URLSearchParams\(location\.search\)\.get\('cabinet'\)==='peterson-helper'\)/);
  assert.match(read('trainers/maxim-peterson6/index.html'),/window\.self===window\.top\|\|new URLSearchParams\(location\.search\)\.get\('cabinet'\)==='peterson-helper'/);
});
