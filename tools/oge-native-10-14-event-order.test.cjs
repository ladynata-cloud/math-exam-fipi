'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..');
const files={10:'oge-task10-probability.html',11:'oge-task11-graphs-trainer.html',12:'oge-task12-formulas-trainer.html',13:'oge13-inequalities-series.html',14:'oge-task14-progressions.html'};
const help={10:'#mar-root .minimal-hint',11:'#m4-hint',12:'#taskArea .minimal-hint',13:'#hintToggle',14:'#m-solve'};
class Local extends ResourceLoader{fetch(url){const u=new URL(url),file=path.join(root,u.pathname);if(u.origin!=='https://mathexam.space'||!fs.existsSync(file))return null;if(u.pathname.endsWith('/board-bridge.js'))return Promise.resolve(Buffer.from('window.MathExamBoard={register(spec){window.__eventOrderSpec=spec;}};'));return Promise.resolve(fs.readFileSync(file));}}
const settle=()=>new Promise(resolve=>setTimeout(resolve,15));
const copy=(w,state)=>w.JSON.parse(JSON.stringify(state));
async function boot(n){
 const errors=[],published=[],capture=new Map(),vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error.message));
 const dom=new JSDOM(fs.readFileSync(path.join(root,'trainers',files[n]),'utf8'),{url:'https://mathexam.space/trainers/'+files[n]+'?board=1',runScripts:'dangerously',resources:new Local(),pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
  w.scrollTo=()=>{};w.matchMedia=()=>({matches:true,addListener(){},removeListener(){}});w.HTMLElement.prototype.scrollIntoView=()=>{};
  const add=w.document.addEventListener.bind(w.document);
  // Unlike scripted dispatchEvent(), native browser dispatch can checkpoint
  // microtasks after capture and before the application's target listeners.
  // Keep the actual adapter's capture callback and native handler separate.
  w.document.addEventListener=function(name,callback,options){
   if(options===true&&callback.name==='record'){
    capture.set(name,callback);return add(name,event=>{if(!w.__skipAdapterCapture)callback(event);},options);
   }
   return add(name,callback,options);
  };
 }});
 const w=dom.window,d=w.document;await new Promise(resolve=>w.addEventListener('load',resolve,{once:true}));await settle();assert.deepEqual(errors,[]);
 const spec=w.__eventOrderSpec;assert(spec);spec.subscribe(()=>published.push(JSON.parse(JSON.stringify(spec.getState()))));
 return {w,d,spec,published,errors,
  async capture(name,target){assert(capture.has(name));capture.get(name)({type:name,target});await Promise.resolve();await Promise.resolve();},
  native(fn){w.__skipAdapterCapture=true;try{fn();}finally{w.__skipAdapterCapture=false;}},
  close(){assert.deepEqual(errors,[]);w.close();}
 };
}
for(const n of [10,11,12,13,14])test(`OGE${n}: help notification waits for native target handlers, with no second event`,async()=>{
 const a=await boot(n),b=await boot(n);try{
  const button=a.d.querySelector(help[n]);assert(button);
  await a.capture('click',button);
  assert.equal(a.published.length,0,'Capture cannot publish a partially dispatched native action');
  a.native(()=>button.click());await settle();
  assert.equal(a.published.length,1,'The completed first action publishes without another event');
  assert.deepEqual(a.published[0],JSON.parse(JSON.stringify(a.spec.getState())));
  b.spec.applyState(copy(b.w,a.published[0]));await settle();
  assert.equal(JSON.stringify(b.spec.getState()),JSON.stringify(a.spec.getState()));assert.equal(b.published.length,0,'Remote restore does not echo');
 }finally{a.close();b.close();}
});
test('OGE10: a first optional model click publishes its changed outcomes after capture checkpoint',async()=>{
 const a=await boot(10),b=await boot(10);try{
  a.d.querySelector(help[10]).click();a.d.querySelector('.oca-exploration summary').click();await settle();a.published.length=0;
  const button=a.d.querySelector('.oca-outcomes button');assert(button);assert.equal(button.getAttribute('aria-pressed'),'false');
  await a.capture('click',button);assert.equal(a.published.length,0);
  a.native(()=>button.click());assert.equal(button.getAttribute('aria-pressed'),'true');await settle();
  assert.equal(a.published.length,1,'An unchanged pre-handler snapshot must not suppress the model action');
  assert.deepEqual(a.published[0].algebra.cards[0].lab.marks,[0]);
  b.spec.applyState(copy(b.w,a.published[0]));await settle();assert.equal(b.d.querySelector('.oca-outcomes button').getAttribute('aria-pressed'),'true');assert.equal(b.published.length,0);
 }finally{a.close();b.close();}
});
test('OGE12: input and check coalesce to completed native state after capture checkpoints',async()=>{
 const a=await boot(12);try{
  const field=a.d.getElementById('ansIn'),button=a.d.getElementById('checkBtn');field.value='999999';
  await a.capture('input',field);a.native(()=>field.dispatchEvent(new a.w.Event('input',{bubbles:true})));
  await a.capture('click',button);assert.equal(a.published.length,0);
  a.native(()=>button.click());await settle();assert.equal(a.published.length,1);assert.match(a.d.getElementById('fb').textContent,/не сходится|Проверь|Пока/);
  assert.deepEqual(a.published[0],JSON.parse(JSON.stringify(a.spec.getState())));
 }finally{a.close();}
});
test('OGE10: pending dispatch notification remains silent after remote hydration',async()=>{
 const a=await boot(10),b=await boot(10);try{
  await a.capture('click',a.d.querySelector(help[10]));
  a.spec.applyState(copy(a.w,b.spec.getState()));await settle();
  assert.equal(a.published.length,0,'A queued timer must not echo the state applied remotely');
  assert.equal(JSON.stringify(a.spec.getState()),JSON.stringify(b.spec.getState()));
 }finally{a.close();b.close();}
});
