'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const ROOT=path.resolve(__dirname,'..');
const origin='https://board-fixture.invalid';
const empty=()=>({version:1,title:'Построение',objects:[],view:{axes:true,grid:true,viewport:{x:0,y:0,span:12}}});
function fixture(t,readOnly=false,{preview=false,editorLock=true}={}) {
  const dom=new JSDOM('<div id="host"></div>',{url:origin+'/trainers/group-board.html',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;
  w.TextEncoder=TextEncoder;
  w.eval(fs.readFileSync(path.join(ROOT,'trainers/group-trainer-frame.js'),'utf8'));
  const states=[],locks=[],messages=[],focuses=[];
  const wrap=new w.GroupTrainerFrame(w.document.getElementById('host'),{trainerId:'spacemath',assignmentId:'synthetic-workspace',state:w.JSON.parse(JSON.stringify(empty())),readOnly,preview,onState:s=>states.push(s),onWorkspaceFocus:value=>focuses.push(value)});
  const child=new JSDOM('<html><head></head><body><main class="workspace"></main></body></html>',{url:wrap.iframe.src,runScripts:'outside-only'});
  let state=empty();
  child.window.SpaceMathApp=editorLock?{setReadOnly:value=>locks.push(value)}:{};
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
  return {w,wrap,child,states,locks,messages,focuses,send,setState:value=>{state=value;}};
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
  assert.equal(f.child.window.document.documentElement.dataset.spacemathEmbedded,'true');
  assert.equal(f.child.window.document.documentElement.dataset.spacemathPreview,'false');
  assert.ok(!css.includes('.jxgbox'),'interactive geometry sizing belongs to the editor, including its local focus mode');
  assert.ok(!css.includes('.grid>aside'));
  f.wrap.update({readOnly:true});assert.equal(f.locks.at(-1),true);
  assert.equal(f.wrap.iframe.style.pointerEvents,'auto','ready observer may scroll the editor');
  assert.equal(f.child.window.document.body.inert,false);
  assert.equal(f.wrap.viewport.inert,false);
  assert.equal(f.wrap.overlay.style.display,'none');
  assert.equal(f.wrap.iframe.tabIndex,0);
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
  assert.equal(f.locks.at(-1),true,'document is scrollable only with actual editor lock');
  assert.equal(f.wrap.iframe.style.pointerEvents,'auto');
  f.send('mathexam:trainer-state',{state:{...state,title:'Observer attempt'}});
  assert.equal(f.states.length,1);
});
test('SpaceMath preview or missing editor lock retains its full input shield',async t=>{
  for(const options of [{preview:true},{editorLock:false}]) {
    const f=fixture(t,true,options);
    f.send('mathexam:trainer-ready');await f.wrap.getState();
    assert.equal(f.wrap.element.dataset.status,'ready');
    assert.equal(f.wrap.iframe.style.pointerEvents,'none');
    assert.equal(f.child.window.document.body.inert,true);
    assert.equal(f.wrap.viewport.inert,true);
    assert.equal(f.wrap.overlay.style.display,'block');
    assert.equal(f.wrap.iframe.tabIndex,-1);
    if(options.preview){
      assert.equal(f.child.window.document.documentElement.dataset.spacemathPreview,'true');
      const css=f.child.window.document.getElementById('group-trainer-presentation').textContent;
      assert.match(css,/\.workspace-controls/,'preview hides local layout buttons');
      assert.match(css,/height:480px!important/,'preview retains its fixed drawing size');
    }
    f.send('mathexam:trainer-state',{state:{...empty(),title:'Blocked observer attempt'}});
    assert.equal(f.states.length,0);
  }
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
test('local focus is accepted only from the ready current SpaceMath window, including readonly observers',async t=>{
  const f=fixture(t,true), win=f.child.window;
  const event=value=>new win.CustomEvent('mathexam:spacemath-layout',{detail:{focused:value},bubbles:true});
  win.dispatchEvent(event(true));
  assert.deepEqual(f.focuses,[],'unhydrated editor cannot take over host layout');
  f.send('mathexam:trainer-ready');await f.wrap.getState();
  f.w.dispatchEvent(new f.w.CustomEvent('mathexam:spacemath-layout',{detail:{focused:true}}));
  win.document.dispatchEvent(event(true));
  win.dispatchEvent(event('true'));
  assert.deepEqual(f.focuses,[],'parent, descendant and malformed events are ignored');
  win.history.replaceState(null,'','/unsupported.html');
  win.dispatchEvent(event(true));
  assert.deepEqual(f.focuses,[],'a navigated-away document cannot change layout');
  win.history.replaceState(null,'','/trainers/spacemath/index.html?groupLesson=1');
  win.document.documentElement.dataset.workspaceFocus='true';win.dispatchEvent(event(true));
  assert.deepEqual(f.focuses,[true]);
  assert.equal(f.locks.at(-1),true,'focus does not grant model control');
  let exits=0;win.addEventListener('mathexam:spacemath-exit-focus',()=>exits++);
  f.wrap.exitWorkspaceFocus();
  assert.deepEqual(f.focuses,[true,false]);assert.equal(exits,1);
  assert.deepEqual(f.states,[],'layout produces no saved geometry event');
});
test('preview cannot focus the host and an active focus ends on frame failure or destruction',async t=>{
  const preview=fixture(t,true,{preview:true});
  preview.send('mathexam:trainer-ready');await preview.wrap.getState();
  preview.child.window.dispatchEvent(new preview.child.window.CustomEvent('mathexam:spacemath-layout',{detail:{focused:true}}));
  assert.deepEqual(preview.focuses,[]);
  for(const failure of [true,false]){
    const f=fixture(t),win=f.child.window;
    f.send('mathexam:trainer-ready');await f.wrap.getState();
    win.document.documentElement.dataset.workspaceFocus='true';
    win.dispatchEvent(new win.CustomEvent('mathexam:spacemath-layout',{detail:{focused:true}}));
    if(failure)win.dispatchEvent(new win.CustomEvent('mathexam:bridge-diagnostic',{detail:{trainerId:'spacemath',bridgeInstanceId:'synthetic-bridge',code:'state-unavailable'}}));
    else f.wrap.destroy();
    assert.deepEqual(f.focuses,[true,false]);
    assert.deepEqual(f.states,[]);
  }
});
