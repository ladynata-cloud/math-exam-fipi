'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const ROOT=path.resolve(__dirname,'..');
const origin='https://board-fixture.invalid';
const empty=()=>({version:1,title:'Построение',objects:[],view:{axes:true,grid:true}});
function fixture(t,readOnly=false) {
  const dom=new JSDOM('<div id="host"></div>',{url:origin+'/trainers/group-board.html',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;
  w.TextEncoder=TextEncoder;
  w.eval(fs.readFileSync(path.join(ROOT,'trainers/group-trainer-frame.js'),'utf8'));
  const states=[],locks=[],messages=[];
  const wrap=new w.GroupTrainerFrame(w.document.getElementById('host'),{trainerId:'spacemath',assignmentId:'synthetic-workspace',state:w.JSON.parse(JSON.stringify(empty())),readOnly,onState:s=>states.push(s)});
  const child=new JSDOM('<html><head></head><body><main class="workspace"></main></body></html>',{url:wrap.iframe.src,runScripts:'outside-only'});
  let state=empty();
  child.window.SpaceMathApp={setReadOnly:value=>locks.push(value)};
  child.window.postMessage=(data,targetOrigin)=>{
    assert.equal(targetOrigin,origin);messages.push(data);
    if(data.type==='mathexam:hydrate'&&data.state)state=JSON.parse(JSON.stringify(data.state));
    if(data.type==='mathexam:apply-trainer-state')state=JSON.parse(JSON.stringify(data.state));
    if(data.type==='mathexam:request-trainer-state')queueMicrotask(()=>send('mathexam:trainer-state',{state}));
  };
  Object.defineProperty(wrap.iframe,'contentWindow',{get:()=>child.window});
  Object.defineProperty(wrap.iframe,'contentDocument',{get:()=>child.window.document});
  function send(type,extra={},options={}) {
    const data={type,protocolVersion:1,trainerId:'spacemath',trainerVersion:'1.0.0',stateSchemaVersion:1,bridgeInstanceId:'synthetic-bridge',...extra};
    w.dispatchEvent(new w.MessageEvent('message',{source:options.source||child.window,origin:options.origin||origin,data:w.JSON.parse(JSON.stringify(data))}));
  }
  t.after(()=>{wrap.destroy();child.window.close();w.close();});
  return {w,wrap,child,states,locks,messages,send,setState:value=>{state=value;}};
}
test('SpaceMath hydration is credential-free and locks the actual editor until ready',async t=>{
  const f=fixture(t);
  assert.equal(f.wrap.iframe.src,origin+'/trainers/spacemath/index.html?groupLesson=1');
  f.send('mathexam:trainer-ready');
  assert.equal(f.locks.at(-1),true);
  await f.wrap.getState();
  assert.equal(f.locks.at(-1),false);
  assert.equal(f.wrap.element.dataset.status,'ready');
  assert.equal(f.states.length,0,'initial hydration must not create an edit');
  const css=f.child.window.document.getElementById('group-trainer-presentation').textContent;
  assert.ok(css.includes('.jxgbox'));assert.ok(!css.includes('.grid>aside'));
  f.wrap.update({readOnly:true});assert.equal(f.locks.at(-1),true);
  assert.equal(f.wrap.iframe.style.pointerEvents,'none');
});
test('geometry state only accepts the current origin, source and bridge; observer cannot emit edits',async t=>{
  const f=fixture(t);
  f.send('mathexam:trainer-ready');await f.wrap.getState();
  const state={...empty(),objects:[{id:'A',type:'point',label:'A',x:1,y:2}]};
  f.send('mathexam:trainer-state',{state},{origin:'https://other.invalid'});
  f.send('mathexam:trainer-state',{state},{source:f.w});
  f.send('mathexam:trainer-state',{state,bridgeInstanceId:'stale-bridge'});
  assert.equal(f.states.length,0);
  f.send('mathexam:trainer-state',{state});assert.equal(f.states.length,1);
  f.wrap.update({readOnly:true});
  f.send('mathexam:trainer-state',{state:{...state,title:'Observer attempt'}});
  assert.equal(f.states.length,1);
});
test('snapshot flush includes a pending edit and remote hydration does not echo',async t=>{
  const f=fixture(t);
  f.send('mathexam:trainer-ready');await f.wrap.getState();
  f.setState({...empty(),title:'Последняя правка'});
  const flushed=await f.wrap.getState();
  assert.equal(flushed.title,'Последняя правка');assert.equal(f.states.length,1);
  f.wrap.update({state:f.w.JSON.parse(JSON.stringify({...empty(),title:'С сервера'})),readOnly:false});
  const restored=await f.wrap.getState();
  assert.equal(restored.title,'С сервера');assert.equal(f.states.length,1);
});
test('unlisted URLs cannot be embedded as group materials',t=>{
  const f=fixture(t);
  assert.throws(()=>new f.w.GroupTrainerFrame(f.w.document.getElementById('host'),{trainerId:'https://untrusted.invalid',assignmentId:'synthetic-workspace'}),/пока не поддерживает/);
});
