'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const html=fs.readFileSync(process.env.TASK11_DISCOVERY_HTML||path.join(__dirname,'../trainers/oge-task11-graphs-trainer.html'),'utf8');
const KEY='mathExamCourseProgress.v1';
const SEEN='mathexam.task11.discoverySeen.v1';
const plain=value=>JSON.parse(JSON.stringify(value));
function boot(options={}){
 const errors=[],console=new VirtualConsole();console.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(html,{url:'https://example.test/trainers/oge-task11-graphs-trainer.html'+(options.query||''),runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:console,beforeParse(w){
  w.scrollTo=()=>{};let seed=20261020;w.Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  if(options.seen)w.localStorage.setItem(SEEN,'1');if(options.storage)w.localStorage.setItem(KEY,JSON.stringify(options.storage));
  if(options.blocked)Object.defineProperty(w,'localStorage',{get(){throw Error('blocked');}});
 }});
 const w=dom.window,el=id=>w.document.getElementById(id);
 return {dom,w,el,errors,run:s=>w.eval(s),open(i){const b=w.document.querySelector('.function-help[data-i="'+i+'"]');b.focus();b.click();return b;},state:()=>plain(w.Task11Discovery.getState()),input(control,value){control.value=String(value);control.dispatchEvent(new w.Event('input',{bubbles:true}));}};
}
test('first ordinary visit offers three shapes; previous use, review and selftest retain their modes',()=>{
 const fresh=boot();try{
  assert.deepEqual(fresh.errors,[]);assert.equal(fresh.run('M4.task.starter'),true);
  assert.deepEqual(plain(fresh.run('M4.task.items.map(i=>({kind:i.family,params:i.params}))')),[{kind:'lin',params:{k:1,b:0}},{kind:'par',params:{a:1,b:0,c:0}},{kind:'hyp',params:{k:1}}]);
  assert.equal(fresh.w.document.querySelectorAll('#m4-desc .function-help').length,3);
  assert.equal(new Set([...fresh.el('m4-graphs').querySelectorAll('svg')].map(svg=>svg.innerHTML)).size,3);
  assert(!fresh.el('t11-help-dialog').open);assert.equal(fresh.w.localStorage.getItem(KEY),null);
  fresh.el('m4-next').click();assert(!fresh.run('M4.task.starter'));
 }finally{fresh.w.close();}
 for(const options of [{seen:true},{storage:{'oge-t11-grafiki':{v:1,solvedByType:{t43:2}}}},{query:'?selftest=1'},{query:'?mode=review',storage:{mistakes:{'oge-t11-grafiki|t44':{w:1,r:0}}}}]){
  const t=boot(options);try{assert(!t.run('M4.task.starter'));if(options.query==='?mode=review')assert.equal(t.run('M4.task.type'),'t44');assert.deepEqual(t.errors,[]);}finally{t.w.close();}
 }
});
test('per-function help keeps matching DOM, partial drafts, attempts and common progress intact',()=>{
 const t=boot({storage:{other:{v:1,solvedByType:{a:9}}}});try{
  const host=t.el('m4-match'),selects=[...t.el('m4-desc').querySelectorAll('select')];selects[0].value='2';selects[0].dispatchEvent(new t.w.Event('change'));
  const before=t.w.localStorage.getItem(KEY),key=plain(t.run('M4.task.key'));
  for(let i=0;i<3;i++){
   const button=t.open(i);assert(t.el('t11-help-dialog').open);assert.equal(t.w.document.activeElement,t.el('t11-help-close'));
   t.el('t11-help-start').click();assert(!t.el('t11-help-observation').hidden);t.el('t11-help-highlight').click();
   assert(t.el('t11-help-graph').querySelector('[data-discovery-highlight]'));
   t.el('t11-help-dialog').dispatchEvent(new t.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
   assert(!t.el('t11-help-dialog').open);assert.equal(t.w.document.activeElement,button);
   assert.equal(t.el('m4-match'),host);assert.equal(selects[0],t.el('m4-desc').querySelector('select'));assert.equal(selects[0].value,'2');assert.equal(selects[1].value,'');
   assert.deepEqual(plain(t.run('M4.task.key')),key);assert.equal(t.run('M4.attempts'),0);assert.equal(t.run('M4.done'),false);assert.equal(t.w.localStorage.getItem(KEY),before);
  }
  assert.equal(t.el('t11-help-dialog').querySelectorAll('input:not([type=range])').length,0,'No calculation answer fields');
  assert(!t.el('m4-good').classList.contains('show'));assert(t.el('m4-show').hidden);
  assert.deepEqual(t.errors,[]);
 }finally{t.w.close();}
});
test('three function states are isolated; changed formula has an honest comparison and reset',()=>{
 const t=boot();try{
  const states=[];
  for(let i=0;i<3;i++){
   t.open(i);const original=t.el('t11-help-formula').innerHTML;
   assert.equal(t.el('t11-help-original').innerHTML,original);assert(t.el('t11-help-changed').hidden);
   const control=t.el('t11-help-controls').querySelector('[data-param]');
   const value=control.tagName==='SELECT'?[...control.options].map(o=>o.value).find(v=>v!==control.value):control.max;
   t.input(control,value);assert.notEqual(t.el('t11-help-formula').innerHTML,original);assert.equal(t.el('t11-help-original').innerHTML,original);assert(!t.el('t11-help-changed').hidden);
   t.input(t.el('t11-help-x'),i+1);t.el('t11-help-start').click();if(i!==1)t.el('t11-help-highlight').click();
   states.push(t.state());t.el('t11-help-close').click();
  }
  for(let i=0;i<3;i++){t.open(i);assert.deepEqual(t.state(),states[i]);t.el('t11-help-close').click();}
  t.open(0);t.el('t11-help-reset').click();assert(!t.state().changed);assert.equal(t.el('t11-help-formula').innerHTML,t.el('t11-help-original').innerHTML);assert(t.el('t11-help-changed').hidden);
  t.el('t11-help-close').click();t.open(1);assert.deepEqual(t.state(),states[1]);t.el('t11-help-close').click();
  t.el('m4-next').click();assert.equal(t.state(),null);t.open(0);assert(!t.state().started);assert(!t.state().highlighted);assert(!t.state().changed);
  assert.deepEqual(t.errors,[]);
 }finally{t.w.close();}
});
test('all generated families expose exact task parameters and valid controls, including large coefficients',()=>{
 const t=boot({seen:true});try{
  const observed=new Set();
  for(const type of ['t41','t42','t43','t44','t45'])for(let trial=0;trial<8;trial++){
   t.run('M4.type="'+type+'";m4New()');
   for(let i=0;i<3;i++){
    t.open(i);const state=t.state();observed.add(state.kind);
    const samples=plain(t.run('[-3,-1,0,1,3].map(x=>({x,actual:M4.task.items['+i+'].plot.fn(x),model:Task11Lab.model(Task11Discovery.getState().kind,Task11Discovery.getState().values,x).y}))'));
    for(const p of samples)assert.equal(p.actual,p.model,type+' function '+i+' at '+p.x);
    for(const control of t.el('t11-help-controls').querySelectorAll('[data-param]')){
     assert.equal(Number(control.value),state.values[control.dataset.param],'No clamping of initial task coefficient');
     if(control.type==='range')assert(Number(control.min)<=Number(control.value)&&Number(control.value)<=Number(control.max));
     if(control.tagName==='SELECT'&&(state.kind==='par'||state.kind==='hyp'))assert(![...control.options].some(option=>Number(option.value)===0));
    }
    t.el('t11-help-start').click();t.el('t11-help-highlight').click();assert(t.el('t11-help-graph').querySelector('[data-discovery-highlight]'));
    assert.doesNotMatch(t.el('t11-help-graph').innerHTML,/NaN|Infinity/);t.el('t11-help-close').click();
   }
  }
  assert.deepEqual([...observed].sort(),['constant','hyp','lin','par','root']);assert.deepEqual(t.errors,[]);
 }finally{t.w.close();}
});
test('help supports keyboard focus, unique IDs alongside the old lab, and blocked storage',()=>{
 const t=boot({blocked:true});try{
  t.el('m4-hint').click();const button=t.open(0);
  const ids=[...t.w.document.querySelectorAll('[id]')].map(node=>node.id);assert.equal(new Set(ids).size,ids.length);
  t.el('t11-help-close').dispatchEvent(new t.w.KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true}));
  assert.equal(t.w.document.activeElement,t.el('t11-help-start'));
  t.el('t11-help-start').dispatchEvent(new t.w.KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}));assert.equal(t.w.document.activeElement,t.el('t11-help-close'));
  t.el('t11-help-close').click();assert.equal(t.w.document.activeElement,button);
  t.input(t.el('m4-answer'),t.run('M4.task.key.join("")'));t.el('m4-check').click();assert.match(t.el('m4-good').textContent,/Верно/);
  assert.deepEqual(t.errors,[]);
 }finally{t.w.close();}
});
test('nested explanations remain honest when a vertex is clipped or a hyperbola point is undefined',()=>{
 const t=boot();try{
  t.run('M4.task.items[1].params={a:1,b:10,c:-6}');t.open(1);
  t.el('t11-help-start').click();t.el('t11-help-highlight').click();
  assert.match(t.el('t11-help-look').textContent,/Вершина сейчас за краем/);
  assert.doesNotMatch(t.el('t11-help-graph').innerHTML,/NaN|Infinity/);t.el('t11-help-close').click();
  t.open(2);t.input(t.el('t11-help-x'),0);t.el('t11-help-start').click();t.el('t11-help-highlight').click();
  assert.match(t.el('t11-help-look').textContent,/нет точки/);assert.match(t.el('t11-help-readout').textContent,/не определено/);
  assert.equal(t.el('t11-help-graph').querySelectorAll('circle').length,0);assert.doesNotMatch(t.el('t11-help-graph').innerHTML,/NaN|Infinity/);
  assert.deepEqual(t.errors,[]);
 }finally{t.w.close();}
});
