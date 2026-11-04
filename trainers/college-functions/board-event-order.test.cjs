'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

// A scripted element.click()/dispatchEvent() in jsdom keeps one JS stack around
// every listener. Native browser events may instead checkpoint microtasks after
// capture, before the app's target/bubble listeners update the learner state.
function fixture(t){
  const captured=new Map(),timers=new Set(),published=[];
  let current,registration;
  const context=vm.createContext({
    location:{origin:'https://mathexam.space'},
    document:{addEventListener(name,callback,capture){assert.equal(capture,true);captured.set(name,callback);}},
    setTimeout(callback,delay){const timer=setTimeout(()=>{timers.delete(timer);callback();},delay);timers.add(timer);return timer;},
    MathExamBoard:{register(config){registration=config;config.subscribe(()=>published.push(JSON.parse(JSON.stringify(config.getState()))));}}
  });
  context.window=context;
  for(const filename of ['data.js','engine.js','board.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,filename),'utf8'),context,{filename});
  current=vm.runInContext(`({taskId:'B1',mode:'learn',stage:0,
    drafts:Object.fromEntries(CollegeFunctionsBoardAdapter.draftKeys.map(key=>[key,''])),
    marked:0,helpUsed:false,hintLevel:0,hintOpen:false,errors:0,feedback:'none',
    diagnostic:{open:false,index:0,answers:[]},panels:{reference:false,cheatsheet:false}})`,context);
  context.CollegeFunctionsBoardAdapter.create({read:()=>current,write:state=>{current=state;captured.get('toggle')();}});
  t.after(()=>{for(const timer of timers)clearTimeout(timer);});
  return {
    published,
    state:()=>current,
    apply:state=>registration.applyState(state),
    async capture(name){captured.get(name)();await Promise.resolve();await Promise.resolve();},
    settled:()=>new Promise(resolve=>setTimeout(resolve,10))
  };
}

test('native input and check notifications include their own completed app handlers without another event',async t=>{
  const f=fixture(t);
  await f.capture('input'); // Native capture listener returns; microtasks run.
  assert.equal(f.published.length,0,'Capture must not publish before the app handles input');
  f.state().drafts.domain='[-2; +∞)'; // The app's input listener runs afterward.
  await f.settled();
  assert.equal(f.published.length,1,'The first input publishes without a second event');
  assert.equal(f.published[0].drafts.domain,'[-2; +∞)');

  await f.capture('click');
  assert.equal(f.published.length,1,'The check click waits for the app listener');
  f.state().stage=1;
  f.state().feedback='step-correct';
  await f.settled();
  assert.equal(f.published.length,2,'One check click immediately publishes its completed step');
  assert.equal(f.published[1].stage,1);
  assert.equal(f.published[1].feedback,'step-correct');
});

test('nested input/change/click notifications coalesce to the final state after dispatch',async t=>{
  const f=fixture(t);
  await f.capture('input');f.state().drafts.domain='[-2;';
  await f.capture('change');f.state().drafts.domain='[-2; +∞)';
  await f.capture('click');f.state().stage=1;f.state().feedback='step-correct';
  assert.equal(f.published.length,0,'Intermediate listener state is never sent');
  await f.settled();
  assert.equal(f.published.length,1);
  assert.equal(f.published[0].stage,1);
  assert.equal(f.published[0].drafts.domain,'[-2; +∞)');
});

test('remote apply while a notification is queued stays silent after the dispatch timer',async t=>{
  const f=fixture(t);
  await f.capture('click');
  const remote=f.state();remote.drafts.domain='[-2; +∞)';remote.stage=1;remote.feedback='step-correct';
  f.apply(remote); // The renderer's toggle event occurs while apply is guarded.
  await f.settled();
  assert.equal(f.state().stage,1);
  assert.equal(f.published.length,0,'The pending timer must not echo the applied state');
});
