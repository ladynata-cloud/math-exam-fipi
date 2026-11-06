'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const D=require('./data.js'),E=require('./engine.js');
const ROOT=path.resolve(__dirname,'../..'),STORE='mathExam.collegeLogarithms.v1';
function surface(options={}){
  const faults=[],vc=new VirtualConsole();vc.on('jsdomError',e=>faults.push(e.message));
  const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'index.html'),'utf8'),{url:'https://mathexam.space/trainers/college-logarithms/index.html'+(options.query||''),runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
  const w=dom.window;w.HTMLElement.prototype.scrollIntoView=function(){};
  if(options.seed)w.localStorage.setItem(STORE,options.seed);
  let reads=0,writes=0;
  const get=w.Storage.prototype.getItem,set=w.Storage.prototype.setItem;
  w.Storage.prototype.getItem=function(...args){reads++;return get.apply(this,args)};
  w.Storage.prototype.setItem=function(...args){writes++;return set.apply(this,args)};
  if(options.blocked)Object.defineProperty(w,'localStorage',{get(){throw new w.DOMException('Blocked','SecurityError')}});
  for(const script of w.document.querySelectorAll('script[src]')){const url=new URL(script.getAttribute('src'),w.location.href);assert.equal(url.origin,w.location.origin);w.eval(fs.readFileSync(path.join(ROOT,url.pathname),'utf8'))}
  function q(selector){const el=w.document.querySelector(selector);assert.ok(el,selector);return el}
  return {w,dom,faults,q,reads:()=>reads,writes:()=>writes,state:()=>JSON.parse(JSON.stringify(w.CollegeLogarithmsApp.snapshot())),click:selector=>q(selector).click(),
    fill(selector,value){const el=q(selector);el.value=String(value);el.dispatchEvent(new w.Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}))},
    open:id=>w.CollegeLogarithmsApp.openTask(id),stored:()=>get.call(w.localStorage,STORE),close(){assert.deepEqual(faults,[]);w.close()}};
}
function answer(f,s){
  if(s.kind==='choice')f.click('[data-choice="'+s.answer+'"]');
  if(s.kind==='number')f.fill('#answer',String(s.answer));
  if(s.kind==='point'){f.fill('#point-x',String(s.answer.x));f.fill('#point-y',String(s.answer.y))}
  if(s.kind==='interval'){f.fill('#interval-lo',s.answer.lo===null?'-∞':String(s.answer.lo));f.fill('#interval-hi',s.answer.hi===null?'+∞':String(s.answer.hi));f.fill('#interval-left',s.answer.loClosed?'[':'(');f.fill('#interval-right',s.answer.hiClosed?']':')')}
  if(s.kind==='transform')for(const key of ['base','h','k','sign'])f.fill('#graph-'+key,s.answer[key]);
  f.click('#check');
}
test('actual page completes all 102 journeys and retains accepted steps',()=>{
  const f=surface();try{
    assert.equal(D.tasks.length,102);
    for(const t of D.tasks){f.open(t.id);for(const s of t.steps){answer(f,s);assert.equal(f.state().stage,t.steps.indexOf(s)+1,t.id+' '+s.id);assert.equal(f.w.CollegeLogarithmsBoard.validateState(f.w.CollegeLogarithmsBoard.getState()),true,t.id+' valid state')}
      assert.equal(f.q('#completion').hidden,false);assert.equal(f.w.document.querySelectorAll('.history-item').length,t.steps.length,t.id+' retained steps');}
    assert.match(f.q('#progress-summary').textContent,/102 из 102/);
  }finally{f.close()}
});
test('hints and theory preserve drafts and assistance survives close and restart',()=>{
  const t=D.getTask('meaning-01'),f=surface({query:'?task='+t.id});try{
    const s=t.steps[0];if(s.kind==='choice')f.click('[data-choice="'+s.options[0].value+'"]');else f.fill('#answer','12');
    const draft=f.state().drafts[s.id];f.click('#hint-toggle');assert.equal(f.state().helpUsed,true);f.click('#hint-toggle');assert.equal(f.state().drafts[s.id],draft);f.click('#theory-toggle');assert.equal(f.state().drafts[s.id],draft);f.click('#theory-toggle');f.click('#restart');assert.equal(f.state().helpUsed,true);
  }finally{f.close()}
});
test('wrong answers keep work; malformed input is never credited and cannot poison the bridge',()=>{
  const t=D.tasks.find(t=>t.moduleId==='base'&&t.steps[0].kind==='number'),f=surface({query:'?task='+t.id});try{
    f.fill('#answer','');f.click('#check');assert.equal(f.state().stage,0);assert.equal(f.state().feedback,'invalid');
    f.fill('#answer','999');f.click('#check');f.click('#check');assert.equal(f.state().stage,0);assert.equal(f.state().errors.s1,2);assert.equal(f.q('#answer').value,'999');
    f.fill('#answer','<bad>\u0001');assert.ok(!/[<>\u0000-\u001f]/.test(f.state().drafts.s1));assert.equal(f.w.CollegeLogarithmsBoard.validateState(f.w.CollegeLogarithmsBoard.getState()),true);
  }finally{f.close()}
});
test('assessment hides hints, theory, graph controls and the unknown graph formula',()=>{
  const f=surface();try{for(const t of D.tasks.filter(t=>E.isAssessment(t))){f.open(t.id);assert.equal(f.q('#hint-toggle').hidden,true,t.id);assert.equal(f.q('#theory-toggle').hidden,true);assert.equal(f.q('#lab').hidden,true);assert.equal(f.q('#graph-formula').innerHTML,'');f.click('#hint-toggle');assert.equal(f.state().helpUsed,false)}}finally{f.close()}
});
test('standalone refresh restores the exact unfinished answer and task link',()=>{
  const t=D.tasks.find(t=>t.moduleId==='base'&&t.steps[0].kind==='number'),a=surface({query:'?task='+t.id});a.fill('#answer','1/');const seed=a.stored();a.close();
  const b=surface({seed});try{assert.equal(b.state().taskId,t.id);assert.equal(b.q('#answer').value,'1/');const link=new URL(b.q('#open-board').href);assert.equal(link.searchParams.get('trainer'),'/trainers/college-logarithms/index.html?task='+t.id)}finally{b.close()}
});
test('board entry does not access personal storage, including when storage is blocked',()=>{
  for(const blocked of [false,true]){const f=surface({query:'?board=1&task=meaning-02',blocked,seed:blocked?undefined:'private-marker'});try{f.click('#hint-toggle');f.open('graph-up-01');assert.equal(f.reads(),0);assert.equal(f.writes(),0);assert.equal(f.q('#personal-progress').hidden,true);if(!blocked)assert.equal(f.stored(),'private-marker')}finally{f.close()}}
});
test('graph exploration preserves the task draft and restores its model before checking',()=>{
  const t=D.tasks.find(t=>t.moduleId==='graph-up'),f=surface({query:'?task='+t.id});try{
    const before=f.state().drafts;f.click('#lab-toggle');f.fill('#graph-h','2');assert.equal(f.q('#check').disabled,true);f.click('#lab-toggle');assert.deepEqual(f.state().drafts,before);assert.deepEqual(f.state().graph,E.graphParams(t));assert.equal(f.q('#check').disabled,false);assert.equal(f.state().helpUsed,true);
  }finally{f.close()}
});
test('after an accepted transformation the graph lab restores the transformed model',()=>{
  const t=D.getTask('graph-moves-01'),f=surface({query:'?task='+t.id});try{
    answer(f,t.steps[0]);answer(f,t.steps[1]);assert.deepEqual(f.state().graph,t.targetGraph);
    const accepted=f.state().drafts.s2;f.click('#lab-toggle');f.fill('#graph-h','-3');f.click('#lab-toggle');
    assert.deepEqual(f.state().graph,t.targetGraph);assert.equal(f.state().drafts.s2,accepted);
    answer(f,t.steps[2]);assert.equal(f.state().stage,3);assert.deepEqual(f.state().graph,t.targetGraph);
  }finally{f.close()}
});
test('restarting retains prior mistakes when reporting first-try completion',()=>{
  const t=D.getTask('meaning-01'),f=surface({query:'?task='+t.id});try{
    const s=t.steps[0];f.click('[data-choice="'+s.options.find(o=>o.value!==s.answer).value+'"]');f.click('#check');f.click('#restart');
    assert.equal(f.state().errors.s1,1);for(const step of t.steps)answer(f,step);assert.equal(JSON.parse(f.stored()).results[t.id].firstTry,false);
  }finally{f.close()}
});
